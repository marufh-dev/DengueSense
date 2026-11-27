import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function ErrorPage({ error, onRetry }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  const handleReload = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="error-stage">
      <div className="error-card">
        {/* Animated Diagnostic Alert Graphic */}
        <div className="error-graphic-wrap" aria-hidden="true">
          <svg
            className="radar-svg"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Concentric rings */}
            <circle cx="85" cy="85" r="76" stroke="#b91c1c" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <circle cx="85" cy="85" r="54" stroke="#b91c1c" strokeWidth="1" opacity="0.2" />
            <circle cx="85" cy="85" r="32" stroke="#b91c1c" strokeWidth="1.5" opacity="0.35" />

            {/* Central Warning Badge */}
            <rect x="65" y="65" width="40" height="40" rx="10" fill="#fef2f2" stroke="#b91c1c" strokeWidth="1.5" />
            <path
              d="M 85 75 L 85 87 M 85 93 L 85.01 93"
              stroke="#b91c1c"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Status Pill Tag */}
        <div className="error-badge-pill danger mono">
          {t?.errors?.tag500 || "500"}
        </div>

        {/* Heading */}
        <h1 className="error-headline">
          {t?.errors?.serverErrorTitle || "Something went wrong."}
        </h1>

        {/* Description */}
        <p className="error-paragraph">
          {t?.errors?.serverErrorDesc ||
            "Our environmental surveillance engine encountered an unexpected disruption. Technical logs have been recorded."}
        </p>

        {/* Action Buttons */}
        <div className="error-cta-group">
          <button type="button" onClick={handleReload} className="btn btn-primary">
            <RefreshCw size={15} />
            <span>{t?.errors?.retry || "Reload Page"}</span>
          </button>
          <Link to="/" className="btn btn-secondary">
            <span>{t?.errors?.backDashboard || "Back to Dashboard"}</span>
          </Link>
        </div>

        {/* Optional Technical Details Toggle */}
        {error && (
          <div className="error-diagnostics-box">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "4px 8px", fontSize: 12, width: "100%", justifyContent: "space-between" }}
              onClick={() => setShowDetails((v) => !v)}
            >
              <span>{showDetails ? (t?.errors?.hideDetails || "Hide Details") : (t?.errors?.viewDetails || "View Details")}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showDetails && (
              <pre className="error-diagnostics-pre">
                {error?.stack || error?.message || String(error)}
              </pre>
            )}
          </div>
        )}

        {/* Minimal Underline Link */}
        <Link to="/" className="error-back-link">
          <ArrowLeft size={14} />
          <span>{t?.errors?.backHome || "Back home"}</span>
        </Link>
      </div>
    </div>
  );
}
