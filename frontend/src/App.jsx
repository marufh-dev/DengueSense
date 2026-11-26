import { useEffect, useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking...");

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status || "unknown"))
      .catch(() => setApiStatus("offline"));
  }, []);

  return (
    <div>
      <header className="topbar">
        <span className="brand">
          <Activity size={18} color="var(--accent-primary)" />
          DengueSense
        </span>
      </header>
      <main className="container">
        <div className="card">
          <h1 style={{ marginTop: 0, fontSize: "1.5rem", fontWeight: 600 }}>
            Bangladesh 64-District Dengue Early Warning Platform
          </h1>
          <p style={{ color: "var(--ink-secondary)" }}>
            Foundation shell initialized following <code>DESIGN.md</code>.
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px" }}>
            <span className="badge badge-low">
              <ShieldCheck size={14} style={{ marginRight: 6 }} />
              API Status: <span className="mono" style={{ marginLeft: 4 }}>{apiStatus}</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
