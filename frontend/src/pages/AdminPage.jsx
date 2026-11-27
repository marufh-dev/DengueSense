import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  CheckCircle2,
  Database,
  ExternalLink,
  Play,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function AdminPage() {
  const { token, role } = useAuth();
  const { t } = useLanguage();

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = () => {
    setError("");
    setLoadingOverview(true);
    apiRequest("/api/admin/overview", { token })
      .then((res) => setOverview(res.overview || null))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOverview(false));

    setLoadingUsers(true);
    apiRequest("/api/admin/users", { token })
      .then((res) => setUsers(res.users || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleTriggerIngest = async () => {
    setError("");
    setSuccess("");
    setIngesting(true);
    try {
      const res = await apiRequest("/api/admin/trigger-ingest", {
        method: "POST",
        token,
        body: { days_back: 1 },
      });
      const updated = res.summary?.districts_updated ?? 64;
      setSuccess(`${t.admin.ingestSuccess} (${updated} districts updated)`);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIngesting(false);
    }
  };

  const handleDispatchAlerts = async () => {
    setError("");
    setSuccess("");
    setDispatching(true);
    try {
      const res = await apiRequest("/api/admin/dispatch-alerts", {
        method: "POST",
        token,
      });
      const sent = res.stats?.sent ?? 0;
      setSuccess(`${t.admin.dispatchSuccess} (${sent} notifications dispatched)`);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDispatching(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setSuccess("");
    setUpdatingUserId(userId);
    try {
      await apiRequest(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        token,
        body: { role: newRole },
      });
      setSuccess(t.admin.roleUpdated);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ margin: 0 }}>{t.admin.title}</h1>
            <span className="badge badge-low" style={{ textTransform: "uppercase" }}>
              {role}
            </span>
          </div>
          <p className="subtitle">{t.admin.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={loadData} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <Link to="/moderation" className="btn btn-secondary">
            <Shield size={14} />
            <span>{t.admin.viewModeration}</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Status Notifications */}
      {error && <div className="alert-banner alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-banner alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {/* KPI Stats Grid */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">
            <Users size={14} /> {t.admin.totalUsers}
          </div>
          <div className="kpi-value tabular-nums">
            {loadingOverview ? "…" : overview?.total_users ?? 0}
          </div>
          <div className="meta-label">Supabase Auth verified profiles</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <Activity size={14} /> {t.admin.districtsMonitored}
          </div>
          <div className="kpi-value tabular-nums">
            {loadingOverview ? "…" : `${overview?.districts_monitored ?? 0} / 64`}
          </div>
          <div className="meta-label">
            {overview?.high_critical_districts ?? 0} districts at High/Critical
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <ShieldAlert size={14} /> {t.admin.pendingReports}
          </div>
          <div className="kpi-value tabular-nums">
            {loadingOverview ? "…" : overview?.pending_reports ?? 0}
          </div>
          <div className="meta-label">
            {overview?.total_reports ?? 0} total citizen submissions
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <Bell size={14} /> {t.admin.activeAlertSubs}
          </div>
          <div className="kpi-value tabular-nums">
            {loadingOverview ? "…" : overview?.active_alert_subs ?? 0}
          </div>
          <div className="meta-label">Email & Telegram recipients</div>
        </div>
      </div>

      {/* Operational Actions Grid */}
      <div className="two-col-grid" style={{ marginBottom: 24 }}>
        {/* Ingestion & Pipeline Engine */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Database size={18} color="var(--accent-primary)" />
            <h2 style={{ margin: 0 }}>{t.admin.pipelineTitle}</h2>
          </div>
          <p className="subtitle" style={{ marginBottom: 16 }}>
            {t.admin.pipelineDesc}
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTriggerIngest}
              disabled={ingesting}
            >
              {ingesting ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
              <span>{ingesting ? t.admin.ingesting : t.admin.triggerIngest}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDispatchAlerts}
              disabled={dispatching}
            >
              {dispatching ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
              <span>{dispatching ? t.admin.dispatching : t.admin.dispatchAlerts}</span>
            </button>
          </div>

          <div className="meta-label">
            Latest Ingest Status:{" "}
            <span className="mono" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
              {overview?.latest_ingest?.status || "SUCCESS"}
            </span>{" "}
            ({overview?.latest_ingest?.districts_updated ?? 64}/64 districts updated)
          </div>
        </div>

        {/* Recent Ingestion Logs */}
        <div className="card">
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>{t.admin.recentLogsTitle}</h2>
          {!overview?.recent_logs || overview.recent_logs.length === 0 ? (
            <p className="muted-empty">No ingestion logs available.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>{t.admin.colJob}</th>
                    <th>{t.admin.colStatus}</th>
                    <th>{t.admin.colDistricts}</th>
                    <th>{t.admin.colStarted}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recent_logs.map((log) => (
                    <tr key={log.id}>
                      <td className="mono">{log.job_name}</td>
                      <td>
                        <span className={`badge ${log.status === "success" ? "badge-low" : "badge-critical"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="tabular-nums">{log.districts_updated}</td>
                      <td className="meta-label mono" style={{ fontSize: 11 }}>
                        {(log.started_at || "").slice(0, 16).replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Directory & Role Assignment */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Shield size={18} color="var(--accent-primary)" />
          <h2 style={{ margin: 0 }}>{t.admin.usersTitle}</h2>
        </div>
        <p className="subtitle" style={{ marginBottom: 16 }}>
          {t.admin.usersDesc}
        </p>

        {loadingUsers ? (
          <p className="muted-empty">Loading user profiles…</p>
        ) : users.length === 0 ? (
          <p className="muted-empty">No users found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th>{t.admin.colUser}</th>
                  <th>{t.admin.colEmail}</th>
                  <th>{t.admin.colRole}</th>
                  <th>{t.admin.colJoined}</th>
                  <th>{t.admin.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.display_name}</strong>
                    </td>
                    <td className="mono" style={{ color: "var(--ink-secondary)" }}>
                      {u.email}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === "admin"
                            ? "badge-critical"
                            : u.role === "moderator"
                            ? "badge-moderate"
                            : "badge-low"
                        }`}
                        style={{ textTransform: "capitalize" }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="meta-label mono" style={{ fontSize: 11 }}>
                      {(u.created_at || "").slice(0, 10)}
                    </td>
                    <td>
                      <select
                        className="input-field"
                        style={{ padding: "4px 8px", fontSize: 12, minHeight: 30 }}
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        aria-label={`Change role for ${u.display_name}`}
                      >
                        <option value="citizen">Citizen</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
