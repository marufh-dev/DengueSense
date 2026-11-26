import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function MethodologyPage() {
  const { t } = useLanguage();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    apiRequest("/api/data-health").then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>{t.methodology.title}</h1>
      <p className="subtitle">{t.methodology.subtitle}</p>

      <div className="two-col-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.methodology.edsiTitle}</h2>
          <p>{t.methodology.edsiIntro}</p>
          <ul>
            <li>{t.methodology.rainRule}</li>
            <li>{t.methodology.tempRule}</li>
            <li>{t.methodology.humidityRule}</li>
          </ul>
          <p style={{ color: "var(--ink-secondary)" }}>{t.methodology.missingRule}</p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.methodology.commTitle}</h2>
          <p>{t.methodology.commBody}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>{t.methodology.sourcesTitle}</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.methodology.colSource}</th>
                <th>{t.methodology.colDataset}</th>
                <th>{t.methodology.colLicense}</th>
                <th>{t.methodology.colAttr}</th>
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
