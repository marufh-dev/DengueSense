"""Authenticated user profile route and notification settings."""

from flask import Blueprint, g, jsonify, request
from app.auth import require_auth
from app.db import get_service_client
from app.notifications import send_email_message

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/me", methods=["GET"])
@require_auth
def me():
    user = g.current_user
    svc = get_service_client()
    
    # Query latest user subscription settings for email and telegram
    sub = (
        svc.table("alert_subscriptions")
        .select("email, telegram_chat_id, notification_channels, district_id")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_sub = sub.data[0] if sub.data else {}

    # Query user profile and auth metadata
    try:
        user_auth = svc.auth.admin.get_user_by_id(user["id"])
        user_obj = getattr(user_auth, "user", user_auth)
        umeta = getattr(user_obj, "user_metadata", {}) or {}
    except Exception:
        umeta = {}

    prof = (
        svc.table("user_profiles")
        .select("id, display_name, role, preferred_district_id, avatar_id")
        .eq("id", user["id"])
        .maybe_single()
        .execute()
    )
    pdata = prof.data if prof and prof.data else {}

    avatar_id = pdata.get("avatar_id") or umeta.get("avatar_id") or "avatar-shield"
    display_name = pdata.get("display_name") or umeta.get("display_name") or user.get("display_name") or "Citizen"

    return jsonify({
        "id": user["id"],
        "email": user["email"],
        "role": pdata.get("role") or user.get("role") or "citizen",
        "display_name": display_name,
        "preferred_district_id": pdata.get("preferred_district_id"),
        "avatar_id": avatar_id,
        "preferred_email": latest_sub.get("email") or user["email"],
        "telegram_chat_id": latest_sub.get("telegram_chat_id") or "",
        "notification_channels": latest_sub.get("notification_channels") or ["email"],
    }), 200


@auth_bp.route("/api/auth/profile", methods=["PUT"])
@require_auth
def update_profile():
    user = g.current_user
    data = request.get_json() or {}
    svc = get_service_client()

    display_name = str(data.get("display_name", "")).strip()
    avatar_id = str(data.get("avatar_id", "avatar-shield")).strip()
    preferred_district_id = data.get("preferred_district_id")
    preferred_email = str(data.get("preferred_email", "")).strip() or user["email"]
    telegram_chat_id = str(data.get("telegram_chat_id", "")).strip()
    channels = data.get("notification_channels") or ["email"]

    # Persist avatar_id and display_name into Supabase Auth user_metadata
    try:
        svc.auth.admin.update_user_by_id(
            user["id"],
            {"user_metadata": {"display_name": display_name, "avatar_id": avatar_id}}
        )
    except Exception:
        pass

    # Update or insert user profile in Supabase database
    profile_payload = {
        "id": user["id"],
        "display_name": display_name,
        "preferred_district_id": preferred_district_id or None,
        "avatar_id": avatar_id,
    }
    svc.table("user_profiles").upsert(profile_payload, on_conflict="id").execute()

    # Sync alert subscriptions to ensure notifications arrive to preferred email & telegram
    existing_subs = (
        svc.table("alert_subscriptions")
        .select("id, district_id")
        .eq("user_id", user["id"])
        .execute()
    )
    if existing_subs.data:
        for s in existing_subs.data:
            svc.table("alert_subscriptions").update({
                "email": preferred_email,
                "telegram_chat_id": telegram_chat_id or None,
                "notification_channels": channels,
            }).eq("id", s["id"]).execute()
    else:
        # Create a default district subscription so user is immediately connected
        default_dist_id = preferred_district_id
        if not default_dist_id:
            d_res = svc.table("districts").select("id").eq("name_en", "Pirojpur").maybe_single().execute()
            default_dist_id = d_res.data["id"] if d_res and d_res.data else None

        if default_dist_id:
            svc.table("alert_subscriptions").insert({
                "user_id": user["id"],
                "district_id": default_dist_id,
                "radius_km": 10,
                "notification_channels": channels,
                "email": preferred_email,
                "telegram_chat_id": telegram_chat_id or None,
                "is_active": True,
            }).execute()

    return jsonify({
        "status": "success",
        "message": "Profile and notification channels updated successfully",
        "profile": {
            "display_name": display_name,
            "avatar_id": avatar_id,
            "preferred_email": preferred_email,
            "telegram_chat_id": telegram_chat_id,
            "notification_channels": channels,
        }
    }), 200


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new user directly in Supabase with auto-confirmation and welcome email."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()
    display_name = str(data.get("display_name", "")).strip() or "Citizen"

    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    svc = get_service_client()

    try:
        # Create user directly via Supabase Service Role with email pre-confirmed
        res = svc.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "display_name": display_name,
                "avatar_id": "avatar-shield",
            }
        })
        user_obj = getattr(res, "user", res)
        uid = getattr(user_obj, "id", None) or (res.get("id") if isinstance(res, dict) else None)

        # Upsert profile in user_profiles table
        if uid:
            svc.table("user_profiles").upsert({
                "id": uid,
                "display_name": display_name,
                "role": "citizen",
                "avatar_id": "avatar-shield",
            }, on_conflict="id").execute()

        # Send welcome email via our live Resend / SMTP gateway
        try:
            welcome_subject = "Welcome to DengueSense — Bangladesh Early Warning Platform"
            welcome_body = (
                f"Hello {display_name},\n\n"
                "Your DengueSense citizen account has been successfully created and verified!\n\n"
                "You can now:\n"
                "• Monitor daily meteorological dengue suitability (EDSI) across all 64 districts\n"
                "• Submit local waterlogging & mosquito breeding reports\n"
                "• Subscribe to district alert broadcasts via Email and Telegram\n\n"
                "Access the live platform anytime: https://denguesense-flax.vercel.app\n\n"
                "— National Dengue Telemetry Directorate"
            )
            send_email_message(email, welcome_subject, welcome_body)
        except Exception:
            pass

        return jsonify({
            "status": "success",
            "message": "Account created successfully! You can sign in immediately.",
            "user": {
                "id": str(uid) if uid else None,
                "email": email,
                "display_name": display_name,
            }
        }), 201
    except Exception as exc:
        err_msg = str(exc)
        if "registered" in err_msg.lower() or "unique constraint" in err_msg.lower() or "already exists" in err_msg.lower():
            return jsonify({"error": "An account with this email already exists. Please sign in."}), 409
        return jsonify({"error": f"Registration error: {err_msg}"}), 400


