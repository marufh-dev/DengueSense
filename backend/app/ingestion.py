"""Open-Meteo weather & air-quality ingestion and risk score computation."""

from __future__ import annotations

import logging
import time
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import requests
from app.config import Config
from app.db import get_service_client
from app.risk_engine import calculate_community_signal, calculate_environmental_score

logger = logging.getLogger(__name__)
DHAKA_TZ = ZoneInfo("Asia/Dhaka")

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


def _request_with_retry(url: str, params: dict[str, Any], max_retries: int = 3) -> Any:
    """HTTP GET with timeout, exponential backoff, and 429 rate-limit handling."""
    delay = 1.5
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, params=params, timeout=30)
            if resp.status_code == 429:
                wait = float(resp.headers.get("Retry-After", delay * 2))
                logger.warning("Rate limited by %s; sleeping %.1fs", url, wait)
                time.sleep(wait)
                delay *= 2
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            if attempt == max_retries - 1:
                raise
            logger.warning("Request error (%s), retrying in %.1fs: %s", url, delay, exc)
            time.sleep(delay)
            delay *= 2


def _chunk(items: list[Any], size: int) -> list[list[Any]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return None if f != f else f
    except (TypeError, ValueError):
        return None


def _safe_int(val: Any) -> int | None:
    if val is None:
        return None
    try:
        return int(round(float(val)))
    except (TypeError, ValueError):
        return None


def ingest_weather(days_back: int = 7, include_air_quality: bool = True) -> dict[str, Any]:
    """Fetch Open-Meteo weather (and optional AQ) for all 64 districts and update risk scores."""
    svc = get_service_client()
    districts = (
        svc.table("districts")
        .select("id, district_code, name_en, centroid_lat, centroid_lon")
        .order("name_en")
        .execute()
        .data
    )
    if not districts:
        raise RuntimeError("No districts found in database. Run seed_districts.py first.")

    sources = svc.table("data_sources").select("id, source_name, dataset_name").execute().data
    weather_src_id = next(
        (s["id"] for s in sources if s["source_name"] == "Open-Meteo" and "Weather" in s["dataset_name"]),
        None,
    )
    aq_src_id = next(
        (s["id"] for s in sources if s["source_name"] == "Open-Meteo" and "Air Quality" in s["dataset_name"]),
        None,
    )
    if not weather_src_id:
        raise RuntimeError("Open-Meteo Weather data_source not seeded.")

    today_dhaka = datetime.now(DHAKA_TZ).date()
    start_date = today_dhaka - timedelta(days=days_back)
    archive_end = today_dhaka - timedelta(days=5)

    log_row = (
        svc.table("ingestion_logs")
        .insert({
            "source_id": weather_src_id,
            "job_name": f"open_meteo_ingest_{days_back}d",
            "status": "running",
        })
        .execute()
        .data[0]
    )
    log_id = log_row["id"]

    updated_district_ids: set[str] = set()
    total_records = 0
    errors: list[str] = []

    try:
        # 1. Historical reanalysis (from start_date up to today - 5 days)
        if start_date <= archive_end:
            for batch in _chunk(districts, 16):
                lats = ",".join(str(d["centroid_lat"]) for d in batch)
                lons = ",".join(str(d["centroid_lon"]) for d in batch)
                payload = _request_with_retry(
                    ARCHIVE_URL,
                    {
                        "latitude": lats,
                        "longitude": lons,
                        "start_date": start_date.isoformat(),
                        "end_date": archive_end.isoformat(),
                        "daily": "temperature_2m_mean,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max,soil_moisture_0_to_7cm_mean",
                        "timezone": "Asia/Dhaka",
                    },
                )
                results = payload if isinstance(payload, list) else [payload]
                rows = []
                for dist, item in zip(batch, results):
                    daily = item.get("daily", {})
                    dates = daily.get("time", [])
                    for idx, dt_str in enumerate(dates):
                        t_mean = _safe_float(daily.get("temperature_2m_mean", [None])[idx])
                        rh = _safe_float(daily.get("relative_humidity_2m_mean", [None])[idx])
                        rain = _safe_float(daily.get("precipitation_sum", [None])[idx])
                        if t_mean is None and rh is None and rain is None:
                            continue
                        rows.append({
                            "district_id": dist["id"],
                            "source_id": weather_src_id,
                            "recorded_date": dt_str,
                            "observation_type": "reanalysis",
                            "temp_mean": t_mean,
                            "temp_max": _safe_float(daily.get("temperature_2m_max", [None])[idx]),
                            "temp_min": _safe_float(daily.get("temperature_2m_min", [None])[idx]),
                            "humidity_mean": rh,
                            "rainfall_mm": rain,
                            "wind_speed": _safe_float(daily.get("wind_speed_10m_max", [None])[idx]),
                            "soil_moisture": _safe_float(daily.get("soil_moisture_0_to_7cm_mean", [None])[idx]),
                            "data_quality": "valid",
                        })
                        updated_district_ids.add(dist["id"])
                if rows:
                    for r_chunk in _chunk(rows, 500):
                        svc.table("daily_weather_metrics").upsert(
                            r_chunk,
                            on_conflict="district_id,recorded_date,source_id,observation_type",
                        ).execute()
                    total_records += len(rows)

        # 2. Recent past days + today via Forecast API (never stores future forecast dates as observations)
        for batch in _chunk(districts, 16):
            lats = ",".join(str(d["centroid_lat"]) for d in batch)
            lons = ",".join(str(d["centroid_lon"]) for d in batch)
            payload = _request_with_retry(
                FORECAST_URL,
                {
                    "latitude": lats,
                    "longitude": lons,
                    "past_days": 7,
                    "forecast_days": 1,
                    "daily": "temperature_2m_mean,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max",
                    "timezone": "Asia/Dhaka",
                },
            )
            results = payload if isinstance(payload, list) else [payload]
            rows = []
            for dist, item in zip(batch, results):
                daily = item.get("daily", {})
                dates = daily.get("time", [])
                for idx, dt_str in enumerate(dates):
                    if dt_str > today_dhaka.isoformat():
                        continue
                    obs_type = "current" if dt_str == today_dhaka.isoformat() else "reanalysis"
                    t_mean = _safe_float(daily.get("temperature_2m_mean", [None])[idx])
                    rh = _safe_float(daily.get("relative_humidity_2m_mean", [None])[idx])
                    rain = _safe_float(daily.get("precipitation_sum", [None])[idx])
                    if t_mean is None and rh is None and rain is None:
                        continue
                    rows.append({
                        "district_id": dist["id"],
                        "source_id": weather_src_id,
                        "recorded_date": dt_str,
                        "observation_type": obs_type,
                        "temp_mean": t_mean,
                        "temp_max": _safe_float(daily.get("temperature_2m_max", [None])[idx]),
                        "temp_min": _safe_float(daily.get("temperature_2m_min", [None])[idx]),
                        "humidity_mean": rh,
                        "rainfall_mm": rain,
                        "wind_speed": _safe_float(daily.get("wind_speed_10m_max", [None])[idx]),
                        "soil_moisture": None,
                        "data_quality": "valid",
                    })
                    updated_district_ids.add(dist["id"])
            if rows:
                for r_chunk in _chunk(rows, 500):
                    svc.table("daily_weather_metrics").upsert(
                        r_chunk,
                        on_conflict="district_id,recorded_date,source_id,observation_type",
                    ).execute()
                total_records += len(rows)

        # 3. Air Quality (past 5 days daily mean aggregated from hourly)
        if include_air_quality and aq_src_id:
            try:
                for batch in _chunk(districts, 16):
                    lats = ",".join(str(d["centroid_lat"]) for d in batch)
                    lons = ",".join(str(d["centroid_lon"]) for d in batch)
                    payload = _request_with_retry(
                        AIR_QUALITY_URL,
                        {
                            "latitude": lats,
                            "longitude": lons,
                            "past_days": 5,
                            "forecast_days": 1,
                            "hourly": "pm2_5,pm10,european_aqi,us_aqi",
                            "timezone": "Asia/Dhaka",
                        },
                    )
                    results = payload if isinstance(payload, list) else [payload]
                    aq_rows = []
                    for dist, item in zip(batch, results):
                        hourly = item.get("hourly", {})
                        times = hourly.get("time", [])
                        by_day: dict[str, dict[str, list[float]]] = {}
                        for idx, ts in enumerate(times):
                            day_str = ts[:10]
                            if day_str > today_dhaka.isoformat():
                                continue
                            bucket = by_day.setdefault(day_str, {"pm2_5": [], "pm10": [], "eu": [], "us": []})
                            for k, src_k in [("pm2_5", "pm2_5"), ("pm10", "pm10"), ("eu", "european_aqi"), ("us", "us_aqi")]:
                                val = _safe_float(hourly.get(src_k, [None])[idx])
                                if val is not None:
                                    bucket[k].append(val)
                        for day_str, vals in by_day.items():
                            if not any(vals.values()):
                                continue
                            aq_rows.append({
                                "district_id": dist["id"],
                                "source_id": aq_src_id,
                                "recorded_date": day_str,
                                "pm2_5": round(sum(vals["pm2_5"]) / len(vals["pm2_5"]), 2) if vals["pm2_5"] else None,
                                "pm10": round(sum(vals["pm10"]) / len(vals["pm10"]), 2) if vals["pm10"] else None,
                                "european_aqi": _safe_int(sum(vals["eu"]) / len(vals["eu"])) if vals["eu"] else None,
                                "us_aqi": _safe_int(sum(vals["us"]) / len(vals["us"])) if vals["us"] else None,
                                "data_quality": "valid",
                            })
                    if aq_rows:
                        for r_chunk in _chunk(aq_rows, 500):
                            svc.table("air_quality_metrics").upsert(
                                r_chunk,
                                on_conflict="district_id,recorded_date,source_id",
                            ).execute()
                        total_records += len(aq_rows)
            except Exception as aq_exc:
                logger.warning("Air quality ingestion partial failure: %s", aq_exc)
                errors.append(f"AirQuality: {aq_exc}")

        # 4. Recompute daily risk scores for today_dhaka
        recompute_risk_scores(today_dhaka)

        missing = [d["name_en"] for d in districts if d["id"] not in updated_district_ids]
        status = "success" if not missing and not errors else "partial"
        svc.table("ingestion_logs").update({
            "status": status,
            "districts_updated": len(updated_district_ids),
            "records_upserted": total_records,
            "missing_districts": missing,
            "error_summary": "; ".join(errors) if errors else None,
            "completed_at": datetime.now(DHAKA_TZ).isoformat(),
        }).eq("id", log_id).execute()

        return {
            "status": status,
            "districts_updated": len(updated_district_ids),
            "records_upserted": total_records,
            "missing_districts": missing,
            "errors": errors,
        }

    except Exception as exc:
        logger.exception("Ingestion failed")
        svc.table("ingestion_logs").update({
            "status": "failed",
            "districts_updated": len(updated_district_ids),
            "records_upserted": total_records,
            "error_summary": str(exc),
            "completed_at": datetime.now(DHAKA_TZ).isoformat(),
        }).eq("id", log_id).execute()
        raise


def recompute_risk_scores(target_date: date | None = None) -> int:
    """Compute environmental suitability & community signal for all 64 districts."""
    svc = get_service_client()
    score_date = target_date or datetime.now(DHAKA_TZ).date()
    window_start = (score_date - timedelta(days=Config.RAINFALL_LAG_DAYS)).isoformat()
    score_date_str = score_date.isoformat()

    districts = svc.table("districts").select("id").execute().data
    weather_rows = (
        svc.table("daily_weather_metrics")
        .select("district_id, recorded_date, observation_type, temp_mean, humidity_mean, rainfall_mm")
        .gte("recorded_date", window_start)
        .lte("recorded_date", score_date_str)
        .order("recorded_date", desc=True)
        .execute()
        .data
    )
    approved_reports = (
        svc.table("crowd_reports")
        .select("district_id, report_type, status, created_at")
        .eq("status", "APPROVED")
        .execute()
        .data
    )

    weather_by_dist: dict[str, dict[str, dict[str, Any]]] = {}
    for w in weather_rows:
        did = w["district_id"]
        dstr = w["recorded_date"]
        existing = weather_by_dist.setdefault(did, {}).get(dstr)
        if not existing or w["observation_type"] == "current":
            weather_by_dist[did][dstr] = w

    reports_by_dist: dict[str, list[dict[str, Any]]] = {}
    for r in approved_reports:
        reports_by_dist.setdefault(r["district_id"], []).append(r)

    risk_rows = []
    for d in districts:
        did = d["id"]
        day_map = weather_by_dist.get(did, {})
        sorted_days = sorted(day_map.keys(), reverse=True)

        latest_temp = None
        latest_rh = None
        latest_date = None
        for dt_k in sorted_days:
            rec = day_map[dt_k]
            if latest_date is None:
                latest_date = dt_k
            if latest_temp is None and rec.get("temp_mean") is not None:
                latest_temp = rec["temp_mean"]
            if latest_rh is None and rec.get("humidity_mean") is not None:
                latest_rh = rec["humidity_mean"]
            if latest_temp is not None and latest_rh is not None:
                break

        rain_vals = [rec["rainfall_mm"] for rec in day_map.values() if rec.get("rainfall_mm") is not None]
        cum_rain = sum(rain_vals) if rain_vals else None

        env_res = calculate_environmental_score(
            latest_temp=latest_temp,
            latest_humidity=latest_rh,
            cumulative_rain_21d=cum_rain,
            latest_date=latest_date,
            rain_days_count=len(rain_vals),
        )
        comm_score = calculate_community_signal(reports_by_dist.get(did, []), as_of=score_date)

        risk_rows.append({
            "district_id": did,
            "score_date": score_date_str,
            "environmental_score": env_res["environmental_score"],
            "community_signal_score": comm_score,
            "risk_level": env_res["risk_level"],
            "model_version": Config.MODEL_VERSION,
            "score_explanation": env_res["score_explanation"],
        })

    if risk_rows:
        svc.table("daily_risk_scores").upsert(
            risk_rows,
            on_conflict="district_id,score_date,model_version",
        ).execute()
    return len(risk_rows)
