"""Server-side JWT authentication and role-based authorization."""

from functools import wraps
from flask import g, jsonify, request
from app.db import get_anon_client, get_service_client


def _extract_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()
    return token or None


def get_optional_user():
    """Verify Bearer JWT if present and attach user + profile role to flask.g."""
    if hasattr(g, "current_user") and g.current_user is not None:
        return g.current_user
    token = _extract_bearer_token()
    if not token:
        return None
    try:
        anon = get_anon_client()
        user_resp = anon.auth.get_user(token)
        if not user_resp or not user_resp.user:
            return None
        user = user_resp.user
        svc = get_service_client()
        prof = (
            svc.table("user_profiles")
            .select("id, display_name, role, preferred_district_id")
            .eq("id", str(user.id))
            .maybe_single()
            .execute()
        )
        profile = prof.data or {"id": str(user.id), "role": "citizen", "display_name": None}
        g.current_user = {
            "id": str(user.id),
            "email": user.email,
            "role": profile.get("role", "citizen"),
            "display_name": profile.get("display_name"),
        }
        return g.current_user
    except Exception:
        return None


def require_auth(fn):
    """Require a valid Supabase JWT; never trust user IDs or roles from request body."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_optional_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return fn(*args, **kwargs)
    return wrapper


def require_role(*allowed_roles: str):
    """Require an authenticated user whose server-verified role is in allowed_roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_optional_user()
            if not user:
                return jsonify({"error": "Authentication required"}), 401
            if user.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden: insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