@auth_bp.route("/api/auth/magic-link", methods=["POST"])
def send_magic_link():
    """Generate and dispatch a direct one-time magic sign-in link via Resend."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required"}), 400

    svc = get_service_client()

    try:
        res = svc.auth.admin.generate_link({
            "type": "magiclink",
            "email": email,
        })
        props = getattr(res, "properties", None)
        action_link = getattr(props, "action_link", None) if props else None

        if not action_link:
            return jsonify({"error": "Failed to generate sign-in link"}), 500

        subject = "Your DengueSense One-Time Sign-In Link"
        body = (
            "Hello,\n\n"
            "Click the secure link below to sign in directly to your DengueSense account:\n\n"
            f"{action_link}\n\n"
            "This link will expire shortly. If you did not request this link, you can safely ignore this email.\n\n"
            "— DengueSense Security Team"
        )
        sent = send_email_message(email, subject, body)
        if not sent:
            return jsonify({"error": "Failed to deliver email through mail gateway. Please use password login."}), 502

        return jsonify({
            "status": "success",
            "message": "Check your email inbox or spam folder — we sent you a secure sign-in link via Resend."
        }), 200
    except Exception as exc:
        err_msg = str(exc)
        if "user not found" in err_msg.lower():
            return jsonify({"error": "No account found with this email. Please register first."}), 404
        return jsonify({"error": f"Magic link error: {err_msg}"}), 400

