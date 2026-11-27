import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  CheckCircle2,
  Compass,
  Mail,
  MapPin,
  Save,
  Send,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { apiRequest } from "../api/client";
import TelegramHelper, { extractTelegramId } from "../components/TelegramHelper";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

// Predefined tactical avatars (no photo uploads, pure SVG icons matching the #14080e / #49475b day palette)
const PREDEFINED_AVATARS = [
  { id: "avatar-shield", label: "Sentinel Shield", icon: Shield },
  { id: "avatar-user", label: "Citizen Scout", icon: User },
  { id: "avatar-compass", label: "Navigator", icon: Compass },
  { id: "avatar-activity", label: "Epidemiologist", icon: Activity },
  { id: "avatar-zap", label: "Rapid Responder", icon: Zap },
  { id: "avatar-award", label: "Community Guard", icon: Award },
];

export default function ProfilePage() {
  const { user, token, profile, refreshProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [districts, setDistricts] = useState([]);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarId, setAvatarId] = useState(
    () => profile?.avatar_id || localStorage.getItem("denguesense_user_avatar") || "avatar-shield"
  );
  const [preferredDistrictId, setPreferredDistrictId] = useState(profile?.preferred_district_id || "");
  const [preferredEmail, setPreferredEmail] = useState(profile?.preferred_email || user?.email || "");
  const [telegramChatId, setTelegramChatId] = useState(profile?.telegram_chat_id || "");
  const [channels, setChannels] = useState(profile?.notification_channels || ["email"]);
  const [role, setRole] = useState(profile?.role || "citizen");

  const [loading, setLoading] = useState(!profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;

    Promise.all([
      apiRequest("/api/districts/risk"),
      apiRequest("/api/auth/me", { token }),
    ])
      .then(([distData, meData]) => {
        setDistricts(distData.districts || []);
        if (meData) {
          setDisplayName(meData.display_name || "");
          setRole(meData.role || "citizen");
          const loadedAvatar = meData.avatar_id || "avatar-shield";
          setAvatarId(loadedAvatar);
          try {
            localStorage.setItem("denguesense_user_avatar", loadedAvatar);
          } catch {}
          setPreferredDistrictId(meData.preferred_district_id || "");
          setPreferredEmail(meData.preferred_email || user?.email || "");
          setTelegramChatId(meData.telegram_chat_id || "");
          setChannels(meData.notification_channels || ["email"]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  const toggleChannel = (ch) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSelectAvatar = (newAvatarId) => {
    setAvatarId(newAvatarId);
    try {
      localStorage.setItem("denguesense_user_avatar", newAvatarId);
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await apiRequest("/api/auth/profile", {
        method: "PUT",
        token,
        body: {
          display_name: displayName.trim(),
          avatar_id: avatarId,
          preferred_district_id: preferredDistrictId || null,
          preferred_email: preferredEmail.trim(),
          telegram_chat_id: telegramChatId.trim(),
          notification_channels: channels,
        },
      });
      try {
        localStorage.setItem("denguesense_user_avatar", avatarId);
      } catch {}
      if (refreshProfile) {
        await refreshProfile();
      }
      setSuccess(
        lang === "bn"
          ? "প্রোফাইল এবং টেলিগ্রাম সতর্কতা সফলভাবে হালনাগাদ হয়েছে!"
          : "Profile and notification channels saved successfully!"
      );
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const ActiveAvatarIcon =
    PREDEFINED_AVATARS.find((a) => a.id === avatarId)?.icon || Shield;

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 16px" }}>
        <div className="card skeleton-shimmer" style={{ height: 260 }} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{lang === "bn" ? "ব্যবহারকারী প্রোফাইল ড্যাশবোর্ড" : "USER PROFILE DASHBOARD"}</h1>
          <p className="subtitle">
            {lang === "bn"
              ? "আপনার অবতার, যোগাযোগের বিবরণ এবং রিয়েল-টাইম টেলিগ্রাম বট নোটিফিকেশন চ্যানেল পরিচালনা করুন।"
              : "Manage your citizen avatar, verified contact details, and direct Telegram bot notification linkage."}
          </p>
        </div>
        <div className="freshness-pill">
          <Shield size={14} color="#14080e" />
          <span>ROLE: {role.toUpperCase()}</span>
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}
      {success && <div className="alert-banner alert-success">{success}</div>}

      <div className="two-col-grid" style={{ marginTop: 20 }}>
        {/* Left Column: Avatar & Account Identity */}
        <div className="form-stack">
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} />
              {lang === "bn" ? "অ্যাকাউন্ট পরিচয় ও অবতার" : "ACCOUNT IDENTITY & AVATAR"}
            </h2>

            {/* Current Selected Avatar Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px",
                background: "#fafafb",
                border: "1px solid #14080e",
                margin: "14px 0",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "#14080e",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "2px 2px 0px #49475b",
                }}
              >
                <ActiveAvatarIcon size={28} />
              </div>
              <div>
                <strong style={{ fontSize: "1.05rem", display: "block" }}>
                  {displayName || "Anonymous Citizen"}
                </strong>
                <span className="meta-label mono" style={{ fontSize: 11 }}>
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Avatar Selector Grid */}
            <label className="meta-label" style={{ display: "block", marginBottom: 8 }}>
              {lang === "bn" ? "একটি পূর্বনির্ধারিত অবতার চয়ন করুন" : "SELECT A PREDEFINED AVATAR"}
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {PREDEFINED_AVATARS.map((av) => {
                const IconComp = av.icon;
                const isSelected = avatarId === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAvatar(av.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "12px 8px",
                      background: isSelected ? "#14080e" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#14080e",
                      border: "1px solid #14080e",
                      boxShadow: isSelected ? "3px 3px 0px #49475b" : "1px 1px 0px #14080e",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <IconComp size={20} />
                    <span style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="form-group">
              <label htmlFor="prof-name">{lang === "bn" ? "প্রদর্শন নাম" : "Display Name"}</label>
              <input
                id="prof-name"
                type="text"
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maruf Hossain"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-dist">
                {lang === "bn" ? "পছন্দের প্রাথমিক জেলা" : "Preferred Primary District"}
              </label>
              <select
                id="prof-dist"
                className="input-field"
                value={preferredDistrictId}
                onChange={(e) => setPreferredDistrictId(e.target.value)}
              >
                <option value="">{lang === "bn" ? "— একটি জেলা নির্বাচন করুন —" : "— Select a District —"}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {lang === "bn" ? d.name_bn || d.name_en : d.name_en} ({d.division})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Verified Telegram Bot & Email Notifications */}
        <div className="form-stack">
          <form onSubmit={handleSave} className="card form-stack">
            <h2 style={{ marginTop: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={16} />
              {lang === "bn" ? "সতর্কতা ও টেলিগ্রাম সংযোগ" : "ALERTS & TELEGRAM LINKAGE"}
            </h2>

            <p style={{ margin: "0 0 12px", fontSize: "0.84rem", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {lang === "bn"
                ? "এখানে আপনার ইমেইল এবং টেলিগ্রাম আইডি যুক্ত করুন যাতে আমাদের অটোমেটেড অ্যালার্ট ইঞ্জিন সরাসরি জরুরি বার্তা পাঠাতে পারে।"
                : "Configure your alert dispatch destinations. When high-risk advisories are triggered, notifications are delivered directly to your verified inbox and Telegram."}
            </p>

            <div className="form-group">
              <label>{lang === "bn" ? "বিজ্ঞপ্তি চ্যানেল" : "Notification Channels"}</label>
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={channels.includes("email")}
                    onChange={() => toggleChannel("email")}
                  />
                  <span>{lang === "bn" ? "ইমেইল বার্তা" : "Email Dispatch"}</span>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={channels.includes("telegram")}
                    onChange={() => toggleChannel("telegram")}
                  />
                  <span>{lang === "bn" ? "টেলিগ্রাম বট" : "Telegram Bot"}</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-email" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={13} />
                {lang === "bn" ? "পছন্দের সতর্কবার্তা ইমেইল" : "Preferred Alert Email Address"}
              </label>
              <input
                id="prof-email"
                type="email"
                className="input-field"
                value={preferredEmail}
                onChange={(e) => setPreferredEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-tg" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Send size={13} />
                {lang === "bn" ? "টেলিগ্রাম চ্যাট আইডি / ব্যবহারকারী আইডি" : "Telegram Chat ID / User ID"}
              </label>
              <input
                id="prof-tg"
                type="text"
                className="input-field"
                value={telegramChatId}
                onChange={(e) => {
                  const cleaned = extractTelegramId(e.target.value);
                  setTelegramChatId(cleaned || e.target.value);
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  const cleaned = extractTelegramId(pasted);
                  if (cleaned) {
                    e.preventDefault();
                    setTelegramChatId(cleaned);
                  }
                }}
                placeholder="e.g. 6396225829"
              />
              <small style={{ display: "block", color: "var(--ink-secondary)", fontSize: "0.8rem", marginTop: 4 }}>
                {lang === "bn"
                  ? "টেলিগ্রাম বট @denguesense_alert_bot চালু করুন এবং আপনার চ্যাট আইডি দিন (আইডি পেতে নিচের @userinfobot অটোমেশন ব্যবহার করুন)।"
                  : "Start our bot @denguesense_alert_bot on Telegram and paste your numerical ID (or use the @userinfobot helper below)."}
              </small>
            </div>

            {/* Telegram ID Automation Helper (@userinfobot) */}
            <TelegramHelper
              telegramChatId={telegramChatId}
              onSelectId={setTelegramChatId}
              token={token}
            />

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              <Save size={14} />
              <span>{saving ? "SAVING..." : (lang === "bn" ? "প্রোফাইল সংরক্ষণ করুন" : "SAVE PROFILE & ALERTS")}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
