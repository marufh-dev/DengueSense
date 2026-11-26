import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, MapPin } from "lucide-react";
import { apiRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import BangladeshMap from "../components/BangladeshMap";
import DistrictDrawer from "../components/DistrictDrawer";
import RiskBadge from "../components/RiskBadge";

export default function DashboardPage() {
  const { lang, t } = useLanguage();
  const [riskData, setRiskData] = useState(null);
  const [dataHealth, setDataHealth] = useState(null);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest("/api/districts/risk"),
      apiRequest("/api/data-health"),
      apiRequest("/api/reports?limit=10"),
    ])
      .then(([rk, dh, rep]) => {
        setRiskData(rk);
        setDataHealth(dh);
        setReports(rep.reports || []);
        const dhaka = (rk.districts || []).find((d) => d.name_en === "Dhaka");
        if (dhaka) {
          handleSelectDistrict(dhaka);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSelectDistrict = (district) => {
    setSelected(district);
    setDetailLoading(true);
    apiRequest(`/api/districts/${district.id}`)
      .then((res) => setDetail(res))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const summary = riskData?.summary || {};
  const districts = riskData?.districts || [];
  const withData = districts.filter((d) => d.risk_level !== "NO DATA").length;
  const latestLog = dataHealth?.latest_log;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{t.dashboard.title}</h1>
          <p className="subtitle">{t.dashboard.subtitle}</p>
        </div>
        {latestLog && (
          <div className="freshness-pill">
            <CheckCircle2 size={14} color="var(--accent-primary)" />
            <span>
              {t.dashboard.lastIngest}:{" "}
              <span className="mono tabular-nums">
                {(latestLog.completed_at || latestLog.started_at || "").slice(0, 16).replace("T", " ")}
              </span>
            </span>
          </div>
        )}
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      <section className="kpi-grid" aria-label="National summary metrics">
        <div className="card kpi-card">
          <div className="kpi-label"><MapPin size={14} /> {t.dashboard.totalDistricts}</div>
          <div className="kpi-value tabular-nums">{riskData?.total_districts ?? "—"}</div>
          <div className="kpi-sub tabular-nums">{withData} {t.dashboard.withData}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label"><AlertTriangle size={14} color="var(--risk-high-text)" /> {t.dashboard.highSuitability}</div>
          <div className="kpi-value tabular-nums" style={{ color: "var(--risk-high-text)" }}>
            {summary.HIGH ?? "—"}
          </div>
          <div className="kpi-sub">EDSI 55.0 – 74.9</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label"><AlertTriangle size={14} color="var(--risk-critical-text)" /> {t.dashboard.criticalSuitability}</div>
          <div className="kpi-value tabular-nums" style={{ color: "var(--risk-critical-text)" }}>
            {summary.CRITICAL ?? "—"}
          </div>
          <div className="kpi-sub">EDSI 75.0 – 100</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label"><Database size={14} /> {t.dashboard.ingestionStatus}</div>
          <div className="kpi-value" style={{ fontSize: "1.25rem", textTransform: "uppercase" }}>
            {latestLog?.status ?? "—"}
          </div>
          <div className="kpi-sub tabular-nums">
            {latestLog ? `${latestLog.districts_updated} / 64 ${t.dashboard.districtsUpdated}` : "…"}
          </div>
        </div>
      </section>

      <section className="split-layout" style={{ marginTop: 24 }}>
        <div className="map-col">
          <BangladeshMap
            districts={districts}
            reports={reports}
            selectedDistrictId={selected?.id}
            onSelectDistrict={handleSelectDistrict}
            height="540px"
          />
        </div>
        <div className="drawer-col">
          <DistrictDrawer district={selected} detail={detail} loading={detailLoading} />
        </div>
      </section>

      <section className="two-col-grid" style={{ marginTop: 24 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.dashboard.recentReports}</h2>
          {reports.length === 0 ? (
            <p className="muted-empty">{t.dashboard.noReports}</p>
          ) : (
            <ul className="simple-list">
              {reports.map((r) => (
                <li key={r.id} className="simple-list-item">
                  <div>
                    <strong>{r.report_type.replaceAll("_", " ")}</strong> ·{" "}
                    <span>{r.district_name}</span>
                    <div className="meta-label">{r.description}</div>
                  </div>
                  <span className="mono meta-label">{r.created_at.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.dashboard.topDistricts}</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.dashboard.colDistrict}</th>
                  <th>{t.dashboard.colDivision}</th>
                  <th>{t.dashboard.colEdsi}</th>
                  <th>{t.dashboard.colLevel}</th>
                </tr>
              </thead>
              <tbody>
                {[...districts]
                  .sort((a, b) => (b.environmental_score ?? -1) - (a.environmental_score ?? -1))
                  .slice(0, 8)
                  .map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDistrict(d)}
                      style={{ cursor: "pointer" }}
                    >
                      <td><strong>{lang === "bn" ? d.name_bn || d.name_en : d.name_en}</strong></td>
                      <td>{d.division}</td>
                      <td className="tabular-nums mono">
                        {d.environmental_score !== null ? d.environmental_score.toFixed(1) : "—"}
                      </td>
                      <td><RiskBadge level={d.risk_level} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
