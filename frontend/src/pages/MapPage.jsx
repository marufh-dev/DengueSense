import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

// Lazy-load heavy map components
const BangladeshMap = lazy(() => import("../components/BangladeshMap"));
const DistrictDrawer = lazy(() => import("../components/DistrictDrawer"));

export default function MapPage() {
  const { t } = useLanguage();
  const [districts, setDistricts] = useState([]);
  const [reports, setReports] = useState([]);
  const [division, setDivision] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([apiRequest("/api/districts/risk"), apiRequest("/api/reports?limit=50")])
      .then(([rk, rep]) => {
        setDistricts(rk.districts || []);
        setReports(rep.reports || []);
      })
      .catch(() => {});
  }, []);

  const divisions = useMemo(() => {
    return ["ALL", ...Array.from(new Set(districts.map((d) => d.division))).sort()];
  }, [districts]);

  const filtered = useMemo(() => {
    if (division === "ALL") return districts;
    return districts.filter((d) => d.division === division);
  }, [districts, division]);

  const handleSelect = (d) => {
    setSelected(d);
    setLoading(true);
    apiRequest(`/api/districts/${d.id}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{t.mapPage.title}</h1>
          <p className="subtitle">{t.mapPage.subtitle}</p>
        </div>
        <div className="filter-row">
          <label htmlFor="div-filter" className="meta-label">{t.mapPage.divisionLabel}</label>
          <select
            id="div-filter"
            className="input-field"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            style={{ width: 180 }}
          >
            {divisions.map((div) => (
              <option key={div} value={div}>
                {div === "ALL" ? t.mapPage.allDivisions : div}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="split-layout">
        <div className="map-col">
          <Suspense
            fallback={
              <div
                className="card skeleton-shimmer"
                style={{ height: "620px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span className="mono" style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                  LOADING NATIONAL RISK MAP...
                </span>
              </div>
            }
          >
            <BangladeshMap
              districts={filtered}
              reports={reports}
              selectedDistrictId={selected?.id}
              onSelectDistrict={handleSelect}
              height="620px"
            />
          </Suspense>
        </div>
        <div className="drawer-col">
          <Suspense fallback={<div className="card skeleton-shimmer" style={{ height: "420px" }} />}>
            <DistrictDrawer district={selected} detail={detail} loading={loading} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
