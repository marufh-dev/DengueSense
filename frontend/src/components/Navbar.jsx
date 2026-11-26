import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Activity, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/map", label: "Risk Map" },
  { to: "/methodology", label: "Data & Methodology" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <Activity size={18} color="var(--accent-primary)" />
          <span>DengueSense</span>
          <span className="brand-tag">BD-64</span>
        </NavLink>

        <nav className="nav-links" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
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
          {NAV_ITEMS.map((item) => (
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
        </nav>
      )}
    </header>
  );
}
