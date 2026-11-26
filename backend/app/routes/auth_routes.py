"""Authenticated user profile route."""

from flask import Blueprint, g, jsonify
from app.auth import require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/me", methods=["GET"])
@require_auth
def me():
    user = g.current_user
    return jsonify({
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "display_name": user["display_name"],
    }), 200
