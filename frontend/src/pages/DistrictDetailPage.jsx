import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import RiskBadge from "../components/RiskBadge";

export default function DistrictDetailPage() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const [days, setDays] = useState(30);
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/api/districts/${id}`).then(setDetail).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    apiRequest(`/api/districts/${id}/history?days=${days}`)
      .then(setHistory)
      .catch((e) => setError(e.message));
  }, [id, days]);

  if (error) {
    return (
      <div className="container">
        <div className="alert-banner alert-error">{error}</div>
      </div>
    );
  }

  const d = detail?.district;
  const rk = detail?.latest_risk;
  const weather = history?.weather_history || [];
  const aq = history?.air_quality_history || [];

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={15} /> {t.detail.back}
        </Link>
      </div>

      {d && (
        <div className="page-header">
          <div>
            <h1>
              {lang === "bn" ? d.name_bn || d.name_en : d.name_en}{" "}
              {lang === "en" && d.name_bn && (
                <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>({d.name_bn})</span>
              )}
            </h1>
            <p className="subtitle">
              {d.division} {t.drawer.division} · <span className="mono">{d.district_code}</span> ·{" "}
              <span className="mono tabular-nums">{d.centroid_lat}, {d.centroid_lon}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <RiskBadge level={rk?.risk_level || "NO DATA"} score={rk?.environmental_score} />
            <select
              aria-label="Date range"
              className="input-field"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ width: 150 }}
            >
              <option value={30}>{t.detail.last30}</option>
              <option value={90}>{t.detail.last90}</option>
            </select>
          </div>
        </div>
      )}

      <div className="two-col-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t.detail.tempChart}</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={weather}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14, 165, 233, 0.12)" />
                <XAxis dataKey="recorded_date" tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" unit="°" />
                <Tooltip contentStyle={{ background: "#ffffff", borderColor: "#000000", borderRadius: 0, color: "#000000", boxShadow: "2px 2px 0px #000000", fontFamily: "monospace" }} />
                <Line type="monotone" dataKey="temp_mean" name="Mean °C" stroke="#000000" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="temp_max" name="Max °C" stroke="#52525b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t.detail.rainChart}</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={weather}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="recorded_date" tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" unit="mm" />
                <Tooltip contentStyle={{ background: "#ffffff", borderColor: "#000000", borderRadius: 0, color: "#000000", boxShadow: "2px 2px 0px #000000", fontFamily: "monospace" }} />
                <Bar dataKey="rainfall_mm" name="Rainfall (mm)" fill="#000000" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t.detail.humidityChart}</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={weather}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="recorded_date" tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" minTickGap={24} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" unit="%" />
                <Tooltip contentStyle={{ background: "#ffffff", borderColor: "#000000", borderRadius: 0, color: "#000000", boxShadow: "2px 2px 0px #000000", fontFamily: "monospace" }} />
                <Line type="monotone" dataKey="humidity_mean" name="Humidity %" stroke="#000000" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t.detail.aqChart}</h3>
          {aq.length === 0 ? (
            <p className="muted-empty">{t.detail.noAq}</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={aq}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="recorded_date" tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: "#000000" }} stroke="#000000" />
                  <Tooltip contentStyle={{ background: "#ffffff", borderColor: "#000000", borderRadius: 0, color: "#000000", boxShadow: "2px 2px 0px #000000", fontFamily: "monospace" }} />
                  <Line type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#000000" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
