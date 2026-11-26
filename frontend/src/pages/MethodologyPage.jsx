import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";

export default function MethodologyPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    apiRequest("/api/data-health").then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Data Sources &amp; EDSI Methodology</h1>
      <p className="subtitle">
        Transparent, provisional V1 heuristic for Aedes aegypti environmental suitability.
      </p>

      <div className="two-col-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Environmental Dengue Suitability Index (EDSI)</h2>
          <p>
            EDSI measures meteorological favorability on a <span className="mono">0–100</span> scale
            using normalized weights:
          </p>
          <ul>
            <li><strong>Rainfall (0.4375):</strong> 21-day lagged cumulative precipitation (optimal 80–250 mm).</li>
            <li><strong>Temperature (0.3125):</strong> Suitability curve peaking at 28°C (favorable 25–32°C).</li>
            <li><strong>Humidity (0.2500):</strong> Elevated suitability above 70% relative humidity.</li>
          </ul>
          <p style={{ color: "var(--ink-secondary)" }}>
            <strong>Missing Data:</strong> Districts missing required weather inputs display{" "}
            <code>NO DATA</code> rather than <code>LOW</code>. Air quality (PM2.5/AQI) is collected
            for V2 research only and is excluded from the V1 EDSI formula.
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Community Signal Separation</h2>
          <p>
            Approved citizen reports (<code>WATERLOGGING</code>, <code>STAGNANT_WATER</code>,{" "}
            <code>MOSQUITO_ACTIVITY</code>) contribute to a separate Community Signal Score (0–100)
            with 14-day freshness decay. <code>SUSPECTED_DENGUE_REPORT</code> entries are never
            treated as confirmed medical cases or environmental measurements.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Verified Data Sources</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Dataset</th>
                <th>License</th>
                <th>Attribution</th>
              </tr>
            </thead>
            <tbody>
              {(health?.data_sources || []).map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.source_name}</strong></td>
                  <td>{s.dataset_name}</td>
                  <td><span className="mono">{s.license}</span></td>
                  <td>{s.attribution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
