import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, PlusCircle, ThumbsUp } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const REPORT_TYPES = [
  "ALL",
  "WATERLOGGING",
  "STAGNANT_WATER",
  "MOSQUITO_ACTIVITY",
  "SUSPECTED_DENGUE_REPORT",
];

export default function CommunityReportsPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showMine, setShowMine] = useState(false);
  const [error, setError] = useState("");
  const [photoModalUrl, setPhotoModalUrl] = useState("");

  const loadReports = () => {
    const params = new URLSearchParams({ limit: "30" });
    if (filterType !== "ALL") params.set("report_type", filterType);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (showMine && user) params.set("mine", "true");
    apiRequest(`/api/reports?${params.toString()}`, { token })
      .then((res) => setReports(res.reports || []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadReports();
  }, [filterType, priorityFilter, showMine, token]);

  const handleVote = async (reportId) => {
    setError("");
    if (!token) {
      setError(t.reports.signInToVote);
      return;
    }
    try {
      await apiRequest(`/api/reports/${reportId}/vote`, {
        method: "POST",
        body: { vote: 1 },
        token,
      });
      loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewPhoto = async (reportId) => {
    try {
      const res = await apiRequest(`/api/reports/${reportId}/photo`, { token });
      if (res.signed_url) setPhotoModalUrl(res.signed_url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{t.reports.title}</h1>
          <p className="subtitle">{t.reports.subtitle}</p>
        </div>
        <Link to="/submit-report" className="btn btn-primary">
          <PlusCircle size={15} /> {t.reports.submitBtn}
        </Link>
      </div>

      <div className="filter-row" style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <select
          aria-label="Filter by category"
          className="input-field"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "ALL" ? t.mapPage.allDivisions : t.submit.types[type] || type}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          className="input-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="ALL">{t.reports.allPriorities}</option>
          <option value="HIGH_WATERLOGGING_ALERT">{t.reports.highPriorityOnly}</option>
          <option value="STANDARD">{t.reports.standardPriority}</option>
        </select>

        {user && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showMine}
              onChange={(e) => setShowMine(e.target.checked)}
            />
            {t.reports.showMine}
          </label>
        )}
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      {reports.length === 0 ? (
        <div className="card">
          <p className="muted-empty" style={{ margin: 0 }}>{t.reports.empty}</p>
        </div>
      ) : (
        <div className="two-col-grid">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{t.submit.types[r.report_type] || r.report_type}</strong>
                <span className="badge badge-nodata">{r.status}</span>
              </div>
              <div className="meta-label" style={{ marginTop: 4 }}>
                {r.district_name} ({r.division}) ·{" "}
                <span className="mono">{r.created_at.slice(0, 10)}</span>
              </div>

              {r.priority === "HIGH_WATERLOGGING_ALERT" && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(220, 38, 38, 0.1)",
                  color: "var(--color-critical, #dc2626)",
                  border: "1px solid rgba(220, 38, 38, 0.28)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  marginTop: 6,
                }}>
                  <span>🚨 {t.reports.highAlertBadge}</span>
                  <span style={{ fontSize: "0.72rem", opacity: 0.85, fontWeight: 400 }}>({t.reports.highAlertDesc})</span>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
                {r.is_rain_event && (
                  <span className="badge" style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", border: "1px solid rgba(2, 132, 199, 0.25)", fontSize: "0.75rem" }}>
                    🌧️ {t.reports.rainEventBadge}
                  </span>
                )}
                {r.congestion_level && r.congestion_level !== "NONE" && (
                  <span className="badge" style={{
                    background: r.congestion_level === "SEVERE_STANDSTILL" ? "rgba(220, 38, 38, 0.12)" : "rgba(217, 119, 6, 0.12)",
                    color: r.congestion_level === "SEVERE_STANDSTILL" ? "#dc2626" : "#d97706",
                    border: `1px solid ${r.congestion_level === "SEVERE_STANDSTILL" ? "rgba(220, 38, 38, 0.25)" : "rgba(217, 119, 6, 0.25)"}`,
                    fontSize: "0.75rem"
                  }}>
                    🚗 {r.congestion_level === "SEVERE_STANDSTILL" ? t.reports.trafficStandstill : t.reports.trafficModerate}
                  </span>
                )}
              </div>

              <p style={{ margin: "10px 0" }}>{r.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleVote(r.id)}
                  >
                    <ThumbsUp size={14} />
                    <span className="tabular-nums">{r.votes}</span>
                  </button>
                  {r.has_photo && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleViewPhoto(r.id)}
                    >
                      <Camera size={14} /> {t.reports.photoBtn}
                    </button>
                  )}
                </div>
                <span className="mono meta-label">
                  ~{Number(r.latitude).toFixed(2)}, {Number(r.longitude).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {photoModalUrl && (
        <div className="modal-backdrop" onClick={() => setPhotoModalUrl("")}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <strong>{t.reports.photoBtn}</strong>
              <button type="button" className="btn btn-ghost" onClick={() => setPhotoModalUrl("")}>
                {t.reports.close}
              </button>
            </div>
            <img
              src={photoModalUrl}
              alt="Community report evidence"
              style={{ width: "100%", borderRadius: 6, maxHeight: 420, objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
