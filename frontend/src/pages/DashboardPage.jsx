import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, MapPin, X } from "lucide-react";
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
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [dismissTour, setDismissTour] = useState(() => {
    return localStorage.getItem("denguesense_tour_dismissed") === "true";
  });

  const handleDismissTour = () => {
    setDismissTour(true);
    localStorage.setItem("denguesense_tour_dismissed", "true");
  };

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

      {!dismissTour && (
        <div style={{
          marginTop: 16,
          padding: "12px 18px",
          borderRadius: "var(--radius, 12px)",
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(15, 23, 42, 0.6))",
          border: "1px solid rgba(2, 132, 199, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(2, 132, 199, 0.2)",
              display: "grid",
              placeItems: "center",
              fontSize: "1.1rem"
            }}>
              🧭
            </div>
            <div>
              <strong style={{ fontSize: "0.92rem", color: "var(--ink-primary)" }}>
                {t.tour.bannerTitle}
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                {t.tour.bannerSub}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              onClick={() => {
                setTourStep(0);
                setShowTour(true);
              }}
            >
              {t.tour.startTour}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "6px 10px", fontSize: "0.82rem" }}
              onClick={handleDismissTour}
            >
              {t.tour.dismiss}
            </button>
          </div>
        </div>
      )}

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
          <div className="kpi-label"><Activity size={14} color="var(--accent-primary)" /> {t.dashboard.activeReportsCount}</div>
          <div className="kpi-value tabular-nums" style={{ color: "var(--accent-primary)" }}>
            {reports.length}
          </div>
          <div className="kpi-sub">{t.dashboard.activeReportsSub}</div>
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
                    {r.priority === "HIGH_WATERLOGGING_ALERT" && (
                      <span className="badge badge-high" style={{ marginLeft: 6, fontSize: "0.7rem", padding: "2px 6px", background: "rgba(220, 38, 38, 0.12)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.25)" }}>
                        🚨 {lang === "bn" ? "জরুরি জলাবদ্ধতা" : "High Waterlogging"}
                      </span>
                    )}
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

      {/* 60-Second Onboarding Tour Modal */}
      {showTour && (
        <div className="modal-backdrop" onClick={() => setShowTour(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-low" style={{ background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
                {t.tour.stepLabel} {tourStep + 1} / 4
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => setShowTour(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: "center", margin: "20px 0 16px" }}>
              <div style={{ fontSize: "3rem", marginBottom: 10 }}>
                {tourStep === 0 && "🗺️"}
                {tourStep === 1 && "🚨"}
                {tourStep === 2 && "🩺"}
                {tourStep === 3 && "🛡️"}
              </div>
              <h2 style={{ fontSize: "1.25rem", margin: "0 0 8px" }}>
                {tourStep === 0 && t.tour.step1Title}
                {tourStep === 1 && t.tour.step2Title}
                {tourStep === 2 && t.tour.step3Title}
                {tourStep === 3 && t.tour.step4Title}
              </h2>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
                {tourStep === 0 && t.tour.step1Desc}
                {tourStep === 1 && t.tour.step2Desc}
                {tourStep === 2 && t.tour.step3Desc}
                {tourStep === 3 && t.tour.step4Desc}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={tourStep === 0}
                onClick={() => setTourStep((s) => Math.max(0, s - 1))}
              >
                {t.tour.prev}
              </button>

              {tourStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setTourStep((s) => s + 1)}
                >
                  {t.tour.next} <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTour(false);
                    handleDismissTour();
                  }}
                >
                  {t.tour.finish}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
