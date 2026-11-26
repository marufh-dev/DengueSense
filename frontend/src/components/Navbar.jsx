import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Activity, Languages, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/", label: t.nav.dashboard },
    { to: "/map", label: t.nav.map },
    { to: "/reports", label: t.nav.reports },
    { to: "/submit-report", label: t.nav.submit },
    { to: "/my-alerts", label: t.nav.alerts },
    { to: "/methodology", label: t.nav.methodology },
    { to: "/about", label: t.nav.about },
  ];

  if (user && (role === "moderator" || role === "admin")) {
    navItems.push({ to: "/moderation", label: t.nav.moderation });
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

        <div className={user ? "nav-auth" : "nav-auth-public"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleLang}
            aria-label="Toggle language"
            title="Switch between English and বাংলা"
          >
            <Languages size={14} />
            <span>{lang === "en" ? "বাংলা" : "EN"}</span>
          </button>

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="meta-label mono">{role}</span>
              <button type="button" className="btn btn-secondary" onClick={signOut}>
                <LogOut size={14} /> {t.nav.signOut}
              </button>
            </div>
          )}
        </div>

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
