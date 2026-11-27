import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Award,
  Compass,
  Languages,
  LogOut,
  Menu,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const AVATAR_MAP = {
  "avatar-shield": Shield,
  "avatar-user": User,
  "avatar-compass": Compass,
  "avatar-activity": Activity,
  "avatar-zap": Zap,
  "avatar-award": Award,
};

export default function Navbar() {
  const { user, role, profile, signOut } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const CurrentAvatar =
    AVATAR_MAP[profile?.avatar_id] ||
    AVATAR_MAP[localStorage.getItem("denguesense_user_avatar")] ||
    Shield;

  const navItems = [
    { to: "/", label: t.nav.dashboard },
    { to: "/map", label: t.nav.map },
    { to: "/reports", label: t.nav.reports },
    { to: "/submit-report", label: t.nav.submit },
    { to: "/triage", label: t.nav.triage },
    { to: "/prevention", label: t.nav.prevention },
    { to: "/my-alerts", label: t.nav.alerts },
    { to: "/profile", label: t.nav.profile },
    { to: "/methodology", label: t.nav.methodology },
  ];

  if (user && (role === "moderator" || role === "admin")) {
    navItems.push({ to: "/moderation", label: t.nav.moderation });
  }

  if (user && role === "admin") {
    navItems.push({ to: "/admin", label: t.nav.admin });
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to={user ? "/" : "/login"} className="brand" onClick={() => setOpen(false)}>
          <Activity size={18} color="var(--accent-primary)" />
          <span>{t.brand}</span>
        </NavLink>

        {user && (
          <nav className="nav-links" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="nav-actions">
          <button
            type="button"
            className="btn btn-secondary nav-lang-btn"
            onClick={toggleLang}
            aria-label="Toggle language"
            title="Switch between English and বাংলা"
          >
            <Languages size={14} />
            <span>{lang === "en" ? "বাংলা" : "EN"}</span>
          </button>

          {user && (
            <div className="nav-user-actions">
              <NavLink
                to="/profile"
                className="meta-label mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  textDecoration: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  background: "#ffffff",
                  border: "1px solid #14080e",
                  color: "#14080e",
                  boxShadow: "1px 1px 0px #14080e",
                }}
                title="Open Profile Dashboard"
              >
                <CurrentAvatar size={13} />
                <span>{role.toUpperCase()}</span>
              </NavLink>
              <button type="button" className="btn btn-secondary" onClick={signOut}>
                <LogOut size={14} /> {t.nav.signOut}
              </button>
            </div>
          )}

          {user && (
            <button
              type="button"
              className="btn btn-ghost mobile-menu-btn"
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {user && open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="btn btn-secondary" onClick={toggleLang}>
            <Languages size={14} /> {lang === "en" ? "বাংলায় দেখুন" : "Switch to English"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { signOut(); setOpen(false); }}
          >
            {t.nav.signOut} ({role})
          </button>
        </nav>
      )}
    </header>
  );
}
