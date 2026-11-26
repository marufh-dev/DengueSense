"""Explainable, configurable V1 Environmental Dengue Suitability Engine.

Scientific note:
- Outputs represent *environmental suitability* for Aedes aegypti breeding/transmission,
  NOT confirmed dengue infection probability or epidemiological outbreak predictions.
- Community signal is calculated separately and never conflated with weather suitability.
"""

from datetime import date, datetime, timezone
from typing import Any
from app.config import Config

RISK_THRESHOLDS = [
    (75.0, "CRITICAL"),
    (55.0, "HIGH"),
    (30.0, "MODERATE"),
    (0.0, "LOW"),
]


def temperature_suitability(temp_c: float | None) -> float | None:
    """Piecewise curve peaking at 28°C (1.0), favorable 25–32°C, tapering outside 16–38°C."""
    if temp_c is None:
        return None
    if temp_c <= 16.0 or temp_c >= 38.0:
        return 0.0
    if 25.0 <= temp_c <= 32.0:
        dist = abs(temp_c - 28.0) / 4.0
        return round(max(0.80, 1.0 - 0.18 * dist), 4)
    if temp_c < 25.0:
        return round(max(0.0, 0.80 * (temp_c - 16.0) / 9.0), 4)
    return round(max(0.0, 0.80 * (38.0 - temp_c) / 6.0), 4)


def humidity_suitability(rh_pct: float | None) -> float | None:
    """Elevated suitability above 70% RH; saturates near 85%+ RH."""
    if rh_pct is None:
        return None
    if rh_pct <= 40.0:
        return 0.0
    if rh_pct < 70.0:
        return round(0.45 * (rh_pct - 40.0) / 30.0, 4)
    if rh_pct <= 85.0:
        return round(0.45 + 0.55 * (rh_pct - 70.0) / 15.0, 4)
    return 1.0


def rainfall_suitability(cumulative_rain_mm: float | None) -> float | None:
    """Lagged 21-day cumulative rainfall suitability (optimal breeding 80–250 mm)."""
    if cumulative_rain_mm is None:
        return None
    if cumulative_rain_mm <= 5.0:
        return 0.05
    if cumulative_rain_mm < 80.0:
        return round(0.05 + 0.65 * (cumulative_rain_mm - 5.0) / 75.0, 4)
    if cumulative_rain_mm <= 250.0:
        return round(0.70 + 0.30 * (cumulative_rain_mm - 80.0) / 170.0, 4)
    if cumulative_rain_mm <= 450.0:
        return 1.0
    return 0.90


def classify_risk_level(score: float | None) -> str:
    if score is None:
        return "NO DATA"
    for threshold, label in RISK_THRESHOLDS:
        if score >= threshold:
            return label
    return "LOW"


def calculate_environmental_score(
    latest_temp: float | None,
    latest_humidity: float | None,
    cumulative_rain_21d: float | None,
    latest_date: str | None,
    rain_days_count: int = 0,
) -> dict[str, Any]:
    """Compute environmental suitability (0–100) or NO DATA if core variables are missing."""
    missing = []
    if latest_temp is None:
        missing.append("temp_mean")
    if latest_humidity is None:
        missing.append("humidity_mean")
    if cumulative_rain_21d is None or rain_days_count == 0:
        missing.append("rainfall_mm")

    if missing:
        return {
            "environmental_score": None,
            "risk_level": "NO DATA",
            "score_explanation": {
                "status": "NO DATA",
                "missing_variables": missing,
                "data_freshness_date": latest_date,
                "disclaimer": "Provisional environmental suitability heuristic; missing required variables.",
            },
        }

    s_t = temperature_suitability(latest_temp)
    s_h = humidity_suitability(latest_humidity)
    s_r = rainfall_suitability(cumulative_rain_21d)

    raw_score = 100.0 * (
        Config.ENV_WEIGHT_RAINFALL * s_r
        + Config.ENV_WEIGHT_TEMPERATURE * s_t
        + Config.ENV_WEIGHT_HUMIDITY * s_h
    )
    score = round(min(100.0, max(0.0, raw_score)), 2)
    level = classify_risk_level(score)

    return {
        "environmental_score": score,
        "risk_level": level,
        "score_explanation": {
            "status": level,
            "model_version": Config.MODEL_VERSION,
            "weights": {
                "rainfall": Config.ENV_WEIGHT_RAINFALL,
                "temperature": Config.ENV_WEIGHT_TEMPERATURE,
                "humidity": Config.ENV_WEIGHT_HUMIDITY,
            },
            "components": {
                "temperature_suitability": s_t,
                "humidity_suitability": s_h,
                "rainfall_suitability": s_r,
            },
            "inputs": {
                "latest_temp_c": latest_temp,
                "latest_humidity_pct": latest_humidity,
                "cumulative_rainfall_21d_mm": round(cumulative_rain_21d, 2),
                "rainfall_observation_days": rain_days_count,
            },
            "missing_variables": [],
            "data_freshness_date": latest_date,
            "disclaimer": (
                "Provisional V1 environmental suitability heuristic (0-100). "
                "Does not represent confirmed dengue infection probability."
            ),
        },
    }


def calculate_community_signal(approved_reports: list[dict[str, Any]], as_of: date | None = None) -> float:
    """Compute separate community signal (0–100) from active approved environmental reports."""
    ref_dt = datetime.now(timezone.utc) if as_of is None else datetime(as_of.year, as_of.month, as_of.day, tzinfo=timezone.utc)
    env_types = {"WATERLOGGING", "STAGNANT_WATER", "MOSQUITO_ACTIVITY"}
    total = 0.0
    for r in approved_reports:
        if r.get("status") != "APPROVED" or r.get("report_type") not in env_types:
            continue
        created_str = r.get("created_at")
        weight = 1.0
        if created_str:
            try:
                created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                age_days = max(0.0, (ref_dt - created_dt).total_seconds() / 86400.0)
                if age_days > 14.0:
                    continue
                weight = max(0.2, 1.0 - (age_days / 14.0) * 0.8)
            except Exception:
                pass
        total += 15.0 * weight
    return round(min(100.0, total), 2)
