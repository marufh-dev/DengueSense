"""Admin dashboard and system management routes."""

import logging
from flask import Blueprint, g, jsonify, request
from app.auth import require_role
from app.db import get_service_client
from app.ingestion import ingest_weather
from app.notifications import dispatch_high_risk_alerts

logger = logging.getLogger("denguesense.admin")
admin_bp = Blueprint("admin", __name__)
VALID_ROLES = {"citizen", "moderator", "admin"}


@admin_bp.route("/api/admin/overview", methods=["GET"])
@require_role("admin")
def get_admin_overview():
    svc = get_service_client()

    # Total users
    users_res = svc.table("user_profiles").select("id", count="exact").execute()
    total_users = users_res.count or len(users_res.data or [])

    # Total reports
    reports_res = svc.table("crowd_reports").select("id, status", count="exact").execute()
    total_reports = reports_res.count or len(reports_res.data or [])
    pending_reports = sum(1 for r in (reports_res.data or []) if r.get("status") == "PENDING")

    # Active alert subscriptions
    subs_res = svc.table("alert_subscriptions").select("id", count="exact").eq("is_active", True).execute()
    active_subs = subs_res.count or len(subs_res.data or [])

    # Ingestion logs
    logs = (
        svc.table("ingestion_logs")
        .select("id, job_name, status, districts_updated, records_upserted, missing_districts, error_summary, started_at, completed_at")
        .order("started_at", desc=True)
        .limit(5)
        .execute()
        .data
    )

    # Latest risk score count
    risk_res = svc.table("daily_risk_scores").select("district_id, risk_level").order("score_date", desc=True).limit(64).execute()
    districts_with_risk = len(set(r["district_id"] for r in (risk_res.data or [])))
    high_critical_count = sum(1 for r in (risk_res.data or []) if r.get("risk_level") in ("HIGH", "CRITICAL"))

    return jsonify({
        "overview": {
            "total_users": total_users,
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "active_alert_subs": active_subs,
            "districts_monitored": districts_with_risk,
            "high_critical_districts": high_critical_count,
            "latest_ingest": logs[0] if logs else None,
            "recent_logs": logs or [],
        }
    }), 200


@admin_bp.route("/api/admin/users", methods=["GET"])
@require_role("admin")
def list_admin_users():
    svc = get_service_client()
    profiles = (
        svc.table("user_profiles")
        .select("id, display_name, role, created_at, updated_at")
        .order("created_at", desc=False)
        .execute()
        .data
    ) or []

    # Map auth email
    email_map = {}
    try:
        users_resp = svc.auth.admin.list_users()
        user_list = getattr(users_resp, "users", users_resp) or []
        for u in user_list:
            u_id = str(getattr(u, "id", ""))
            u_email = getattr(u, "email", "")
            if u_id:
                email_map[u_id] = u_email
    except Exception as exc:
        logger.warning("Could not list auth users: %s", exc)

    enriched = []
    for p in profiles:
        p_id = str(p.get("id"))
        enriched.append({
            "id": p_id,
            "display_name": p.get("display_name") or "User",
            "email": email_map.get(p_id, "—"),
            "role": p.get("role", "citizen"),
            "created_at": p.get("created_at"),
        })

    return jsonify({"users": enriched}), 200


@admin_bp.route("/api/admin/users/<user_id>/role", methods=["PATCH"])
@require_role("admin")
def update_user_role(user_id: str):
    svc = get_service_client()
    current_admin = g.current_user
    body = request.get_json(silent=True) or {}
    new_role = str(body.get("role", "")).strip().lower()

    if new_role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}"}), 400

    # Prevent admin from demoting themselves if they are the only admin
    if user_id == current_admin["id"] and new_role != "admin":
        admin_count_res = svc.table("user_profiles").select("id", count="exact").eq("role", "admin").execute()
        if (admin_count_res.count or len(admin_count_res.data or [])) <= 1:
            return jsonify({"error": "Cannot demote the only remaining administrator."}), 400

    update_res = (
        svc.table("user_profiles")
        .update({"role": new_role})
        .eq("id", user_id)
        .execute()
    )
    if not update_res.data:
        return jsonify({"error": "User profile not found."}), 404

    return jsonify({"user": update_res.data[0], "message": f"Role updated to {new_role}."}), 200


@admin_bp.route("/api/admin/trigger-ingest", methods=["POST"])
@require_role("admin")
def trigger_ingest():
    body = request.get_json(silent=True) or {}
    days_back = int(body.get("days_back", 1))
    days_back = max(1, min(14, days_back))

    try:
        summary = ingest_weather(days_back=days_back, include_air_quality=True)
        return jsonify({"success": True, "summary": summary}), 200
    except Exception as exc:
        logger.exception("Manual ingestion failed: %s", exc)
        return jsonify({"error": f"Ingestion error: {str(exc)}"}), 500


@admin_bp.route("/api/admin/dispatch-alerts", methods=["POST"])
@require_role("admin")
def trigger_alert_dispatch():
    body = request.get_json(silent=True) or {}
    force = bool(body.get("force", True))
    try:
        stats = dispatch_high_risk_alerts(force=force)
        return jsonify({"success": True, "stats": stats}), 200
    except Exception as exc:
        logger.exception("Manual alert dispatch failed: %s", exc)
        return jsonify({"error": f"Alert dispatch error: {str(exc)}"}), 500
