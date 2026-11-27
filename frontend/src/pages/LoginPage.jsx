import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff } from "lucide-react";
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
  const [showPw, setShowPw] = useState(false);
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
      setError(err.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth02-stage">
      <section className="auth02-wrap" aria-labelledby="auth02-title">
        <div className="auth02-card">
          <span className="auth02-mark" aria-hidden="true">
            <Activity size={22} color="#ffffff" />
          </span>

          <h1 className="auth02-title" id="auth02-title">
            {t.auth.loginTitle}
          </h1>
          <p className="auth02-sub">{t.auth.loginSub}</p>

          {error && (
            <div className="alert-banner alert-error" style={{ textAlign: "left" }}>
              {error}
            </div>
          )}

          <form className="auth02-form" onSubmit={handleSubmit}>
            <div className="auth02-field">
              <label className="auth02-label" htmlFor="login-email">
                {t.auth.email}
              </label>
              <input
                className="auth02-input"
                id="login-email"
                type="email"
                autoComplete="username"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth02-field">
              <label className="auth02-label" htmlFor="login-password">
                {t.auth.password}
              </label>
              <div className="auth02-pw">
                <input
                  className="auth02-input"
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
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
              {submitting ? t.auth.signingIn : t.auth.signInBtn}
            </button>
          </form>
        </div>

        <p className="auth02-foot">
          {t.auth.noAccount}{" "}
          <Link className="auth02-link" to="/register">
            {t.auth.registerLink}
          </Link>
        </p>
      </section>
    </div>
  );
}
