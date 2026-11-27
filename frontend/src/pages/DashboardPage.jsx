import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Compass, MapPin, Shield, X } from "lucide-react";
import { apiRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import RiskBadge from "../components/RiskBadge";

// Lazy-load heavy map and district drawer modules
const BangladeshMap = lazy(() => import("../components/BangladeshMap"));
const DistrictDrawer = lazy(() => import("../components/DistrictDrawer"));

export default function DashboardPage() {
  const { lang, t } = useLanguage();
  const [riskData, setRiskData] = useState(null);
  const [dataHealth, setDataHealth] = useState(null);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [dismissTour, setDismissTour] = useState(() => {
    return localStorage.getItem("denguesense_tour_dismissed") === "true";
  });

  // Device Geolocation State
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("denguesense_user_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only accept if strictly inside Bangladesh bounds
        if (
          parsed &&
          parsed.lat >= 20.5 &&
          parsed.lat <= 26.8 &&
          parsed.lon >= 88.0 &&
          parsed.lon <= 92.8
        ) {
          return parsed;
        }
        localStorage.removeItem("denguesense_user_location");
      }
      return null;
    } catch {
      return null;
    }
  });
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle"); // 'idle' | 'detecting' | 'detected' | 'denied' | 'unsupported'

  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findClosestDistrict = (userLat, userLon, list) => {
    let closest = null;
    let minDistance = Infinity;
    for (const d of list) {
      if (d.centroid_lat && d.centroid_lon) {
        const dist = calculateDistanceKm(userLat, userLon, d.centroid_lat, d.centroid_lon);
        if (dist < minDistance) {
          minDistance = dist;
          closest = d;
        }
      }
    }
    return { district: closest, distanceKm: minDistance };
  };

  const detectDeviceLocation = (districtsList = []) => {
    const list = districtsList.length > 0 ? districtsList : (riskData?.districts || []);
    if (!list.length) return;

    setLocating(true);
    setLocationStatus("detecting");

    const applyDistrict = (lat, lon, src = "gps") => {
      const { district, distanceKm } = findClosestDistrict(lat, lon, list);
      if (district) {
        const locObj = {
          lat,
          lon,
          districtName: district.name_en,
          districtId: district.id,
          distanceKm,
          source: src,
        };
        setUserLocation(locObj);
        setLocationStatus("detected");
        try {
          localStorage.setItem("denguesense_user_location", JSON.stringify(locObj));
        } catch {}
        handleSelectDistrict(district);
        return true;
      }
      return false;
    };

    // IP Geolocation: queries ipwho.is (reliable Bangladesh ISP resolution)
    const tryIpFallback = () => {
      fetch("https://ipwho.is/")
        .then((r) => r.json())
        .then((d) => {
          if (
            d &&
            d.success &&
            d.latitude >= 20.5 &&
            d.latitude <= 26.8 &&
            d.longitude >= 88.0 &&
            d.longitude <= 92.8
          ) {
            applyDistrict(d.latitude, d.longitude, "ip");
          } else {
            fallbackDefault();
          }
        })
        .catch(() => fallbackDefault())
        .finally(() => setLocating(false));
    };

    const fallbackDefault = () => {
      setLocationStatus("fallback");
      setLocating(false);
      // Prefer cached location if inside Bangladesh
      if (userLocation && userLocation.districtId) {
        const match = list.find((d) => d.id === userLocation.districtId);
        if (match) {
          handleSelectDistrict(match);
          return;
        }
      }
      const pirojpur = list.find((d) => d.name_en === "Pirojpur");
      const defaultDist = pirojpur || list.find((d) => d.name_en === "Dhaka") || list[0];
      if (defaultDist) {
        applyDistrict(defaultDist.centroid_lat, defaultDist.centroid_lon, "fallback");
      }
    };

    if (!navigator.geolocation) {
      tryIpFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Strictly verify if position is within Bangladesh geographic territory (lat 20.5 - 26.8, lon 88.0 - 92.8)
        if (latitude >= 20.5 && latitude <= 26.8 && longitude >= 88.0 && longitude <= 92.8) {
          const applied = applyDistrict(latitude, longitude, "gps");
          if (!applied) tryIpFallback();
        } else {
          // Hardware/VPN returned non-Bangladesh coordinates (e.g. Miami/US proxy) -> use IP geocoding
          tryIpFallback();
        }
        setLocating(false);
      },
      (err) => {
        console.info("Browser GPS unavailable or denied:", err.message);
        tryIpFallback();
      },
      { timeout: 6000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const handleManualLocationChange = (distId) => {
    const list = riskData?.districts || [];
    const matched = list.find((d) => d.id === distId);
    if (!matched) return;
    const locObj = {
      lat: matched.centroid_lat,
      lon: matched.centroid_lon,
      districtName: matched.name_en,
      districtId: matched.id,
      distanceKm: 0,
      source: "manual",
    };
    setUserLocation(locObj);
    setLocationStatus("detected");
    try {
      localStorage.setItem("denguesense_user_location", JSON.stringify(locObj));
    } catch {}
    handleSelectDistrict(matched);
  };

  const handleDismissTour = () => {
    setDismissTour(true);
    localStorage.setItem("denguesense_tour_dismissed", "true");
  };

  useEffect(() => {
    Promise.all([
      apiRequest("/api/districts/risk"),
      apiRequest("/api/data-health"),
      apiRequest("/api/reports?limit=10"),
    ])
      .then(([rk, dh, rep]) => {
        setRiskData(rk);
        setDataHealth(dh);
        setReports(rep.reports || []);

        const list = rk.districts || [];
        // Immediately trigger device location resolution
        detectDeviceLocation(list);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSelectDistrict = (district) => {
    setSelected(district);
    setDetailLoading(true);
    apiRequest(`/api/districts/${district.id}`)
      .then((res) => setDetail(res))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const summary = riskData?.summary || {};
  const districts = riskData?.districts || [];
  const withData = districts.filter((d) => d.risk_level !== "NO DATA").length;
  const latestLog = dataHealth?.latest_log;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{t.dashboard.title}</h1>
          <p className="subtitle">{t.dashboard.subtitle}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => detectDeviceLocation()}
            disabled={locating}
            className="btn btn-secondary"
            style={{ height: 32, padding: "0 10px", fontSize: "11px" }}
            title={t.dashboard.detectLocation}
          >
            <MapPin size={13} />
            <span>
              {locating
                ? t.dashboard.locating.toUpperCase()
                : userLocation
                ? userLocation.districtName.toUpperCase()
                : t.dashboard.detectLocation.toUpperCase()}
            </span>
          </button>
          {latestLog && (
            <div className="freshness-pill">
              <CheckCircle2 size={14} color="#000000" />
              <span>
                {t.dashboard.lastIngest}:{" "}
                <span className="mono tabular-nums">
                  {(latestLog.completed_at || latestLog.started_at || "").slice(0, 16).replace("T", " ")}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      {/* GPS Location Status Box */}
      {userLocation && (
        <div
          style={{
            border: "1px solid #14080e",
            background: "#ffffff",
            boxShadow: "2px 2px 0px #14080e",
            padding: "10px 14px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                background: "#14080e",
                boxShadow: "0 0 0 2px #ffffff, 0 0 0 3px #14080e",
              }}
            />
            <div>
              <strong>
                [{userLocation.source === "manual" ? "LOCATION SET" : "LOCATION DETECTED"}]: {userLocation.districtName.toUpperCase()}
              </strong>
              <span style={{ color: "var(--ink-secondary)", marginLeft: 8 }}>
                ({userLocation.lat.toFixed(4)}° N, {userLocation.lon.toFixed(4)}° E) · Auto-selected local telemetry & risk data
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              value={userLocation.districtId || ""}
              onChange={(e) => handleManualLocationChange(e.target.value)}
              className="input-field"
              style={{ height: 26, padding: "0 6px", fontSize: "11px", width: "auto" }}
              title="Change your active district"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === "bn" ? d.name_bn || d.name_en : d.name_en} ({d.division})
                </option>
              ))}
            </select>
            <button
              onClick={() => detectDeviceLocation()}
              disabled={locating}
              className="btn btn-secondary"
              style={{ height: 26, padding: "0 8px", fontSize: "10.5px" }}
            >
              {locating ? "LOCATING..." : t.dashboard.refreshGps.toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {locationStatus === "denied" && (
        <div
          style={{
            border: "1px solid #000000",
            background: "#fafafa",
            padding: "8px 12px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
          }}
        >
          <span>[GPS LOCATION ACCESS DISABLED IN BROWSER] Showing default district. Enable browser location permission to auto-detect your district.</span>
          <button
            onClick={() => detectDeviceLocation()}
            className="btn btn-secondary"
            style={{ height: 24, padding: "0 8px", fontSize: "10px" }}
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {!dismissTour && (
        <div
          style={{
            marginTop: 16,
            marginBottom: 20,
            padding: "12px 18px",
            background: "#ffffff",
            border: "1px solid #000000",
            boxShadow: "2px 2px 0px #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                border: "1px solid #14080e",
                background: "#14080e",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
              }}
            >
              <Compass size={18} />
            </div>
            <div>
              <strong style={{ fontSize: "0.92rem", color: "#000000", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                {t.tour.bannerTitle}
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                {t.tour.bannerSub}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              onClick={() => {
                setTourStep(0);
                setShowTour(true);
              }}
            >
              {t.tour.startTour}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "6px 10px", fontSize: "0.82rem" }}
              onClick={handleDismissTour}
            >
              {t.tour.dismiss}
            </button>
          </div>
        </div>
      )}

      <section className="kpi-grid" aria-label="National summary metrics">
        <div className="card kpi-card">
          <div className="kpi-label"><MapPin size={14} /> {t.dashboard.totalDistricts}</div>
          <div className="kpi-value tabular-nums">{riskData?.total_districts ?? "—"}</div>
          <div className="kpi-sub tabular-nums">{withData} {t.dashboard.withData}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label"><AlertTriangle size={14} /> {t.dashboard.highSuitability}</div>
          <div className="kpi-value tabular-nums">
            {summary.HIGH ?? "—"}
          </div>
          <div className="kpi-sub">EDSI 55.0 – 74.9</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label"><AlertTriangle size={14} /> {t.dashboard.criticalSuitability}</div>
          <div className="kpi-value tabular-nums">
            {summary.CRITICAL ?? "—"}
          </div>
          <div className="kpi-sub">EDSI 75.0 – 100</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label"><Activity size={14} /> {t.dashboard.activeReportsCount}</div>
          <div className="kpi-value tabular-nums">
            {reports.length}
          </div>
          <div className="kpi-sub">{t.dashboard.activeReportsSub}</div>
        </div>
      </section>

      <section className="split-layout" style={{ marginTop: 24 }}>
        <div className="map-col">
          <Suspense
            fallback={
              <div
                className="card skeleton-shimmer"
                style={{ height: "540px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span className="mono" style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                  LOADING INTERACTIVE RISK MAP...
                </span>
              </div>
            }
          >
            <BangladeshMap
              districts={districts}
              reports={reports}
              selectedDistrictId={selected?.id}
              onSelectDistrict={handleSelectDistrict}
              userLocation={userLocation}
              height="540px"
            />
          </Suspense>
        </div>
        <div className="drawer-col">
          <Suspense fallback={<div className="card skeleton-shimmer" style={{ height: "400px" }} />}>
            <DistrictDrawer district={selected} detail={detail} loading={detailLoading} />
          </Suspense>
        </div>
      </section>

      <section className="two-col-grid" style={{ marginTop: 24 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.dashboard.recentReports}</h2>
          {reports.length === 0 ? (
            <p className="muted-empty">{t.dashboard.noReports}</p>
          ) : (
            <ul className="simple-list">
              {reports.map((r) => (
                <li key={r.id} className="simple-list-item">
                  <div>
                    <strong>{r.report_type.replaceAll("_", " ")}</strong> ·{" "}
                    <span>{r.district_name}</span>
                    {r.priority === "HIGH_WATERLOGGING_ALERT" && (
                      <span className="badge badge-high" style={{ marginLeft: 6, fontSize: "0.7rem", padding: "2px 6px", background: "#14080e", color: "#ffffff", border: "1px solid #14080e" }}>
                        <AlertTriangle size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                        {lang === "bn" ? "জরুরি জলাবদ্ধতা" : "High Waterlogging"}
                      </span>
                    )}
                    <div className="meta-label">{r.description}</div>
                  </div>
                  <span className="mono meta-label">{r.created_at.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t.dashboard.topDistricts}</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.dashboard.colDistrict}</th>
                  <th>{t.dashboard.colDivision}</th>
                  <th>{t.dashboard.colEdsi}</th>
                  <th>{t.dashboard.colLevel}</th>
                </tr>
              </thead>
              <tbody>
                {[...districts]
                  .sort((a, b) => (b.environmental_score ?? -1) - (a.environmental_score ?? -1))
                  .slice(0, 8)
                  .map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDistrict(d)}
                      style={{ cursor: "pointer" }}
                    >
                      <td><strong>{lang === "bn" ? d.name_bn || d.name_en : d.name_en}</strong></td>
                      <td>{d.division}</td>
                      <td className="tabular-nums mono">
                        {d.environmental_score !== null ? d.environmental_score.toFixed(1) : "—"}
                      </td>
                      <td><RiskBadge level={d.risk_level} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 60-Second Onboarding Tour Modal */}
      {showTour && (
        <div className="modal-backdrop" onClick={() => setShowTour(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-low" style={{ background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
                {t.tour.stepLabel} {tourStep + 1} / 4
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => setShowTour(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: "center", margin: "20px 0 16px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, color: "#14080e" }}>
                {tourStep === 0 && <MapPin size={42} />}
                {tourStep === 1 && <AlertTriangle size={42} />}
                {tourStep === 2 && <Activity size={42} />}
                {tourStep === 3 && <Shield size={42} />}
              </div>
              <h2 style={{ fontSize: "1.25rem", margin: "0 0 8px" }}>
                {tourStep === 0 && t.tour.step1Title}
                {tourStep === 1 && t.tour.step2Title}
                {tourStep === 2 && t.tour.step3Title}
                {tourStep === 3 && t.tour.step4Title}
              </h2>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
                {tourStep === 0 && t.tour.step1Desc}
                {tourStep === 1 && t.tour.step2Desc}
                {tourStep === 2 && t.tour.step3Desc}
                {tourStep === 3 && t.tour.step4Desc}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={tourStep === 0}
                onClick={() => setTourStep((s) => Math.max(0, s - 1))}
              >
                {t.tour.prev}
              </button>

              {tourStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setTourStep((s) => s + 1)}
                >
                  {t.tour.next} <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTour(false);
                    handleDismissTour();
                  }}
                >
                  {t.tour.finish}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
