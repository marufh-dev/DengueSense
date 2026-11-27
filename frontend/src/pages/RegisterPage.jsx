import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../api/client";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      let registered = false;
      // 1. Try robust backend registration (auto-confirms + sends welcome email via Resend)
      try {
        const res = await apiRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: email.trim(),
            password,
            display_name: displayName.trim(),
          },
        });
        if (res && res.status === "success") {
          registered = true;
        }
      } catch (backendErr) {
        if (backendErr.message && backendErr.message.toLowerCase().includes("already exists")) {
          throw backendErr;
        }
        // Fallback to client SDK if backend route is unavailable
        const { error: authErr } = await signUp(email.trim(), password, displayName.trim());
        if (authErr) throw authErr;
        registered = true;
      }

      if (registered) {
        // Automatically authenticate user so they enter dashboard without confirmation block
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (!loginErr) {
          navigate("/", { replace: true });
          return;
        }
        setSuccess(t.auth.regSuccess);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth02-stage">
      <section className="auth02-wrap" aria-labelledby="auth02-reg-title">
        <div className="auth02-card">
          <span className="auth02-mark" aria-hidden="true">
            <Activity size={22} color="#ffffff" />
          </span>

          <h1 className="auth02-title" id="auth02-reg-title">
            {t.auth.regTitle}
          </h1>
          <p className="auth02-sub">{t.auth.regSub}</p>

          {error && <div className="alert-banner alert-error" style={{ textAlign: "left" }}>{error}</div>}
          {success && <div className="alert-banner alert-success" style={{ textAlign: "left" }}>{success}</div>}

          <form className="auth02-form" onSubmit={handleSubmit}>
            <div className="auth02-field">
              <label className="auth02-label" htmlFor="reg-name">
                {t.auth.displayName}
              </label>
              <input
                className="auth02-input"
                id="reg-name"
                type="text"
                required
                minLength={2}
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="auth02-field">
              <label className="auth02-label" htmlFor="reg-email">
                {t.auth.email}
              </label>
              <input
                className="auth02-input"
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth02-field">
              <label className="auth02-label" htmlFor="reg-password">
                {t.auth.passMin}
              </label>
              <div className="auth02-pw">
                <input
                  className="auth02-input"
                  id="reg-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth02-eye"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="auth02-submit" type="submit" disabled={submitting}>
              {submitting ? t.auth.creating : t.auth.regBtn}
            </button>
          </form>
        </div>

        <p className="auth02-foot">
          {t.auth.haveAccount}{" "}
          <Link className="auth02-link" to="/login">
            {t.auth.signInLink}
          </Link>
        </p>
      </section>
    </div>
  );
}
