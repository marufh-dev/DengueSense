"""Community reporting, voting, and private photo signed-URL routes."""

import uuid
from datetime import datetime, timedelta, timezone
from flask import Blueprint, g, jsonify, request
from app.auth import get_optional_user, require_auth
from app.db import get_service_client
from app.rate_limit import rate_limit

reports_bp = Blueprint("reports", __name__)

VALID_REPORT_TYPES = {
    "WATERLOGGING",
    "STAGNANT_WATER",
    "MOSQUITO_ACTIVITY",
    "SUSPECTED_DENGUE_REPORT",
}
ALLOWED_MIME_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB


@reports_bp.route("/api/reports", methods=["GET"])
def list_reports():
    """Return paginated approved community reports (plus own reports if authenticated).

    Public responses expose generalized coordinates only (never raw residential coords).
    """
    svc = get_service_client()
    user = get_optional_user()
    district_id = request.args.get("district_id", "").strip()
    report_type = request.args.get("report_type", "").strip()
    mine = request.args.get("mine", "").lower() == "true"

    try:
        page = max(1, int(request.args.get("page", "1")))
        limit = max(1, min(50, int(request.args.get("limit", "20"))))
    except ValueError:
        page, limit = 1, 20

    offset = (page - 1) * limit
    query = svc.table("crowd_reports").select(
        "id, district_id, report_type, generalized_lat, generalized_lon, description, photo_path, status, expires_at, created_at, districts(name_en, division)",
        count="exact",
    )

    if mine and user:
        query = query.eq("user_id", user["id"])
    else:
        query = query.eq("status", "APPROVED").gt("expires_at", datetime.now(timezone.utc).isoformat())

    if district_id:
        query = query.eq("district_id", district_id)
    if report_type and report_type in VALID_REPORT_TYPES:
        query = query.eq("report_type", report_type)

    res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    rows = res.data or []

    # Attach vote counts
    report_ids = [r["id"] for r in rows]
    vote_totals: dict[str, int] = {}
    if report_ids:
        votes = svc.table("report_votes").select("report_id, vote").in_("report_id", report_ids).execute().data
        for v in votes:
            rid = v["report_id"]
            vote_totals[rid] = vote_totals.get(rid, 0) + int(v["vote"])

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "district_id": r["district_id"],
            "district_name": (r.get("districts") or {}).get("name_en"),
            "division": (r.get("districts") or {}).get("division"),
            "report_type": r["report_type"],
            "latitude": r["generalized_lat"],
            "longitude": r["generalized_lon"],
            "description": r["description"],
            "has_photo": bool(r.get("photo_path")),
            "status": r["status"],
            "votes": vote_totals.get(r["id"], 0),
            "expires_at": r["expires_at"],
            "created_at": r["created_at"],
        })

    return jsonify({
        "reports": items,
        "page": page,
        "limit": limit,
        "total": res.count or len(items),
    }), 200


