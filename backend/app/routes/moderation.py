"""Moderator and administrator report review routes."""

from flask import Blueprint, g, jsonify, request
from app.auth import require_role
from app.db import get_service_client
from app.ingestion import recompute_risk_scores

moderation_bp = Blueprint("moderation", __name__)


@moderation_bp.route("/api/moderation/reports", methods=["GET"])
@require_role("moderator", "admin")
def list_moderation_reports():
    svc = get_service_client()
    status_filter = request.args.get("status", "PENDING").strip().upper()
    priority_filter = request.args.get("priority", "").strip().upper()
    query = svc.table("crowd_reports").select(
        "id, user_id, district_id, report_type, latitude, longitude, description, photo_path, status, is_rain_event, congestion_level, priority, moderator_notes, expires_at, created_at, districts(name_en, division)"
    )
    if status_filter in {"PENDING", "APPROVED", "REJECTED", "EXPIRED"}:
        query = query.eq("status", status_filter)
    if priority_filter in {"STANDARD", "HIGH_WATERLOGGING_ALERT"}:
        query = query.eq("priority", priority_filter)
    res = query.order("created_at", desc=True).limit(100).execute()
    return jsonify({"reports": res.data or []}), 200


@moderation_bp.route("/api/moderation/reports/<report_id>", methods=["POST"])
@require_role("moderator", "admin")
def moderate_report(report_id: str):
    svc = get_service_client()
    moderator = g.current_user
    body = request.get_json(silent=True) or {}
    action = str(body.get("action", "")).strip().upper()
    notes = str(body.get("notes", "")).strip()[:500]

    if action not in {"APPROVE", "REJECT"}:
        return jsonify({"error": "action must be APPROVE or REJECT"}), 400

    rep = svc.table("crowd_reports").select("id, status, district_id").eq("id", report_id).maybe_single().execute()
    if not rep or not rep.data:
        return jsonify({"error": "Report not found"}), 404

    prev_status = rep.data["status"]
    new_status = "APPROVED" if action == "APPROVE" else "REJECTED"

    svc.table("crowd_reports").update({
        "status": new_status,
        "moderator_notes": notes or None,
    }).eq("id", report_id).execute()

    svc.table("moderation_audit_history").insert({
        "report_id": report_id,
        "moderator_id": moderator["id"],
        "previous_status": prev_status,
        "new_status": new_status,
        "notes": notes or None,
    }).execute()

    # Update community signal scores
    try:
        recompute_risk_scores()
    except Exception:
        pass

    return jsonify({
        "report_id": report_id,
        "previous_status": prev_status,
        "new_status": new_status,
    }), 200
