"""Data health, ingestion logs, and source provenance routes."""

from flask import Blueprint, jsonify
from app.db import get_service_client

data_health_bp = Blueprint("data_health", __name__)


@data_health_bp.route("/api/data-health", methods=["GET"])
def get_data_health():
    svc = get_service_client()
    logs = (
        svc.table("ingestion_logs")
        .select("id, job_name, status, districts_updated, records_upserted, missing_districts, error_summary, started_at, completed_at")
        .order("started_at", desc=True)
        .limit(10)
        .execute()
        .data
    )
    sources = (
        svc.table("data_sources")
        .select("id, source_name, dataset_name, source_url, license, attribution, description, active")
        .order("source_name")
        .execute()
        .data
    )
    return jsonify({
        "latest_log": logs[0] if logs else None,
        "recent_logs": logs or [],
        "data_sources": sources or [],
    }), 200