@reports_bp.route("/api/reports", methods=["POST"])
@require_auth
@rate_limit(max_requests=5, window_seconds=3600, key_prefix="create_report")
def create_report():
    """Submit a new community report (supports JSON or multipart/form-data with photo)."""
    svc = get_service_client()
    user = g.current_user

    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
        photo_file = request.files.get("photo")
    else:
        data = request.get_json(silent=True) or {}
        photo_file = None

    district_id = str(data.get("district_id", "")).strip()
    report_type = str(data.get("report_type", "")).strip().upper()
    description = str(data.get("description", "")).strip()

    if report_type not in VALID_REPORT_TYPES:
        return jsonify({"error": "Invalid report_type"}), 400
    if not (10 <= len(description) <= 1000):
        return jsonify({"error": "Description must be between 10 and 1000 characters"}), 400

    try:
        lat = float(data.get("latitude"))
        lon = float(data.get("longitude"))
    except (TypeError, ValueError):
        return jsonify({"error": "Valid latitude and longitude are required"}), 400

    if not (20.3 <= lat <= 26.8 and 87.9 <= lon <= 92.8):
        return jsonify({"error": "Coordinates must be within Bangladesh"}), 400

    # Verify district exists
    dist = svc.table("districts").select("id").eq("id", district_id).maybe_single().execute()
    if not dist or not dist.data:
        return jsonify({"error": "Invalid district_id"}), 400

    # Duplicate prevention: same user + district + type within 24 hours
    since_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    dup = (
        svc.table("crowd_reports")
        .select("id")
        .eq("user_id", user["id"])
        .eq("district_id", district_id)
        .eq("report_type", report_type)
        .gte("created_at", since_24h)
        .limit(1)
        .execute()
    )
    if dup.data:
        return jsonify({"error": "Duplicate report: you already submitted this category for this district in the last 24 hours"}), 409

    # Optional photo validation & private upload
    photo_path = None
    if photo_file and photo_file.filename:
        mime = (photo_file.mimetype or "").lower()
        if mime not in ALLOWED_MIME_TYPES:
            return jsonify({"error": "Unsupported image type. Allowed: JPEG, PNG, WebP"}), 400
        raw_bytes = photo_file.read()
        if len(raw_bytes) > MAX_PHOTO_BYTES:
            return jsonify({"error": "Photo exceeds 5 MB limit"}), 400
        ext = ALLOWED_MIME_TYPES[mime]
        photo_path = f"{user['id']}/{uuid.uuid4()}.{ext}"
        svc.storage.from_("report-photos").upload(
            photo_path,
            raw_bytes,
            {"content-type": mime},
        )

    # Privacy: round public coordinates to ~1.1 km (2 decimal places)
    gen_lat = round(lat, 2)
    gen_lon = round(lon, 2)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()

    inserted = (
        svc.table("crowd_reports")
        .insert({
            "user_id": user["id"],
            "district_id": district_id,
            "report_type": report_type,
            "latitude": lat,
            "longitude": lon,
            "location_geom": f"SRID=4326;POINT({lon} {lat})",
            "generalized_lat": gen_lat,
            "generalized_lon": gen_lon,
            "description": description,
            "photo_path": photo_path,
            "status": "PENDING",
            "expires_at": expires_at,
        })
        .execute()
        .data[0]
    )

    return jsonify({
        "report": {
            "id": inserted["id"],
            "district_id": inserted["district_id"],
            "report_type": inserted["report_type"],
            "latitude": inserted["generalized_lat"],
            "longitude": inserted["generalized_lon"],
            "status": inserted["status"],
            "expires_at": inserted["expires_at"],
            "created_at": inserted["created_at"],
        },
        "message": "Report submitted and awaiting moderation.",
    }), 201


@reports_bp.route("/api/reports/<report_id>/vote", methods=["POST"])
@require_auth
@rate_limit(max_requests=30, window_seconds=3600, key_prefix="vote_report")
def vote_report(report_id: str):
    """Support or downvote an approved report (one vote per user per report)."""
    svc = get_service_client()
    user = g.current_user
    body = request.get_json(silent=True) or {}
    vote_val = body.get("vote", 1)
    if vote_val not in (1, -1):
        return jsonify({"error": "vote must be 1 or -1"}), 400

    rep = svc.table("crowd_reports").select("id, status").eq("id", report_id).maybe_single().execute()
    if not rep or not rep.data or rep.data["status"] != "APPROVED":
        return jsonify({"error": "Report not found"}), 404

    existing = (
        svc.table("report_votes")
        .select("id")
        .eq("report_id", report_id)
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if existing and existing.data:
        return jsonify({"error": "You have already voted on this report"}), 409

    svc.table("report_votes").insert({
        "report_id": report_id,
        "user_id": user["id"],
        "vote": vote_val,
    }).execute()

    votes = svc.table("report_votes").select("vote").eq("report_id", report_id).execute().data
    total = sum(int(v["vote"]) for v in votes)
    return jsonify({"report_id": report_id, "votes": total}), 201


@reports_bp.route("/api/reports/<report_id>/photo", methods=["GET"])
def get_report_photo(report_id: str):
    """Return a short-lived signed URL only if report is APPROVED or requester is owner/moderator."""
    svc = get_service_client()
    user = get_optional_user()
    rep = (
        svc.table("crowd_reports")
        .select("id, user_id, status, photo_path")
        .eq("id", report_id)
        .maybe_single()
        .execute()
    )
    if not rep or not rep.data or not rep.data.get("photo_path"):
        return jsonify({"error": "Photo not found"}), 404

    row = rep.data
    is_owner = user and user["id"] == row["user_id"]
    is_mod = user and user.get("role") in ("moderator", "admin")
    if row["status"] != "APPROVED" and not is_owner and not is_mod:
        return jsonify({"error": "Photo not found"}), 404

    signed = svc.storage.from_("report-photos").create_signed_url(row["photo_path"], 120)
    url = signed.get("signedURL") or signed.get("signedUrl")
    return jsonify({"signed_url": url, "expires_in": 120}), 200
