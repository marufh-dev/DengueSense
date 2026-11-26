"""Backend unit, API, and negative security tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from app.config import Config
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

    assert client.post("/api/reports", json={}).status_code == 401
    assert client.post("/api/reports/00000000-0000-0000-0000-000000000000/vote", json={"vote": 1}).status_code == 401
    assert client.get("/api/moderation/reports").status_code == 401
    assert client.post("/api/moderation/reports/00000000-0000-0000-0000-000000000000", json={"action": "APPROVE"}).status_code == 401
    assert client.get("/api/alerts").status_code == 401
    assert client.post("/api/alerts", json={}).status_code == 401
    assert client.delete("/api/alerts/00000000-0000-0000-0000-000000000000").status_code == 401
