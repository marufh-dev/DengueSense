"""Health check route."""

from flask import Blueprint, jsonify
from app.db import get_service_client

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health():
    db_ok = False
    district_count = 0
    latest_ingestion = None
    try:
        svc = get_service_client()
        d_res = svc.table("districts").select("id", count="exact").limit(1).execute()
        district_count = d_res.count or 0
        log_res = (
            svc.table("ingestion_logs")
            .select("status, completed_at, districts_updated")
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        latest_ingestion = log_res.data[0] if log_res.data else None
        db_ok = True
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    return jsonify({
        "status": "ok" if db_ok else "degraded",
        "service": "denguesense-api",
        "database": "connected" if db_ok else "unavailable",
        "districts_count": district_count,
        "latest_ingestion": latest_ingestion,
    }), status_code
