import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer } from "react-leaflet";

const RISK_FILL = {
  LOW: "#16a34a",
  MODERATE: "#d97706",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
  "NO DATA": "#94a3b8",
};

const LEGEND_ITEMS = [
  { label: "CRITICAL (75–100)", color: RISK_FILL.CRITICAL },
  { label: "HIGH (55–74)", color: RISK_FILL.HIGH },
  { label: "MODERATE (30–54)", color: RISK_FILL.MODERATE },
  { label: "LOW (0–29)", color: RISK_FILL.LOW },
  { label: "NO DATA (Missing/Stale)", color: RISK_FILL["NO DATA"] },
];

export default function BangladeshMap({
  districts = [],
  reports = [],
  selectedDistrictId,
  onSelectDistrict,
  height = "560px",
}) {
  const [geojson, setGeojson] = useState(null);

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
      fillOpacity: level === "NO DATA" ? 0.35 : isSelected ? 0.78 : 0.56,
      color: isSelected ? "#10201d" : "#ffffff",
      weight: isSelected ? 2.5 : 1,
      dashArray: level === "NO DATA" ? "4 3" : undefined,
    };
  };

  const onEachFeature = (feature, layer) => {
    const code = feature.properties?.district_code;
    const d = byCode[code];
    const name = d?.name_en || feature.properties?.name_en;
    const level = d?.risk_level || "NO DATA";
    const scoreText =
      d?.environmental_score !== null && d?.environmental_score !== undefined
        ? `${Number(d.environmental_score).toFixed(1)} / 100`
        : "No data";

    layer.bindTooltip(
      `<strong>${name}</strong><br/>EDSI: ${level} (${scoreText})`,
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
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojson && (
          <GeoJSON
            key={`${districts.length}-${selectedDistrictId || "none"}`}
            data={geojson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        {reports.map((rep) => (
          <CircleMarker
            key={rep.id}
            center={[rep.latitude, rep.longitude]}
            radius={6}
            pathOptions={{
              color: "#10201d",
              weight: 1.5,
              fillColor: "#0f6b60",
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div style={{ fontSize: 12 }}>
                <strong>{rep.report_type.replaceAll("_", " ")}</strong>
                <div style={{ marginTop: 4 }}>{rep.description}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="map-legend" aria-label="Environmental suitability legend">
        <div className="legend-title">EDSI Suitability</div>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="legend-row">
            <span className="legend-swatch" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
