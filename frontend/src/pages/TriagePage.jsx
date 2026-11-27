import { useState } from "react";
import { Activity, AlertCircle, AlertOctagon, AlertTriangle, Ban, CheckCircle2, ChevronRight, HelpCircle, Phone, PhoneCall, ShieldAlert, Stethoscope } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function TriagePage() {
  const { lang, t } = useLanguage();

  const [hasFever, setHasFever] = useState("1");
  const [feverDays, setFeverDays] = useState(2);
  const [platelets, setPlatelets] = useState("");

  // Probable dengue symptoms
  const [symptoms, setSymptoms] = useState({
    headache: true,
    retroOrbital: true,
    myalgia: false,
    arthralgia: false,
    rash: false,
    nausea: false,
  });

  // Warning signs (WHO Group B)
  const [warnings, setWarnings] = useState({
    abdominalPain: false,
    persistentVomiting: false,
    fluidAccumulation: false,
    mucosalBleed: false,
    lethargyRestless: false,
    hepatomegaly: false,
  });

  // Severe dengue signs (WHO Group C)
  const [severe, setSevere] = useState({
    severePlasmaLeakage: false,
    severeBleeding: false,
    severeOrganImpairment: false,
    coldClammyExtremities: false,
  });

  // Co-existing conditions
  const [coexisting, setCoexisting] = useState({
    pregnancy: false,
    infancyOrElderly: false,
    diabetes: false,
    hypertension: false,
    livingAlone: false,
  });

  const toggleSymptom = (k) => setSymptoms((p) => ({ ...p, [k]: !p[k] }));
  const toggleWarning = (k) => setWarnings((p) => ({ ...p, [k]: !p[k] }));
  const toggleSevere = (k) => setSevere((p) => ({ ...p, [k]: !p[k] }));
  const toggleCoexisting = (k) => setCoexisting((p) => ({ ...p, [k]: !p[k] }));

  // Evaluate classification
  const pltNum = platelets ? Number(platelets) : null;
  const hasSevere = Object.values(severe).some(Boolean);
  const hasWarning = Object.values(warnings).some(Boolean) || (pltNum !== null && pltNum < 100);
  const hasCoexisting = Object.values(coexisting).some(Boolean);
  const probableCount = Object.values(symptoms).filter(Boolean).length;
  const isProbable = hasFever === "1" && probableCount >= 2;

  let group = "A";
  let groupColor = "var(--risk-low-text, #16a34a)";
  let groupBg = "rgba(22, 163, 74, 0.12)";
  let groupBorder = "rgba(22, 163, 74, 0.3)";

  if (hasSevere || (pltNum !== null && pltNum < 50)) {
    group = "C";
    groupColor = "var(--color-critical, #dc2626)";
    groupBg = "rgba(220, 38, 38, 0.12)";
    groupBorder = "rgba(220, 38, 38, 0.3)";
  } else if (hasWarning || hasCoexisting) {
    group = "B";
    groupColor = "var(--risk-high-text, #ea580c)";
    groupBg = "rgba(234, 88, 12, 0.12)";
    groupBorder = "rgba(234, 88, 12, 0.3)";
  }

  const isCriticalPhase = feverDays >= 3 && feverDays <= 7;

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="badge badge-high" style={{ background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
              WHO 2009 Clinical Aid
            </span>
          </div>
          <h1 style={{ marginTop: 6 }}>{t.triage.title}</h1>
          <p className="subtitle">{t.triage.subtitle}</p>
        </div>
      </div>

      <div className="split-layout" style={{ marginTop: 20, alignItems: "flex-start" }}>
        {/* Left column: Assessment form */}
        <div className="card form-stack" style={{ flex: 1.2 }}>
          {/* Step 1: Fever parameters */}
          <div>
            <h3 style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <Stethoscope size={18} color="var(--accent-primary)" />
              {t.triage.feverSection}
            </h3>
            <div className="filter-row" style={{ gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label className="meta-label">{t.triage.hasFever}</label>
                <select
                  className="input-field"
                  value={hasFever}
                  onChange={(e) => setHasFever(e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value="1">{t.triage.yes}</option>
                  <option value="0">{t.triage.no}</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 140 }}>
                <label className="meta-label">{t.triage.feverDuration}</label>
                <input
                  type="number"
                  min="0"
                  max="21"
                  className="input-field"
                  value={feverDays}
                  onChange={(e) => setFeverDays(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div style={{ flex: 1.2, minWidth: 180 }}>
                <label className="meta-label">{t.triage.plateletCount}</label>
                <input
                  type="number"
                  placeholder={t.triage.plateletPlaceholder}
                  className="input-field"
                  value={platelets}
                  onChange={(e) => setPlatelets(e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>
            </div>

            {isCriticalPhase && hasFever === "1" && (
              <div style={{
                marginTop: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(234, 88, 12, 0.12)",
                border: "1px solid rgba(234, 88, 12, 0.3)",
                fontSize: "0.82rem",
                color: "var(--risk-high-text, #ea580c)",
                display: "flex",
                alignItems: "flex-start",
                gap: 6
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>{t.triage.criticalPhaseNote}:</strong> {t.triage.criticalPhaseDesc}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Probable Symptoms */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>{t.triage.symptomsSection}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {Object.keys(symptoms).map((k) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", cursor: "pointer", padding: "6px 8px", background: symptoms[k] ? "var(--surface-hover, rgba(255,255,255,0.04))" : "transparent", borderRadius: 6 }}>
                  <input
                    type="checkbox"
                    checked={symptoms[k]}
                    onChange={() => toggleSymptom(k)}
                  />
                  <span>{t.triage.symptomList[k]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Warning signs */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--risk-high-text, #ea580c)", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} /> {t.triage.warningsSection}
              </h3>
              <span className="badge badge-high" style={{ fontSize: "0.72rem" }}>Hospital Observation</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {Object.keys(warnings).map((k) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", cursor: "pointer", padding: "6px 8px", background: warnings[k] ? "rgba(234, 88, 12, 0.08)" : "transparent", borderRadius: 6 }}>
                  <input
                    type="checkbox"
                    checked={warnings[k]}
                    onChange={() => toggleWarning(k)}
                  />
                  <span>{t.triage.warningList[k]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 4: Severe signs */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-critical, #dc2626)", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertOctagon size={15} /> {t.triage.severeSection}
              </h3>
              <span className="badge badge-critical" style={{ fontSize: "0.72rem" }}>Emergency Resuscitation</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {Object.keys(severe).map((k) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", cursor: "pointer", padding: "6px 8px", background: severe[k] ? "rgba(220, 38, 38, 0.08)" : "transparent", borderRadius: 6 }}>
                  <input
                    type="checkbox"
                    checked={severe[k]}
                    onChange={() => toggleSevere(k)}
                  />
                  <span>{t.triage.severeList[k]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 5: Co-existing conditions */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>{t.triage.coexistingSection}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {Object.keys(coexisting).map((k) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", cursor: "pointer", padding: "6px 8px", background: coexisting[k] ? "var(--surface-hover, rgba(255,255,255,0.04))" : "transparent", borderRadius: 6 }}>
                  <input
                    type="checkbox"
                    checked={coexisting[k]}
                    onChange={() => toggleCoexisting(k)}
                  />
                  <span>{t.triage.coexistingList[k]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Real-time Classification & Action Plan */}
        <div style={{ flex: 0.9, position: "sticky", top: 80 }} className="form-stack">
          <div className="card" style={{ background: groupBg, border: `1px solid ${groupBorder}` }}>
            <span className="meta-label">{t.triage.classificationResult}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: groupColor }}>
                Group {group}
              </span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: groupColor }}>
                — {t.triage.groups[group].title}
              </span>
            </div>

            <p style={{ fontSize: "0.9rem", marginTop: 10, lineHeight: 1.5, color: "var(--ink-primary)" }}>
              {t.triage.groups[group].action}
            </p>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: 6 }}>
                {t.triage.clinicalActionPlan}:
              </strong>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.84rem", lineHeight: 1.6 }}>
                {t.triage.groups[group].steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Crucial medication warning */}
            <div style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: "0.8rem",
              lineHeight: 1.45,
              display: "flex",
              alignItems: "flex-start",
              gap: 6
            }}>
              <Ban size={15} style={{ color: "var(--color-critical, #dc2626)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: "var(--color-critical, #dc2626)" }}>{t.triage.nsaidWarningTitle}:</strong>{" "}
                {t.triage.nsaidWarningText}
              </div>
            </div>
          </div>

          {/* Bangladesh Emergency Hotlines */}
          <div className="card">
            <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 6 }}>
              <PhoneCall size={16} color="var(--accent-primary)" />
              {t.triage.emergencyHotlinesTitle}
            </h3>
            <div style={{ display: "grid", gap: 8, fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><PhoneCall size={13} /> {t.triage.nationalEmergency}</span>
                <strong className="mono" style={{ color: "var(--accent-primary)" }}>999</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Activity size={13} /> {t.triage.shasthyaBatayan}</span>
                <strong className="mono" style={{ color: "var(--accent-primary)" }}>16263</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Stethoscope size={13} /> {t.triage.iedcrHotline}</span>
                <strong className="mono" style={{ color: "var(--accent-primary)" }}>10655</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Phone size={13} /> {t.triage.dghsHotline}</span>
                <strong className="mono" style={{ color: "var(--accent-primary)" }}>01759-114488</strong>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="meta-label" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
            {t.triage.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}
