import { Link } from "react-router-dom";
import { ArrowRight, CloudRain, Droplets, Thermometer, Users } from "lucide-react";
import RiskBadge from "./RiskBadge";

export default function DistrictDrawer({ district, detail, loading }) {
  if (!district) {
    return (
      <aside className="card drawer-card">
        <h3 style={{ marginTop: 0 }}>Select a District</h3>
        <p style={{ color: "var(--ink-secondary)", marginBottom: 0 }}>
          Click any of the 64 districts on the Bangladesh map to inspect its Environmental Dengue
          Suitability Index (EDSI), recent weather inputs, and community signals.
        </p>
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
          <div className="meta-label">{district.division} Division · {district.district_code}</div>
          <h2 style={{ margin: "4px 0 2px", fontSize: "1.25rem" }}>
            {district.name_en}
            {district.name_bn && (
              <span style={{ color: "var(--ink-muted)", fontWeight: 400, marginLeft: 8, fontSize: "1rem" }}>
                ({district.name_bn})
              </span>
            )}
          </h2>
        </div>
        <RiskBadge level={district.risk_level} score={district.environmental_score} />
      </div>

      {loading && <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Loading district metrics…</p>}

      <div className="metric-grid" style={{ marginTop: 16 }}>
        <div className="metric-tile">
          <div className="metric-label"><Thermometer size={14} /> Mean Temp</div>
          <div className="metric-value tabular-nums">
            {inputs.latest_temp_c ?? latestWeather?.temp_mean ?? "—"} °C
          </div>
        </div>
        <div className="metric-tile">
          <div className="metric-label"><Droplets size={14} /> Humidity</div>
          <div className="metric-value tabular-nums">
            {inputs.latest_humidity_pct ?? latestWeather?.humidity_mean ?? "—"} %
          </div>
        </div>
        <div className="metric-tile">
          <div className="metric-label"><CloudRain size={14} /> 21d Rainfall</div>
          <div className="metric-value tabular-nums">
            {inputs.cumulative_rainfall_21d_mm ?? "—"} mm
          </div>
        </div>
        <div className="metric-tile">
          <div className="metric-label"><Users size={14} /> Community Signal</div>
          <div className="metric-value tabular-nums">
            {Number(district.community_signal_score || 0).toFixed(1)} / 100
          </div>
        </div>
      </div>

      {components.rainfall_suitability !== undefined && (
        <div className="breakdown-box" style={{ marginTop: 16 }}>
          <div className="meta-label" style={{ marginBottom: 8 }}>EDSI Factor Breakdown (Normalized)</div>
          <div className="factor-row">
            <span>Rainfall (43.75%)</span>
            <span className="tabular-nums mono">{(components.rainfall_suitability * 100).toFixed(0)}%</span>
          </div>
          <div className="factor-row">
            <span>Temperature (31.25%)</span>
            <span className="tabular-nums mono">{(components.temperature_suitability * 100).toFixed(0)}%</span>
          </div>
          <div className="factor-row">
            <span>Humidity (25.00%)</span>
            <span className="tabular-nums mono">{(components.humidity_suitability * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {latestAq && (
        <div className="aq-note" style={{ marginTop: 12 }}>
          Supplementary Air Quality ({latestAq.recorded_date}):{" "}
          <span className="tabular-nums mono">
            PM2.5 {latestAq.pm2_5 ?? "—"} µg/m³ · US AQI {latestAq.us_aqi ?? "—"}
          </span>
        </div>
      )}

      <div className="drawer-footer">
        <span className="meta-label">
          Updated: <span className="mono">{district.score_date || "No data"}</span>
        </span>
        <Link to={`/districts/${district.id}`} className="btn btn-primary">
          Full Analytics <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  );
}
