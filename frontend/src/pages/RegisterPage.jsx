import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { error: authErr } = await signUp(email.trim(), password, displayName.trim());
      if (authErr) throw authErr;
      setSuccess(t.auth.regSuccess);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>{t.auth.regTitle}</h1>
        <p className="subtitle" style={{ marginBottom: 16 }}>{t.auth.regSub}</p>

        {error && <div className="alert-banner alert-error">{error}</div>}
        {success && <div className="alert-banner alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label htmlFor="reg-name">{t.auth.displayName}</label>
            <input
              id="reg-name"
              type="text"
              className="input-field"
              required
              minLength={2}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">{t.auth.email}</label>
            <input
              id="reg-email"
              type="email"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">{t.auth.passMin}</label>
            <input
              id="reg-password"
              type="password"
              className="input-field"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t.auth.creating : t.auth.regBtn}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-secondary)" }}>
          {t.auth.haveAccount} <Link to="/login">{t.auth.signInLink}</Link>
        </p>
      </div>
    </div>
  );
}
