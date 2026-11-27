import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  ExternalLink,
  Megaphone,
  Play,
  Radio,
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
  const { t, lang } = useLanguage();

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom Advisory Dispatcher State
  const [targetScope, setTargetScope] = useState("high_risk");
  const [targetDistrictId, setTargetDistrictId] = useState("");
  const [severity, setSeverity] = useState("HIGH");
  const [headline, setHeadline] = useState(
    lang === "bn"
      ? "জরুরি জলাবদ্ধতা ও ডেঙ্গু মশক নিধন সতর্কতা"
      : "Urgent Waterlogging & Dengue Larvicide Advisory"
  );
  const [customMessage, setCustomMessage] = useState(
    lang === "bn"
      ? "টানা বৃষ্টিপাতের কারণে নিম্নাঞ্চলে জলাবদ্ধতা সৃষ্টি হয়েছে। নিচতলার ড্রেন ও ছাদের পাইপ পরিষ্কার রাখুন। সিটি কর্পোরেশনের ড্রেনেজ ও ফগিং টিম কাজ করছে।"
      : "Continuous rainfall has caused road waterlogging. Municipal drainage and vector control teams are deployed. Please inspect rooftop water tanks, flower pots, and plastic containers immediately."
  );
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [dispatchingCustom, setDispatchingCustom] = useState(false);

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

    apiRequest("/api/districts")
      .then((res) => {
        const dists = res.districts || [];
        setDistricts(dists);
        if (dists.length > 0 && !targetDistrictId) {
          const dhaka = dists.find((d) => d.name_en === "Dhaka") || dists[0];
          setTargetDistrictId(String(dhaka.id));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  // Fetch real-time recipient preview whenever scope or district changes
  const fetchRecipientPreview = (scope, distId) => {
    if (!token) return;
    setLoadingPreview(true);
    const params = new URLSearchParams({ target_type: scope });
    if (scope === "district" && distId) {
      params.set("district_id", distId);
    }
    apiRequest(`/api/admin/alert-recipients-preview?${params.toString()}`, { token })
      .then((res) => setRecipientPreview(res.preview || null))
      .catch(() => setRecipientPreview(null))
      .finally(() => setLoadingPreview(false));
  };

  useEffect(() => {
    if (token) {
      fetchRecipientPreview(targetScope, targetDistrictId);
    }
  }, [token, targetScope, targetDistrictId]);

  const applyTemplate = (type) => {
    if (type === "waterlogging") {
      setHeadline(
        lang === "bn"
          ? "জরুরি জলাবদ্ধতা ও ড্রেন নিষ্কাশন সতর্কতা"
          : "Urgent Waterlogging & Stagnant Pool Advisory"
      );
      setCustomMessage(
        lang === "bn"
          ? "টানা বৃষ্টিপাতের কারণে নিম্নাঞ্চলে জলাবদ্ধতা সৃষ্টি হয়েছে। নিচতলার ড্রেন ও ছাদের পাইপ পরিষ্কার রাখুন। সিটি কর্পোরেশনের ড্রেনেজ টিম কাজ করছে।"
          : "Continuous rainfall has caused road inundation and street waterlogging. Please inspect basements, ground floor drainage pipes, and rooftop gutters immediately. Municipal drainage teams have been alerted."
      );
      setSeverity("CRITICAL");
    } else if (type === "larvicide") {
      setHeadline(
        lang === "bn"
          ? "সিটি কর্পোরেশনের মশক নিধন ও ফগিং সময়সূচি"
          : "City Corporation Larvicide & Fogging Schedule"
      );
      setCustomMessage(
        lang === "bn"
          ? "আজ বিকাল ৪:০০ থেকে সন্ধ্যা ৬:৩০ পর্যন্ত এলাকায় মশক নিধন ওষুধ ছিটানো হবে। ফগিং চলাকালীন দরজা-জানালা বন্ধ রাখুন এবং ফুলের টবের পানি ফেলে দিন।"
          : "Municipal vector control teams will conduct larvicide spraying and thermal fogging today between 4:00 PM and 6:30 PM. Keep doors and windows closed during spraying and empty open flower pots."
      );
      setSeverity("HIGH");
    } else if (type === "outbreak") {
      setHeadline(
        lang === "bn"
          ? "ডেঙ্গুর উচ্চ প্রজনন ঝুঁকি ও স্বাস্থ্য পরামর্শ"
          : "High Dengue Suitability & Fever Screening Alert"
      );
      setCustomMessage(
        lang === "bn"
          ? "আবহাওয়া পরিস্থিতি এডিস মশার দ্রুত বংশবৃদ্ধির জন্য অত্যন্ত অনুকূল। জ্বর হলে কেবল প্যারাসিটামল গ্রহণ করুন (অ্যাসপিরিন/আইবুপ্রোফেন সম্পূর্ণ নিষেধ) এবং প্রয়োজনে ১৬২৬৩ নম্বরে যোগাযোগ করুন।"
          : "Environmental suitability for Aedes breeding is at an alarming peak. If experiencing sudden high fever, use Paracetamol ONLY (no Aspirin/NSAIDs) and visit your nearest health complex or call 16263."
      );
      setSeverity("WARNING");
    }
  };

  const handleDispatchCustomAdvisory = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    if (!customMessage.trim()) {
      setError("Please provide advisory message text.");
      return;
    }
    setDispatchingCustom(true);
    try {
      const res = await apiRequest("/api/admin/dispatch-custom-alert", {
        method: "POST",
        token,
        body: {
          target_type: targetScope,
          district_id: targetScope === "district" ? Number(targetDistrictId) : null,
          risk_level: severity,
          headline,
          custom_message: customMessage,
          force: true,
        },
      });
      const stats = res.stats || {};
      const sent = stats.sent ?? 0;
      const live = stats.live_sent ?? 0;
      const reachedDistricts = (stats.districts || []).join(", ") || "targeted area";
      const recipients = stats.recipients_count ?? 0;
      let customMsg = `${t.admin.dispatchCustomSuccess}: ${sent} notifications dispatched`;
      if (live > 0) {
        customMsg += ` (${live} delivered live via Telegram & Email)`;
      }
      customMsg += ` to ${recipients} active subscribers across [${reachedDistricts}].`;
      setSuccess(customMsg);
      loadData();
      fetchRecipientPreview(targetScope, targetDistrictId);
    } catch (err) {
      setError(err.message);
    } finally {
      setDispatchingCustom(false);
    }
  };

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
        body: { force: true },
        token,
      });
      const sent = res.stats?.sent ?? 0;
      const live = res.stats?.live_sent ?? 0;
      const simulated = res.stats?.simulated ?? 0;
      let msg = `${t.admin.dispatchSuccess} (${sent} notifications generated`;
      if (live > 0) {
        msg += ` · ${live} delivered live via Telegram & Email`;
        if (simulated > 0) msg += `, ${simulated} simulated`;
      } else if (simulated > 0) {
        msg += ` · recorded in user alert history; configure SMTP/Telegram for external delivery`;
      }
      msg += `)`;
      setSuccess(msg);
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

      {/* Manual / Custom District Advisory & Broadcast Dispatcher */}
      <div className="card" style={{ marginBottom: 24, border: "1px solid var(--border-color)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Megaphone size={20} color="var(--accent-primary)" />
              <h2 style={{ margin: 0 }}>{t.admin.customAdvisoryTitle}</h2>
            </div>
            <p className="subtitle" style={{ margin: 0 }}>
              {t.admin.customAdvisoryDesc}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginRight: 4,
              }}
            >
              {t.admin.quickTemplates}:
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={() => applyTemplate("waterlogging")}
            >
              {t.admin.tplWaterlogging}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={() => applyTemplate("larvicide")}
            >
              {t.admin.tplLarvicide}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={() => applyTemplate("outbreak")}
            >
              {t.admin.tplOutbreak}
            </button>
          </div>
        </div>

        <form onSubmit={handleDispatchCustomAdvisory} className="form-stack">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {/* Target Scope */}
            <div className="form-group">
              <label htmlFor="advisory-scope">{t.admin.targetScope}</label>
              <select
                id="advisory-scope"
                className="input-field"
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value)}
              >
                <option value="high_risk">{t.admin.scopeHighRisk}</option>
                <option value="district">{t.admin.scopeSpecific}</option>
                <option value="all">{t.admin.scopeAll}</option>
              </select>
            </div>

            {/* Target District (when specific selected) */}
            {targetScope === "district" && (
              <div className="form-group">
                <label htmlFor="advisory-district">{t.admin.targetDistrict}</label>
                <select
                  id="advisory-district"
                  className="input-field"
                  value={targetDistrictId}
                  onChange={(e) => setTargetDistrictId(e.target.value)}
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {lang === "bn" ? d.name_bn || d.name_en : d.name_en} ({d.division})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Severity Level */}
            <div className="form-group">
              <label htmlFor="advisory-severity">{t.admin.alertSeverity}</label>
              <select
                id="advisory-severity"
                className="input-field"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="WARNING">{t.admin.severityWarning}</option>
                <option value="HIGH">{t.admin.severityHigh}</option>
                <option value="CRITICAL">{t.admin.severityCritical}</option>
              </select>
            </div>
          </div>

          {/* Headline */}
          <div className="form-group">
            <label htmlFor="advisory-headline">{t.admin.advisoryHeadline}</label>
            <input
              id="advisory-headline"
              type="text"
              className="input-field"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={t.admin.headlinePlaceholder}
              required
            />
          </div>

          {/* Message Content */}
          <div className="form-group">
            <label htmlFor="advisory-message">{t.admin.customMessage}</label>
            <textarea
              id="advisory-message"
              className="input-field"
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t.admin.messagePlaceholder}
              required
            />
          </div>

          {/* Live Recipient Reach Preview Banner */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Radio size={16} color="var(--accent-primary)" />
              <span>
                <strong>{t.admin.recipientsPreview}:</strong>{" "}
                {loadingPreview ? (
                  <span style={{ color: "var(--text-muted)" }}>{t.admin.recipientsCalculating}</span>
                ) : recipientPreview?.subscriber_count > 0 ? (
                  <span>
                    <strong style={{ color: "var(--accent-primary)" }}>
                      {recipientPreview.subscriber_count}
                    </strong>{" "}
                    {t.admin.reachSubscribers} ({recipientPreview.email_channels} Email,{" "}
                    {recipientPreview.telegram_channels} Telegram) — [
                    {recipientPreview.districts_covered?.join(", ") || "Targeted Area"}]
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>{t.admin.noRecipientsNotice}</span>
                )}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={dispatchingCustom || !customMessage.trim()}
              >
                {dispatchingCustom ? (
                  <RefreshCw size={14} className="spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>
                  {dispatchingCustom ? t.admin.dispatching : t.admin.dispatchCustomBtn}
                </span>
              </button>
            </div>
          </div>
        </form>
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
