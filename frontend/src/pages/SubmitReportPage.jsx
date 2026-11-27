import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Compass, Upload } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function PinPicker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function SubmitReportPage() {
  const { token } = useAuth();
  const { lang, t } = useLanguage();
  const [districts, setDistricts] = useState([]);
  const [districtId, setDistrictId] = useState("");
  const [reportType, setReportType] = useState("WATERLOGGING");
  const [congestionLevel, setCongestionLevel] = useState("NONE");
  const [isRainEvent, setIsRainEvent] = useState(false);
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState([23.8103, 90.4125]);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest("/api/districts")
      .then((res) => {
        const list = res.districts || [];
        setDistricts(list);
        const dhaka = list.find((d) => d.name_en === "Dhaka") || list[0];
        if (dhaka) {
          setDistrictId(dhaka.id);
          setPin([dhaka.centroid_lat, dhaka.centroid_lon]);
        }
      })
      .catch(() => {});
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPin([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Unable to retrieve your location. Please click the map to place a pin.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("district_id", districtId);
      formData.append("report_type", reportType);
      formData.append("congestion_level", congestionLevel);
      formData.append("is_rain_event", isRainEvent ? "true" : "false");
      formData.append("description", description.trim());
      formData.append("latitude", String(pin[0]));
      formData.append("longitude", String(pin[1]));
      if (photo) {
        if (photo.size > 5 * 1024 * 1024) {
          throw new Error("Photo must be 5 MB or smaller.");
        }
        formData.append("photo", photo);
      }
      await apiRequest("/api/reports", {
        method: "POST",
        body: formData,
        token,
        isFormData: true,
      });
      setSuccess(t.submit.successMsg);
      setDescription("");
      setPhoto(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>{t.submit.title}</h1>
      <p className="subtitle">{t.submit.subtitle}</p>

      {error && <div className="alert-banner alert-error" style={{ marginTop: 12 }}>{error}</div>}
      {success && <div className="alert-banner alert-success" style={{ marginTop: 12 }}>{success}</div>}

      <div className="split-layout" style={{ marginTop: 16 }}>
        <form onSubmit={handleSubmit} className="card form-stack">
          <div className="form-group">
            <label htmlFor="rep-category">{t.submit.category}</label>
            <select
              id="rep-category"
              className="input-field"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="WATERLOGGING">{t.submit.types.WATERLOGGING}</option>
              <option value="STAGNANT_WATER">{t.submit.types.STAGNANT_WATER}</option>
              <option value="MOSQUITO_ACTIVITY">{t.submit.types.MOSQUITO_ACTIVITY}</option>
              <option value="SUSPECTED_DENGUE_REPORT">{t.submit.types.SUSPECTED_DENGUE_REPORT}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rep-district">{t.submit.district}</label>
            <select
              id="rep-district"
              className="input-field"
              value={districtId}
              onChange={(e) => {
                const id = e.target.value;
                setDistrictId(id);
                const d = districts.find((x) => x.id === id);
                if (d) setPin([d.centroid_lat, d.centroid_lon]);
              }}
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === "bn" ? d.name_bn || d.name_en : d.name_en} ({d.division})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rep-congestion">{t.submit.congestionLabel}</label>
            <select
              id="rep-congestion"
              className="input-field"
              value={congestionLevel}
              onChange={(e) => setCongestionLevel(e.target.value)}
            >
              <option value="NONE">{t.submit.congestionNone}</option>
              <option value="MODERATE">{t.submit.congestionModerate}</option>
              <option value="SEVERE_STANDSTILL">{t.submit.congestionSevere}</option>
            </select>
            <small style={{ display: "block", color: "var(--ink-secondary)", fontSize: "0.82rem", marginTop: 4, lineHeight: 1.4 }}>
              {t.submit.congestionHint}
            </small>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.88rem" }}>
              <input
                type="checkbox"
                checked={isRainEvent}
                onChange={(e) => setIsRainEvent(e.target.checked)}
              />
              <span>🌧️ {t.submit.rainObservedLabel}</span>
            </label>
          </div>

          {(congestionLevel === "SEVERE_STANDSTILL" || (congestionLevel === "MODERATE" && isRainEvent) || (reportType === "WATERLOGGING" && isRainEvent)) && (
            <div style={{
              background: "rgba(234, 88, 12, 0.1)",
              border: "1px solid rgba(234, 88, 12, 0.3)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: "0.84rem",
              color: "var(--color-critical, #c2410c)",
              lineHeight: 1.4,
              marginBottom: 8,
            }}>
              {t.submit.highPriorityElevationNotice}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="rep-desc">{t.submit.description}</label>
            <textarea
              id="rep-desc"
              className="input-field"
              style={{ height: 96, padding: 10, resize: "vertical" }}
              required
              minLength={10}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.submit.descPlaceholder}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rep-photo">{t.submit.photoLabel}</label>
            <label className="btn btn-secondary" style={{ width: "fit-content" }}>
              <Upload size={14} />
              <span>{photo ? photo.name : t.submit.chooseImage}</span>
              <input
                id="rep-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="meta-label">
            {t.submit.selectedPin}:{" "}
            <span className="mono tabular-nums">{pin[0].toFixed(4)}, {pin[1].toFixed(4)}</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t.submit.submitting : t.submit.submitBtn}
          </button>
        </form>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong>{t.submit.mapTitle}</strong>
            <button type="button" className="btn btn-secondary" onClick={handleUseLocation}>
              <Compass size={14} /> {t.submit.useLocation}
            </button>
          </div>
          <div className="map-wrapper" style={{ height: 380 }}>
            <MapContainer center={pin} zoom={11} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PinPicker position={pin} onChange={setPin} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
