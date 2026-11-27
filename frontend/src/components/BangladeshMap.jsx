import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useLanguage } from "../context/LanguageContext";

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center[0] && center[1]) {
      map.flyTo(center, zoom || 8, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// 2-Color Palette (#14080e & #49475b) in Day Mode (Bolt.new Aesthetic)
const RISK_FILL = {
  LOW: "#dedde5",        // Soft Light Grey
  MODERATE: "#716f85",   // Mid Slate
  HIGH: "#49475b",       // Slate Charcoal Violet
  CRITICAL: "#14080e",   // Deep Raisin Black
  "NO DATA": "#ffffff",  // Pure White
};

export default function BangladeshMap({
  districts = [],
  reports = [],
  selectedDistrictId,
  onSelectDistrict,
  userLocation = null,
  height = "560px",
}) {
  const { lang, t } = useLanguage();
  const [geojson, setGeojson] = useState(null);

  const legendItems = [
    { label: t.risk.criticalRange, color: RISK_FILL.CRITICAL },
    { label: t.risk.highRange, color: RISK_FILL.HIGH },
    { label: t.risk.moderateRange, color: RISK_FILL.MODERATE },
    { label: t.risk.lowRange, color: RISK_FILL.LOW },
    { label: t.risk.noDataRange, color: RISK_FILL["NO DATA"] },
  ];

  useEffect(() => {
    fetch("/data/bangladesh_districts.geojson")
      .then((r) => r.json())
      .then((data) => setGeojson(data))
      .catch(() => setGeojson(null));
  }, []);

  const byCode = useMemo(() => {
    const map = {};
    for (const d of districts) {
      map[d.district_code] = d;
    }
    return map;
  }, [districts]);

  const styleFeature = (feature) => {
    const code = feature.properties?.district_code;
    const d = byCode[code];
    const level = d?.risk_level || "NO DATA";
    const isSelected = d && d.id === selectedDistrictId;

    return {
      fillColor: RISK_FILL[level] || RISK_FILL["NO DATA"],
      fillOpacity: level === "NO DATA" ? 0.35 : isSelected ? 0.9 : 0.65,
      color: isSelected ? "#000000" : "#27272a",
      weight: isSelected ? 3 : 1.2,
      dashArray: level === "NO DATA" ? "4 3" : undefined,
    };
  };

  const onEachFeature = (feature, layer) => {
    const code = feature.properties?.district_code;
    const d = byCode[code];
    const name =
      lang === "bn"
        ? d?.name_bn || feature.properties?.name_bn || d?.name_en
        : d?.name_en || feature.properties?.name_en;
    const level = d?.risk_level || "NO DATA";
    const levelLabel = t.risk[level] || level;
    const scoreText =
      d?.environmental_score !== null && d?.environmental_score !== undefined
        ? `${Number(d.environmental_score).toFixed(1)} / 100`
        : t.risk["NO DATA"];

    layer.bindTooltip(
      `<strong>${name}</strong><br/>EDSI: ${levelLabel} (${scoreText})`,
      { sticky: true }
    );
    layer.on("click", () => {
      if (d && onSelectDistrict) {
        onSelectDistrict(d);
      }
    });
  };

  return (
    <div className="map-wrapper" style={{ height }}>
      <MapContainer
        center={[23.75, 90.35]}
        zoom={7}
        minZoom={6}
        maxZoom={14}
        style={{ height: "100%", width: "100%", background: "#f8fafc" }}
      >
        {/* Standard OpenStreetMap tiles - Free, reliable, NO API key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && userLocation.lat && userLocation.lon && (
          <MapUpdater center={[userLocation.lat, userLocation.lon]} zoom={9} />
        )}
        {geojson && (
          <GeoJSON
            key={selectedDistrictId || "base"}
            data={geojson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        {/* Device GPS Location Marker */}
        {userLocation && userLocation.lat && userLocation.lon && (
          <>
            <CircleMarker
              center={[userLocation.lat, userLocation.lon]}
              radius={18}
              pathOptions={{
                color: "#000000",
                fillColor: "#000000",
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: "3 3",
              }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lon]}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#000000",
                fillOpacity: 1,
                weight: 2.5,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                  <strong>[DEVICE GPS LOCATION]</strong>
                  <div style={{ marginTop: 4 }}>
                    District: <strong>{userLocation.districtName}</strong>
                  </div>
                  <div style={{ color: "#71717a", fontSize: 11, marginTop: 2 }}>
                    {userLocation.lat.toFixed(4)}° N, {userLocation.lon.toFixed(4)}° E
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}
        {reports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.latitude, r.longitude]}
            radius={r.is_high_waterlogging_alert ? 7 : 5}
            pathOptions={{
              color: r.is_high_waterlogging_alert ? "#0369a1" : "#0284c7",
              fillColor: r.is_high_waterlogging_alert ? "#bae6fd" : "#38bdf8",
              fillOpacity: 0.85,
              weight: r.is_high_waterlogging_alert ? 2.5 : 1.5,
            }}
          >
            <Popup>
              <strong>{r.report_type}</strong>
              {r.is_high_waterlogging_alert && (
                <div style={{ color: "#0369a1", fontWeight: 600, fontSize: 11, marginTop: 2 }}>
                  HIGH WATERLOGGING ALERT
                </div>
              )}
              <div style={{ fontSize: 12, marginTop: 4 }}>{r.description}</div>
              <div className="meta-label" style={{ marginTop: 4 }}>
                {r.district_name || "District"} · {new Date(r.created_at).toLocaleDateString()}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="map-legend">
        <div className="legend-title">{t.risk.suitabilityScale}</div>
        {legendItems.map((item) => (
          <div key={item.label} className="legend-row">
            <span className="legend-swatch" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
