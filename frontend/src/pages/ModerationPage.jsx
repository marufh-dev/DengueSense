import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ModerationPage() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  const loadQueue = () => {
    apiRequest(`/api/moderation/reports?status=${statusFilter}`, { token })
      .then((res) => setReports(res.reports || []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (token) loadQueue();
  }, [statusFilter, token]);

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
          <h1>Moderation Dashboard</h1>
          <p className="subtitle">Review, approve, or reject citizen community reports.</p>
        </div>
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

      {error && <div className="alert-banner alert-error">{error}</div>}

      {reports.length === 0 ? (
        <div className="card">
          <p className="muted-empty" style={{ margin: 0 }}>No {statusFilter.toLowerCase()} reports.</p>
        </div>
      ) : (
        <div className="two-col-grid">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{r.report_type.replaceAll("_", " ")}</strong>
                <span className="badge badge-nodata">{r.status}</span>
              </div>
              <div className="meta-label" style={{ marginTop: 4 }}>
                {r.districts?.name_en} · <span className="mono">{r.latitude}, {r.longitude}</span>
              </div>
              <p style={{ margin: "10px 0" }}>{r.description}</p>
              <input
                type="text"
                className="input-field"
                placeholder="Moderator notes (optional)"
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
                  <Check size={14} /> Approve
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleAction(r.id, "REJECT")}
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
