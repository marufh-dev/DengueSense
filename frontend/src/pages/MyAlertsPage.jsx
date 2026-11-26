import { useEffect, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function MyAlertsPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();
  const [districts, setDistricts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [districtId, setDistrictId] = useState("");
  const [radiusKm, setRadiusKm] = useState("10");
  const [channels, setChannels] = useState(["email"]);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAlerts = () => {
    apiRequest("/api/alerts", { token })
      .then((res) => {
        setSubscriptions(res.subscriptions || []);
        setNotifications(res.notifications || []);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    apiRequest("/api/districts")
      .then((res) => {
        const list = res.districts || [];
        setDistricts(list);
        if (list[0]) setDistrictId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (token) loadAlerts();
  }, [token]);

  const toggleChannel = (ch) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiRequest("/api/alerts", {
        method: "POST",
        token,
        body: {
          district_id: districtId,
          radius_km: radiusKm ? Number(radiusKm) : null,
          notification_channels: channels.length ? channels : ["email"],
          telegram_chat_id: telegramChatId.trim() || null,
          is_active: true,
        },
      });
      setSuccess(t.alerts.savedMsg);
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await apiRequest(`/api/alerts/${id}`, { method: "DELETE", token });
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>{t.alerts.title}</h1>
      <p className="subtitle">{t.alerts.subtitle}</p>

      {error && <div className="alert-banner alert-error" style={{ marginTop: 12 }}>{error}</div>}
      {success && <div className="alert-banner alert-success" style={{ marginTop: 12 }}>{success}</div>}

      <div className="two-col-grid" style={{ marginTop: 16 }}>
        <form onSubmit={handleSave} className="card form-stack">
          <h2 style={{ marginTop: 0 }}>{t.alerts.formTitle}</h2>
          <div className="form-group">
            <label htmlFor="alert-dist">{t.alerts.district}</label>
            <select
              id="alert-dist"
              className="input-field"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === "bn" ? d.name_bn || d.name_en : d.name_en} ({d.division})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="alert-radius">{t.alerts.radius}</label>
            <input
              id="alert-radius"
              type="number"
              min="1"
              max="100"
              className="input-field"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{t.alerts.channels}</label>
            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={channels.includes("email")}
                  onChange={() => toggleChannel("email")}
                />
                {t.alerts.email}
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={channels.includes("telegram")}
                  onChange={() => toggleChannel("telegram")}
                />
                {t.alerts.telegram}
              </label>
            </div>
          </div>

          {channels.includes("telegram") && (
            <div className="form-group">
              <label htmlFor="alert-tg">{t.alerts.telegramId}</label>
              <input
                id="alert-tg"
                type="text"
                className="input-field"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 123456789"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            <Bell size={14} /> {t.alerts.saveBtn}
          </button>
        </form>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.alerts.activeTitle}</h2>
          {subscriptions.length === 0 ? (
            <p className="muted-empty">{t.alerts.noSubs}</p>
          ) : (
            <ul className="simple-list">
              {subscriptions.map((s) => (
                <li key={s.id} className="simple-list-item" style={{ alignItems: "center" }}>
                  <div>
                    <strong>{s.districts?.name_en}</strong> ({s.districts?.division})
                    <div className="meta-label">
                      {(s.notification_channels || []).join(", ")}
                      {s.radius_km ? ` · ${s.radius_km} km` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    aria-label={`Remove ${s.districts?.name_en} alert`}
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: 20 }}>{t.alerts.historyTitle}</h3>
          {notifications.length === 0 ? (
            <p className="muted-empty">{t.alerts.noNotifs}</p>
          ) : (
            <ul className="simple-list">
              {notifications.map((n) => (
                <li key={n.id} className="simple-list-item">
                  <div>
                    <strong>{n.risk_level}</strong> · <span className="mono">{n.channel}</span>
                    <div className="meta-label">{n.message}</div>
                  </div>
                  <span className="mono meta-label">{n.alert_date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
