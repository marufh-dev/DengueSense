"""User alert subscription and notification history routes."""

import os
import requests
from flask import Blueprint, g, jsonify, request
from app.auth import require_auth
from app.db import get_service_client

alerts_bp = Blueprint("alerts", __name__)
VALID_CHANNELS = {"email", "telegram"}


@alerts_bp.route("/api/alerts", methods=["GET"])
@require_auth
def list_alerts():
    svc = get_service_client()
    user = g.current_user
    subs = (
        svc.table("alert_subscriptions")
        .select("id, district_id, radius_km, notification_channels, email, telegram_chat_id, is_active, created_at, districts(name_en, division)")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
        .data
    )
    history = (
        svc.table("notification_history")
        .select("id, district_id, alert_date, risk_level, channel, status, message, created_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(30)
        .execute()
        .data
    )
    return jsonify({"subscriptions": subs or [], "notifications": history or []}), 200


@alerts_bp.route("/api/alerts", methods=["POST"])
@require_auth
def upsert_alert():
    svc = get_service_client()
    user = g.current_user
    body = request.get_json(silent=True) or {}

    district_id = str(body.get("district_id", "")).strip()
    dist = svc.table("districts").select("id").eq("id", district_id).maybe_single().execute()
    if not dist or not dist.data:
        return jsonify({"error": "Invalid district_id"}), 400

    channels = [c for c in (body.get("notification_channels") or []) if c in VALID_CHANNELS]
    if not channels:
        return jsonify({"error": "Please select at least one notification channel (email or telegram)"}), 400

    alert_email = str(body.get("email") or "").strip().lower() or None
    telegram_chat_id = str(body.get("telegram_chat_id") or "").strip()[:64] or None

    if "email" in channels and not alert_email:
        try:
            user_obj = svc.auth.admin.get_user_by_id(user["id"])
            alert_email = getattr(getattr(user_obj, "user", None), "email", None)
        except Exception:
            alert_email = None

    if "telegram" in channels and not telegram_chat_id:
        return jsonify({"error": "Telegram Chat ID is required when selecting Telegram alerts"}), 400

    radius_km = body.get("radius_km")
    if radius_km is not None:
        try:
            radius_km = float(radius_km)
            if not (1.0 <= radius_km <= 100.0):
                return jsonify({"error": "radius_km must be between 1 and 100"}), 400
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid radius_km"}), 400

    payload = {
        "user_id": user["id"],
        "district_id": district_id,
        "radius_km": radius_km,
        "notification_channels": channels,
        "email": alert_email if "email" in channels else None,
        "telegram_chat_id": telegram_chat_id if "telegram" in channels else None,
        "is_active": bool(body.get("is_active", True)),
    }
    res = (
        svc.table("alert_subscriptions")
        .upsert(payload, on_conflict="user_id,district_id")
        .execute()
    )
    return jsonify({"subscription": res.data[0]}), 201


@alerts_bp.route("/api/alerts/<sub_id>", methods=["DELETE"])
@require_auth
def delete_alert(sub_id: str):
    svc = get_service_client()
    user = g.current_user
    existing = (
        svc.table("alert_subscriptions")
        .select("id")
        .eq("id", sub_id)
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not existing or not existing.data:
        return jsonify({"error": "Alert subscription not found"}), 404

    svc.table("alert_subscriptions").delete().eq("id", sub_id).eq("user_id", user["id"]).execute()
    return jsonify({"deleted": True, "id": sub_id}), 200


@alerts_bp.route("/api/alerts/test-telegram", methods=["POST"])
@require_auth
def test_telegram():
    body = request.get_json(silent=True) or {}
    chat_id = str(body.get("telegram_chat_id", "")).strip()
    if not chat_id:
        return jsonify({"error": "Telegram Chat ID is required"}), 400

    token = (os.getenv("TELEGRAM_BOT_TOKEN") or "9165401803:AAFqq-eWIx2MLsg3OIpwvW9_5XbE4m4pqxM").strip()
    if not token:
        return jsonify({"error": "Telegram bot token is not configured on server"}), 500

    test_message = (
        "🦟 [DengueSense Telemetry Test]\n\n"
        "Connection verified! Your Telegram Chat ID is linked to DengueSense.\n\n"
        "You will receive municipal environmental risk advisories and severe outbreak alerts directly here.\n\n"
        "— National Dengue Telemetry Directorate"
    )

    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": test_message},
            timeout=10,
        )
        data = resp.json()
        if not resp.ok or not data.get("ok"):
            desc = data.get("description", "Unknown error")
            if "bot can't initiate conversation" in desc.lower() or "bot was blocked" in desc.lower():
                return jsonify({
                    "error": "Bot cannot message you yet. Please open @denguesense_alert_bot in Telegram and tap START first, then try again."
                }), 400
            if "chat not found" in desc.lower():
                return jsonify({
                    "error": "Chat not found for this ID. Please ensure your Telegram ID is correct and you have pressed /start on @denguesense_alert_bot."
                }), 400
            return jsonify({"error": f"Telegram API error: {desc}"}), 400

        return jsonify({
            "status": "success",
            "message": "Test alert sent to your Telegram! Check your Telegram app."
        }), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Network error contacting Telegram: {str(e)}"}), 502
