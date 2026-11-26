const LEVEL_CLASS = {
  LOW: "badge-low",
  MODERATE: "badge-moderate",
  HIGH: "badge-high",
  CRITICAL: "badge-critical",
  "NO DATA": "badge-nodata",
};

export default function RiskBadge({ level = "NO DATA", score = null }) {
  const cls = LEVEL_CLASS[level] || "badge-nodata";
  return (
    <span className={`badge ${cls}`}>
      <span>{level}</span>
      {score !== null && score !== undefined && (
        <span className="tabular-nums mono" style={{ marginLeft: 6 }}>
          {Number(score).toFixed(1)}
        </span>
      )}
    </span>
  );
}
