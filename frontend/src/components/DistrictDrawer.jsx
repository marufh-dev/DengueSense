import { Link } from "react-router-dom";
import { ArrowRight, CloudRain, Droplets, Thermometer, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import RiskBadge from "./RiskBadge";

export default function DistrictDrawer({ district, detail, loading }) {
  const { lang, t } = useLanguage();

  if (!district) {
    return (
      <aside className="card drawer-card">
        <h3 style={{ marginTop: 0 }}>{t.drawer.selectTitle}</h3>
        <p style={{ color: "var(--ink-secondary)", marginBottom: 0 }}>{t.drawer.selectHint}</p>
      </aside>
    );
  }

  const expl = district.score_explanation || {};
  const inputs = expl.inputs || {};
  const components = expl.components || {};
  const latestWeather = detail?.latest_weather;
  const latestAq = detail?.latest_air_quality;

  return (
    <aside className="card drawer-card" aria-live="polite">
      <div className="drawer-header">
        <div>
          <div className="meta-label">
            {district.division} {t.drawer.division} · {district.district_code}
          </div>
          <h2 style={{ margin: "4px 0 2px", fontSize: "1.25rem" }}>
            {lang === "bn" ? district.name_bn || district.name_en : district.name_en}
            {lang === "en" && district.name_bn && (
              <span style={{ color: "var(--ink-muted)", fontWeight: 400, marginLeft: 8, fontSize: "1rem" }}>
                ({district.name_bn})
              </span>
            )}
          </h2>
        </div>
        <RiskBadge level={district.risk_level} score={district.environmental_score} />
      </div>

      {loading && <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>…</p>}

      <div className="metric-grid" style={{ marginTop: 16 }}>
        <div className="metric-tile">
          <div className="metric-label"><Thermometer size={14} /> {t.drawer.meanTemp}</div>
          <div className="metric-value tabular-nums">
            {inputs.latest_temp_c ?? latestWeather?.temp_mean ?? "—"} °C
          </div>
        </div>
        <div className="metric-tile">
          <div className="metric-label"><Droplets size={14} /> {t.drawer.humidity}</div>
          <div className="metric-value tabular-nums">
            {inputs.latest_humidity_pct ?? latestWeather?.humidity_mean ?? "—"} %
          </div>
        </div>
        <div className="metric-tile">
          <div className="metric-label"><CloudRain size={14} /> {t.drawer.rainfall21d}</div>
          <div className="metric-value tabular-nums">
            {inputs.cumulative_rainfall_21d_mm ?? "—"} mm
          </div>
        </div>
        <div className="metric-tile">
          <div className="metric-label"><Users size={14} /> {t.drawer.communitySignal}</div>
          <div className="metric-value tabular-nums">
            {Number(district.community_signal_score || 0).toFixed(1)} / 100
          </div>
        </div>
      </div>

      {components.rainfall_suitability !== undefined && (
        <div className="breakdown-box" style={{ marginTop: 16 }}>
          <div className="meta-label" style={{ marginBottom: 8 }}>{t.drawer.breakdown}</div>
          <div className="factor-row">
            <span>{t.drawer.rainfallWeight}</span>
            <span className="tabular-nums mono">{(components.rainfall_suitability * 100).toFixed(0)}%</span>
          </div>
          <div className="factor-row">
            <span>{t.drawer.tempWeight}</span>
            <span className="tabular-nums mono">{(components.temperature_suitability * 100).toFixed(0)}%</span>
          </div>
          <div className="factor-row">
            <span>{t.drawer.humidityWeight}</span>
            <span className="tabular-nums mono">{(components.humidity_suitability * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {latestAq && (
        <div className="aq-note" style={{ marginTop: 12 }}>
          Air Quality ({latestAq.recorded_date}):{" "}
          <span className="tabular-nums mono">
            PM2.5 {latestAq.pm2_5 ?? "—"} µg/m³ · US AQI {latestAq.us_aqi ?? "—"}
          </span>
        </div>
      )}

      <div className="drawer-footer">
        <span className="meta-label">
          {t.drawer.updated}: <span className="mono">{district.score_date || "—"}</span>
        </span>
        <Link to={`/districts/${district.id}`} className="btn btn-primary">
          {t.drawer.fullAnalytics} <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  );
}
