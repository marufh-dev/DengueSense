"""Backend unit, API, and negative security tests."""

import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from app.config import Config
from app.db import get_anon_client, get_service_client
from app.risk_engine import (
    calculate_community_signal,
    calculate_environmental_score,
    classify_risk_level,
)


def test_weights_sum_to_one():
    total = Config.ENV_WEIGHT_RAINFALL + Config.ENV_WEIGHT_TEMPERATURE + Config.ENV_WEIGHT_HUMIDITY
    assert abs(total - 1.0) < 1e-6


def test_missing_data_returns_no_data():
    res = calculate_environmental_score(None, 80.0, 120.0, "2026-11-26", rain_days_count=14)
    assert res["environmental_score"] is None
    assert res["risk_level"] == "NO DATA"
    assert "temp_mean" in res["score_explanation"]["missing_variables"]


def test_optimal_conditions_high_or_critical():
    res = calculate_environmental_score(28.0, 86.0, 180.0, "2026-11-26", rain_days_count=21)
    assert res["environmental_score"] is not None
    assert res["environmental_score"] >= 75.0
    assert res["risk_level"] == "CRITICAL"


def test_community_signal_excludes_suspected_dengue():
    reports = [
        {"status": "APPROVED", "report_type": "SUSPECTED_DENGUE_REPORT"},
        {"status": "PENDING", "report_type": "WATERLOGGING"},
    ]
    assert calculate_community_signal(reports) == 0.0
    assert classify_risk_level(None) == "NO DATA"


def test_api_public_endpoints():
    app = create_app()
    client = app.test_client()

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.get_json()["districts_count"] == 64

    risk = client.get("/api/districts/risk")
    assert risk.status_code == 200
    data = risk.get_json()
    assert data["total_districts"] == 64
    dhaka = next(d for d in data["districts"] if d["name_en"] == "Dhaka")

    detail = client.get(f"/api/districts/{dhaka['id']}")
    assert detail.status_code == 200
    assert detail.get_json()["district"]["name_en"] == "Dhaka"

    hist = client.get(f"/api/districts/{dhaka['id']}/history?days=30")
    assert hist.status_code == 200
    assert len(hist.get_json()["weather_history"]) > 0


def test_api_security_unauthenticated_rejected():
    app = create_app()
    client = app.test_client()

    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/reports", json={}).status_code == 401
    assert client.post("/api/reports/00000000-0000-0000-0000-000000000000/vote", json={"vote": 1}).status_code == 401
    assert client.get("/api/moderation/reports").status_code == 401
    assert client.post("/api/moderation/reports/00000000-0000-0000-0000-000000000000", json={"action": "APPROVE"}).status_code == 401
    assert client.get("/api/alerts").status_code == 401
    assert client.post("/api/alerts", json={}).status_code == 401
    assert client.delete("/api/alerts/00000000-0000-0000-0000-000000000000").status_code == 401
    assert client.get("/api/admin/overview").status_code == 401
    assert client.get("/api/admin/users").status_code == 401


def test_authenticated_citizen_reporting_and_rbac():
    svc = get_service_client()
    anon = get_anon_client()
    email = f"qa_{uuid.uuid4().hex[:8]}@denguesense.test"
    password = "TestPassword!2026"

    created = svc.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"display_name": "QA Citizen"},
    })
    uid = str(created.user.id)
    try:
        signed = anon.auth.sign_in_with_password({"email": email, "password": password})
        token = signed.session.access_token
        headers = {"Authorization": f"Bearer {token}"}

        app = create_app()
        client = app.test_client()

        me = client.get("/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.get_json()["role"] == "citizen"

        # Citizen must get 403 on moderation and admin
        mod_denied = client.get("/api/moderation/reports", headers=headers)
        assert mod_denied.status_code == 403
        admin_denied = client.get("/api/admin/overview", headers=headers)
        assert admin_denied.status_code == 403

        # Valid report creation -> 201 PENDING + generalized coords
        dhaka = svc.table("districts").select("id").eq("name_en", "Dhaka").single().execute().data
        rep = client.post(
            "/api/reports",
            json={
                "district_id": dhaka["id"],
                "report_type": "WATERLOGGING",
                "latitude": 23.81234,
                "longitude": 90.41567,
                "description": "QA test stagnant water drainage check",
            },
            headers=headers,
        )
        assert rep.status_code == 201
        rep_json = rep.get_json()["report"]
        assert rep_json["status"] == "PENDING"
        assert rep_json["latitude"] == 23.81
        assert rep_json["longitude"] == 90.42

        # Duplicate report within 24h -> 409
        dup = client.post(
            "/api/reports",
            json={
                "district_id": dhaka["id"],
                "report_type": "WATERLOGGING",
                "latitude": 23.81234,
                "longitude": 90.41567,
                "description": "Duplicate QA test report",
            },
            headers=headers,
        )
        assert dup.status_code == 409

        # Alert subscription CRUD + 404 on non-existent/unowned delete
        sub_res = client.post(
            "/api/alerts",
            json={"district_id": dhaka["id"], "radius_km": 15, "notification_channels": ["email"]},
            headers=headers,
        )
        assert sub_res.status_code == 201
        sub_id = sub_res.get_json()["subscription"]["id"]

        list_res = client.get("/api/alerts", headers=headers)
        assert list_res.status_code == 200
        assert len(list_res.get_json()["subscriptions"]) == 1

        not_found_del = client.delete("/api/alerts/00000000-0000-0000-0000-000000000000", headers=headers)
        assert not_found_del.status_code == 404

        del_res = client.delete(f"/api/alerts/{sub_id}", headers=headers)
        assert del_res.status_code == 200

        # Telegram test ping validation
        tg_res = client.post("/api/alerts/test-telegram", json={}, headers=headers)
        assert tg_res.status_code == 400
        assert "Telegram Chat ID is required" in tg_res.get_json()["error"]
    finally:
        svc.auth.admin.delete_user(uid)


def test_auth_registration_and_validation():
    from unittest.mock import patch

    app = create_app()
    client = app.test_client()
    svc = get_service_client()

    bad_res = client.post("/api/auth/register", json={"email": "invalid", "password": "pass"})
    assert bad_res.status_code == 400

    test_email = f"pytest_reg_{uuid.uuid4().hex[:6]}@example.com"

    with patch("app.routes.auth_routes.send_email_message", return_value=True):
        reg_res = client.post(
            "/api/auth/register",
            json={
                "email": test_email,
                "password": "ValidPassword123!",
                "display_name": "Pytest Citizen",
            },
        )
        assert reg_res.status_code == 201
        reg_data = reg_res.get_json()
        assert reg_data["status"] == "success"
        user_id = reg_data["user"]["id"]

        try:
            dup_res = client.post(
                "/api/auth/register",
                json={
                    "email": test_email,
                    "password": "ValidPassword123!",
                    "display_name": "Duplicate Citizen",
                },
            )
            assert dup_res.status_code == 409
        finally:
            if user_id:
                svc.auth.admin.delete_user(user_id)
