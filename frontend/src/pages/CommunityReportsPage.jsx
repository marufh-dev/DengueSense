import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, PlusCircle, ThumbsUp } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

const REPORT_TYPES = [
  "ALL",
  "WATERLOGGING",
  "STAGNANT_WATER",
  "MOSQUITO_ACTIVITY",
  "SUSPECTED_DENGUE_REPORT",
];

export default function CommunityReportsPage() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [showMine, setShowMine] = useState(false);
  const [error, setError] = useState("");
  const [photoModalUrl, setPhotoModalUrl] = useState("");

  const loadReports = () => {
    const params = new URLSearchParams({ limit: "30" });
    if (filterType !== "ALL") params.set("report_type", filterType);
    if (showMine && user) params.set("mine", "true");
    apiRequest(`/api/reports?${params.toString()}`, { token })
      .then((res) => setReports(res.reports || []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadReports();
  }, [filterType, showMine, token]);

  const handleVote = async (reportId) => {
    setError("");
    if (!token) {
      setError("Please sign in to vote on community reports.");
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
          <h1>Community Reports</h1>
          <p className="subtitle">
            Moderated citizen observations (generalized coordinates for privacy; suspected dengue
            reports are not confirmed medical cases).
          </p>
        </div>
        <Link to="/submit-report" className="btn btn-primary">
          <PlusCircle size={15} /> Submit Report
        </Link>
      </div>

      <div className="filter-row" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <select
          aria-label="Filter by category"
          className="input-field"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replaceAll("_", " ")}</option>
          ))}
        </select>

        {user && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showMine}
              onChange={(e) => setShowMine(e.target.checked)}
            />
            Show my submissions (including pending)
          </label>
        )}
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      {reports.length === 0 ? (
        <div className="card">
          <p className="muted-empty" style={{ margin: 0 }}>
            No reports match this filter yet.
          </p>
        </div>
      ) : (
        <div className="two-col-grid">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{r.report_type.replaceAll("_", " ")}</strong>
                <span className="badge badge-nodata">{r.status}</span>
              </div>
              <div className="meta-label" style={{ marginTop: 4 }}>
                {r.district_name} ({r.division}) ·{" "}
                <span className="mono">{r.created_at.slice(0, 10)}</span>
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
                      <Camera size={14} /> Photo
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
              <strong>Report Photo</strong>
              <button type="button" className="btn btn-ghost" onClick={() => setPhotoModalUrl("")}>
                Close
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
