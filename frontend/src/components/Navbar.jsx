import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Activity, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/map", label: "Risk Map" },
    { to: "/reports", label: "Community" },
    { to: "/submit-report", label: "Submit Report" },
    { to: "/methodology", label: "Methodology" },
    { to: "/about", label: "About" },
  ];

  if (user && (role === "moderator" || role === "admin")) {
    navItems.push({ to: "/moderation", label: "Moderation" });
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <Activity size={18} color="var(--accent-primary)" />
          <span>DengueSense</span>
          <span className="brand-tag">BD-64</span>
        </NavLink>

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

        <div className="nav-auth">
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="meta-label mono">{role}</span>
              <button type="button" className="btn btn-secondary" onClick={signOut}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <NavLink to="/login" className="btn btn-secondary">Sign In</NavLink>
              <NavLink to="/register" className="btn btn-primary">Register</NavLink>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost mobile-menu-btn"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
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
          {user ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { signOut(); setOpen(false); }}
            >
              Sign Out ({role})
            </button>
          ) : (
            <NavLink to="/login" className="btn btn-primary" onClick={() => setOpen(false)}>
              Sign In
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
