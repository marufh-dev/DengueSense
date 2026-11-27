import { Link } from "react-router-dom";
import { ArrowLeft, Compass, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function NotFoundPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="error-stage">
      <div className="error-card">
        {/* Animated Dengue Surveillance Radar */}
        <div className="error-graphic-wrap" aria-hidden="true">
          <svg
            className="radar-svg"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f6b60" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#0f6b60" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Concentric Coordinate Rings */}
            <circle cx="85" cy="85" r="76" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="85" cy="85" r="52" stroke="var(--border-hairline)" strokeWidth="1" />
            <circle cx="85" cy="85" r="26" stroke="var(--border-hairline)" strokeWidth="1" />
            <circle cx="85" cy="85" r="3" fill="var(--accent-primary)" />

            {/* Coordinate Crosshairs */}
            <line x1="9" y1="85" x2="161" y2="85" stroke="var(--border-hairline)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <line x1="85" y1="9" x2="85" y2="161" stroke="var(--border-hairline)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

            {/* Rotating Radar Sweep Beam */}
            <g className="radar-sweep-beam">
              <path
                d="M 85 85 L 85 9 A 76 76 0 0 1 161 85 Z"
                fill="url(#sweepGrad)"
              />
            </g>

            {/* Radar Signal Wave & Blip */}
            <circle className="radar-wave" cx="115" cy="55" r="3" stroke="var(--accent-primary)" strokeWidth="1.5" fill="none" />
            <circle className="radar-beacon" cx="115" cy="55" r="3.5" fill="var(--accent-primary)" />
          </svg>
        </div>

        {/* Status Pill Tag */}
        <div className="error-badge-pill mono">
          {t.errors?.tag404 || "404"}
        </div>

        {/* Heading */}
        <h1 className="error-headline">
          {t.errors?.notFoundTitle || "Nothing here."}
        </h1>

        {/* Description */}
        <p className="error-paragraph">
          {t.errors?.notFoundDesc || "The link’s broken, or the page has moved on."}
        </p>

        {/* Action Buttons */}
        <div className="error-cta-group">
          <Link to={user ? "/" : "/login"} className="btn btn-primary">
            <Compass size={15} />
            <span>{user ? (t.errors?.backDashboard || "Back to Dashboard") : (t.errors?.signIn || "Sign In")}</span>
          </Link>
          <Link to="/map" className="btn btn-secondary">
            <MapPin size={15} />
            <span>{t.errors?.viewMap || "Explore Risk Map"}</span>
          </Link>
        </div>

        {/* Minimal Underline Link (devaryan reference style) */}
        <Link to="/" className="error-back-link">
          <ArrowLeft size={14} />
          <span>{t.errors?.backHome || "Back home"}</span>
        </Link>
      </div>
    </div>
  );
}
