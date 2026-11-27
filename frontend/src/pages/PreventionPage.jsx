import { useState, useEffect } from "react";
import { Award, CheckCircle2, Circle, Flame, Info, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const CHECKLIST_ITEMS = [
  { id: "vases", icon: "🪴" },
  { id: "trays", icon: "🧊" },
  { id: "tanks", icon: "🚰" },
  { id: "gutters", icon: "🏠" },
  { id: "containers", icon: "🥥" },
  { id: "tyres", icon: "🛞" },
  { id: "buckets", icon: "🪣" },
  { id: "screens", icon: "🪟" },
];

export default function PreventionPage() {
  const { lang, t } = useLanguage();

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("denguesense_prevention_checks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem("denguesense_prevention_streak");
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    localStorage.setItem("denguesense_prevention_checks", JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleCheck = (id) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // If all 8 completed, record streak
      const totalChecked = CHECKLIST_ITEMS.filter((item) => next[item.id]).length;
      if (totalChecked === CHECKLIST_ITEMS.length && !prev[id]) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        localStorage.setItem("denguesense_prevention_streak", String(nextStreak));
      }
      return next;
    });
  };

  const handleReset = () => {
    setCheckedItems({});
    localStorage.removeItem("denguesense_prevention_checks");
  };

  const completedCount = CHECKLIST_ITEMS.filter((item) => checkedItems[item.id]).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);
  const isAllDone = completedCount === CHECKLIST_ITEMS.length;

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="badge badge-low" style={{ background: "rgba(22, 163, 74, 0.15)", color: "#16a34a" }}>
              7–10 Day Life Cycle Breaker
            </span>
          </div>
          <h1 style={{ marginTop: 6 }}>{t.prevention.title}</h1>
          <p className="subtitle">{t.prevention.subtitle}</p>
        </div>

        {/* Streak Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: "10px 16px"
        }}>
          <Flame size={24} color="#f97316" />
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--ink-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
              {t.prevention.streakLabel}
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--ink-primary)" }}>
              {streak} {t.prevention.weeks}
            </div>
          </div>
        </div>
      </div>

      {/* Progress card */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong style={{ fontSize: "0.95rem" }}>
            {t.prevention.progressTitle} ({completedCount}/{CHECKLIST_ITEMS.length})
          </strong>
          <span className="mono" style={{ fontSize: "0.9rem", fontWeight: 700, color: isAllDone ? "var(--risk-low-text, #16a34a)" : "var(--accent-primary)" }}>
            {progressPercent}%
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: isAllDone ? "linear-gradient(90deg, #16a34a, #22c55e)" : "linear-gradient(90deg, #0284c7, #38bdf8)",
            transition: "width 0.3s ease"
          }} />
        </div>

        {isAllDone && (
          <div style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "rgba(22, 163, 74, 0.12)",
            border: "1px solid rgba(22, 163, 74, 0.3)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Award size={20} color="#16a34a" />
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#16a34a" }}>
                {t.prevention.completedBanner}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
            >
              <RefreshCw size={12} /> {t.prevention.resetWeek}
            </button>
          </div>
        )}
      </div>

      {/* Main interactive grid: Checklist & Science Explanation */}
      <div className="two-col-grid" style={{ marginTop: 20 }}>
        {/* Left: 8 Action Items */}
        <div className="form-stack">
          {CHECKLIST_ITEMS.map((item) => {
            const isDone = !!checkedItems[item.id];
            const data = t.prevention.items[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className="card"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderColor: isDone ? "rgba(22, 163, 74, 0.35)" : "var(--border-subtle)",
                  background: isDone ? "rgba(22, 163, 74, 0.05)" : "var(--surface)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginTop: 2 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "0.95rem", textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--ink-secondary)" : "var(--ink-primary)" }}>
                      {data.title}
                    </strong>
                    {isDone ? (
                      <CheckCircle2 size={18} color="#16a34a" />
                    ) : (
                      <Circle size={18} color="var(--ink-secondary)" />
                    )}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--ink-secondary)", lineHeight: 1.4 }}>
                    {data.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Biology & Why 10 minutes matter */}
        <div className="form-stack">
          <div className="card">
            <h3 style={{ margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} color="var(--accent-primary)" />
              {t.prevention.why7DaysTitle}
            </h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--ink-secondary)" }}>
              {t.prevention.why7DaysBody}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              textAlign: "center",
              margin: "16px 0",
              padding: "12px 6px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              fontSize: "0.78rem"
            }}>
              <div>
                <strong style={{ display: "block", color: "var(--accent-primary)" }}>Day 1</strong>
                <span style={{ color: "var(--ink-secondary)" }}>Eggs Hatch</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "var(--accent-primary)" }}>Days 2–5</strong>
                <span style={{ color: "var(--ink-secondary)" }}>Larvae in Water</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "#f97316" }}>Days 6–7</strong>
                <span style={{ color: "var(--ink-secondary)" }}>Pupae Stage</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "#dc2626" }}>Day 8+</strong>
                <span style={{ color: "var(--ink-secondary)" }}>Flying Mosquito</span>
              </div>
            </div>

            <div style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(2, 132, 199, 0.1)",
              border: "1px solid rgba(2, 132, 199, 0.25)",
              fontSize: "0.82rem",
              lineHeight: 1.45,
              color: "#38bdf8"
            }}>
              💡 <strong>{t.prevention.tipTitle}:</strong> {t.prevention.tipText}
            </div>
          </div>

          {/* Routine Reminder */}
          <div className="card">
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              🗓️ {t.prevention.pickDryDayTitle}
            </h3>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {t.prevention.pickDryDayText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
