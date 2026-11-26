"""Districts, environmental suitability risk, and historical weather routes."""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from flask import Blueprint, jsonify, request
from app.config import Config
from app.db import get_service_client

districts_bp = Blueprint("districts", __name__)
DHAKA_TZ = ZoneInfo("Asia/Dhaka")


@districts_bp.route("/api/districts", methods=["GET"])
def list_districts():
    svc = get_service_client()
    division = request.args.get("division", "").strip()
    query = svc.table("districts").select(
        "id, district_code, name_en, name_bn, division, centroid_lat, centroid_lon, area_sq_km"
    ).order("name_en")
    if division:
        query = query.eq("division", division)
    res = query.execute()
    return jsonify({"districts": res.data, "count": len(res.data)}), 200


@districts_bp.route("/api/districts/risk", methods=["GET"])
def list_districts_risk():
    svc = get_service_client()
    districts = (
        svc.table("districts")
        .select("id, district_code, name_en, name_bn, division, centroid_lat, centroid_lon, area_sq_km")
        .order("name_en")
        .execute()
        .data
    )

    # Latest risk score per district
    risk_rows = (
        svc.table("daily_risk_scores")
        .select("district_id, score_date, environmental_score, community_signal_score, risk_level, model_version, score_explanation")
        .eq("model_version", Config.MODEL_VERSION)
        .order("score_date", desc=True)
        .limit(200)
        .execute()
        .data
    )
    latest_risk: dict[str, dict] = {}
    for r in risk_rows:
        if r["district_id"] not in latest_risk:
            latest_risk[r["district_id"]] = r

    # Count active approved reports per district
    reports = (
        svc.table("crowd_reports")
        .select("district_id, report_type")
        .eq("status", "APPROVED")
        .execute()
        .data
    )
    report_counts: dict[str, int] = {}
    for rep in reports:
        did = rep["district_id"]
        report_counts[did] = report_counts.get(did, 0) + 1

    items = []
    summary = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0, "NO DATA": 0}
    for d in districts:
        rk = latest_risk.get(d["id"])
        level = rk["risk_level"] if rk else "NO DATA"
        summary[level] = summary.get(level, 0) + 1
        items.append({
            **d,
            "environmental_score": rk["environmental_score"] if rk else None,
            "community_signal_score": rk["community_signal_score"] if rk else 0,
            "risk_level": level,
            "score_date": rk["score_date"] if rk else None,
            "score_explanation": rk["score_explanation"] if rk else {"status": "NO DATA"},
            "approved_reports_count": report_counts.get(d["id"], 0),
        })

    return jsonify({
        "districts": items,
        "total_districts": len(items),
        "summary": summary,
        "model_version": Config.MODEL_VERSION,
    }), 200


@districts_bp.route("/api/districts/<district_id>", methods=["GET"])
def get_district_detail(district_id: str):
    svc = get_service_client()
    d_res = (
        svc.table("districts")
        .select("id, district_code, name_en, name_bn, division, centroid_lat, centroid_lon, area_sq_km")
        .eq("id", district_id)
        .maybe_single()
        .execute()
    )
    if not d_res or not d_res.data:
        return jsonify({"error": "District not found"}), 404

    risk_res = (
        svc.table("daily_risk_scores")
        .select("*")
        .eq("district_id", district_id)
        .order("score_date", desc=True)
        .limit(1)
        .execute()
    )
    weather_res = (
        svc.table("daily_weather_metrics")
        .select("recorded_date, observation_type, temp_mean, temp_max, temp_min, humidity_mean, rainfall_mm, wind_speed, soil_moisture")
        .eq("district_id", district_id)
        .order("recorded_date", desc=True)
        .limit(1)
        .execute()
    )
    aq_res = (
        svc.table("air_quality_metrics")
        .select("recorded_date, pm2_5, pm10, european_aqi, us_aqi")
        .eq("district_id", district_id)
        .order("recorded_date", desc=True)
        .limit(1)
        .execute()
    )
    reports_res = (
        svc.table("crowd_reports")
        .select("id, report_type, generalized_lat, generalized_lon, description, status, created_at, expires_at")
        .eq("district_id", district_id)
        .eq("status", "APPROVED")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    return jsonify({
        "district": d_res.data,
        "latest_risk": risk_res.data[0] if risk_res.data else None,
        "latest_weather": weather_res.data[0] if weather_res.data else None,
        "latest_air_quality": aq_res.data[0] if aq_res.data else None,
        "approved_reports": reports_res.data,
    }), 200


@districts_bp.route("/api/districts/<district_id>/history", methods=["GET"])
def get_district_history(district_id: str):
    svc = get_service_client()
    d_res = svc.table("districts").select("id, name_en").eq("id", district_id).maybe_single().execute()
    if not d_res or not d_res.data:
        return jsonify({"error": "District not found"}), 404

    try:
        days = int(request.args.get("days", "30"))
    except ValueError:
        days = 30
    days = max(7, min(180, days))
    since = (datetime.now(DHAKA_TZ).date() - timedelta(days=days)).isoformat()

    weather = (
        svc.table("daily_weather_metrics")
        .select("recorded_date, observation_type, temp_mean, temp_max, temp_min, humidity_mean, rainfall_mm, wind_speed, soil_moisture")
        .eq("district_id", district_id)
        .gte("recorded_date", since)
        .order("recorded_date", desc=False)
        .execute()
        .data
    )
    aq = (
        svc.table("air_quality_metrics")
        .select("recorded_date, pm2_5, pm10, european_aqi, us_aqi")
        .eq("district_id", district_id)
        .gte("recorded_date", since)
        .order("recorded_date", desc=False)
        .execute()
        .data
    )
    risk = (
        svc.table("daily_risk_scores")
        .select("score_date, environmental_score, community_signal_score, risk_level")
        .eq("district_id", district_id)
        .gte("score_date", since)
        .order("score_date", desc=False)
        .execute()
        .data
    )

    return jsonify({
        "district": d_res.data,
        "days": days,
        "weather_history": weather,
        "air_quality_history": aq,
        "risk_history": risk,
    }), 200
