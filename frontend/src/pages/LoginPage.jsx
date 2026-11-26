import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Bell, MapPin, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: authErr } = await signIn(email.trim(), password);
      if (authErr) throw authErr;
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container welcome-shell">
      <div className="welcome-grid">
        <section className="welcome-hero">
          <div className="welcome-pill">
            <Activity size={14} color="var(--accent-primary)" />
            <span>{t.auth.welcomeBadge}</span>
          </div>
          <h1>{t.auth.welcomeTitle}</h1>
          <p className="welcome-desc">{t.auth.welcomeDesc}</p>
          <ul className="welcome-features">
            <li><ShieldCheck size={16} color="var(--accent-primary)" /> <span>{t.auth.welcomeF1}</span></li>
            <li><MapPin size={16} color="var(--accent-primary)" /> <span>{t.auth.welcomeF2}</span></li>
            <li><Bell size={16} color="var(--accent-primary)" /> <span>{t.auth.welcomeF3}</span></li>
          </ul>
        </section>

        <section className="card welcome-card">
          <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>{t.auth.loginTitle}</h2>
          <p className="subtitle" style={{ marginBottom: 16 }}>{t.auth.loginSub}</p>

          {error && <div className="alert-banner alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label htmlFor="login-email">{t.auth.email}</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">{t.auth.password}</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t.auth.signingIn : t.auth.signInBtn}
            </button>
          </form>

          <p style={{ marginTop: 16, marginBottom: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            {t.auth.noAccount} <Link to="/register">{t.auth.registerLink}</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
