import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, Mail } from "lucide-react";
import { apiRequest } from "../api/client";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      if (magicMode) {
        try {
          const res = await apiRequest("/api/auth/magic-link", {
            method: "POST",
            body: { email: email.trim() },
          });
          setInfo(
            res.message ||
              (lang === "bn"
                ? "আপনার ইমেইলে একটি সুরক্ষিত সাইন-ইন লিংক পাঠানো হয়েছে (স্প্যাম ফোল্ডারও চেক করুন)।"
                : "We sent a secure sign-in link to your email. Check your inbox and spam folder.")
          );
        } catch (mErr) {
          // Fallback to client SDK if backend route drops
          const { error: otpErr } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { emailRedirectTo: window.location.origin },
          });
          if (otpErr) throw otpErr;
          setInfo(
            lang === "bn"
              ? "আপনার ইমেইলে একটি সাইন-ইন লিংক পাঠানো হয়েছে。"
              : "Check your inbox — we sent you a one-time sign-in link."
          );
        }
      } else {
        const { error: authErr } = await signIn(email.trim(), password);
        if (authErr) throw authErr;
        navigate(from, { replace: true });
      }
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

          {error && <div className="alert-banner alert-error" style={{ textAlign: "left" }}>{error}</div>}
          {info && <div className="alert-banner alert-success" style={{ textAlign: "left" }}>{info}</div>}

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

            {!magicMode && (
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
            )}

            {magicMode && (
              <p className="auth02-hint">
                {lang === "bn"
                  ? "আমরা আপনার ইমেইলে একটি এককালীন সাইন-ইন লিংক পাঠাবো।"
                  : "We'll email you a one-time sign-in link to access DengueSense."}
              </p>
            )}

            <button className="auth02-submit" type="submit" disabled={submitting}>
              {submitting ? t.auth.signingIn : t.auth.signInBtn}
            </button>
          </form>

          <button
            type="button"
            className="auth02-mode"
            onClick={() => {
              setMagicMode((v) => !v);
              setError("");
              setInfo("");
            }}
          >
            <Mail size={15} />
            <span>
              {magicMode
                ? lang === "bn"
                  ? "পাসওয়ার্ড দিয়ে সাইন ইন করুন"
                  : "Sign in with password instead"
                : lang === "bn"
                ? "ইমেইলে সাইন-ইন লিংক পাঠান"
                : "Email me a sign-in link instead"}
            </span>
          </button>
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
