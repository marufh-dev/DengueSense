export default function AboutPage() {
  return (
    <div className="container">
      <h1>About DengueSense</h1>
      <p className="subtitle">
        Open-data-driven environmental dengue early warning and community reporting across all 64
        districts of Bangladesh.
      </p>

      <div className="two-col-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Version 1 — Functional University MVP</h2>
          <p>
            Provides daily automated Open-Meteo weather &amp; air-quality ingestion in{" "}
            <code>Asia/Dhaka</code>, a transparent rule-based EDSI suitability map over 64
            validated geoBoundaries district polygons, privacy-preserving community reporting,
            role-based moderation, and district alert subscriptions.
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Version 2 — AI/ML &amp; Research Roadmap</h2>
          <p>
            The PostgreSQL + PostGIS schema preserves clean, source-traceable daily observations for
            future integration of DGHS/OpenDengue epidemiological ground truth, lagged ML/DL models
            (XGBoost, LightGBM, LSTM, ST-GNN) with SHAP explainability, computer-vision photo
            verification, and Sentinel-1 SAR waterlogging analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
