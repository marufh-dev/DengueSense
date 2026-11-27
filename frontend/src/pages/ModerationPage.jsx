import { useEffect, useState } from "react";
import { AlertTriangle, Car, Check, CloudRain, X } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function ModerationPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  const loadQueue = () => {
    const params = new URLSearchParams({ status: statusFilter });
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    apiRequest(`/api/moderation/reports?${params.toString()}`, { token })
      .then((res) => setReports(res.reports || []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (token) loadQueue();
  }, [statusFilter, priorityFilter, token]);

  const handleAction = async (reportId, action) => {
    setError("");
    try {
      await apiRequest(`/api/moderation/reports/${reportId}`, {
        method: "POST",
        body: { action, notes: notes[reportId] || "" },
        token,
      });
      loadQueue();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{t.moderation.title}</h1>
          <p className="subtitle">{t.moderation.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            aria-label="Filter moderation priority"
            className="input-field"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">{t.moderation.allPriorities}</option>
            <option value="HIGH_WATERLOGGING_ALERT">{t.reports.highPriorityOnly}</option>
            <option value="STANDARD">{t.reports.standardPriority}</option>
          </select>
          <select
            aria-label="Filter moderation status"
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      {reports.length === 0 ? (
        <div className="card">
          <p className="muted-empty" style={{ margin: 0 }}>{t.moderation.empty}</p>
        </div>
      ) : (
        <div className="two-col-grid">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{t.submit.types[r.report_type] || r.report_type}</strong>
                <span className="badge badge-nodata">{r.status}</span>
              </div>
              <div className="meta-label" style={{ marginTop: 4 }}>
                {r.districts?.name_en} · <span className="mono">{r.latitude}, {r.longitude}</span>
              </div>

              {r.priority === "HIGH_WATERLOGGING_ALERT" && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.3)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  color: "var(--color-critical, #dc2626)",
                  margin: "8px 0",
                }}>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <AlertTriangle size={14} /> {t.moderation.highAlertBadge}
                  </strong>
                  <span style={{ fontSize: "0.76rem", opacity: 0.9, lineHeight: 1.35 }}>
                    {t.moderation.priorityElevatedNote}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
                {r.is_rain_event && (
                  <span className="badge" style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", border: "1px solid rgba(2, 132, 199, 0.25)", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CloudRain size={12} /> {t.moderation.rainEventTag}
                  </span>
                )}
                {r.congestion_level && r.congestion_level !== "NONE" && (
                  <span className="badge" style={{
                    background: r.congestion_level === "SEVERE_STANDSTILL" ? "rgba(220, 38, 38, 0.12)" : "rgba(217, 119, 6, 0.12)",
                    color: r.congestion_level === "SEVERE_STANDSTILL" ? "#dc2626" : "#d97706",
                    border: `1px solid ${r.congestion_level === "SEVERE_STANDSTILL" ? "rgba(220, 38, 38, 0.25)" : "rgba(217, 119, 6, 0.25)"}`,
                    fontSize: "0.75rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <Car size={12} /> {r.congestion_level === "SEVERE_STANDSTILL" ? t.reports.trafficStandstill : t.reports.trafficModerate}
                  </span>
                )}
              </div>

              <p style={{ margin: "10px 0" }}>{r.description}</p>
              <input
                type="text"
                className="input-field"
                placeholder={t.moderation.notesPlaceholder}
                value={notes[r.id] || ""}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                style={{ width: "100%", marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAction(r.id, "APPROVE")}
                >
                  <Check size={14} /> {t.moderation.approve}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleAction(r.id, "REJECT")}
                >
                  <X size={14} /> {t.moderation.reject}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
