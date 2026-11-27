export default function PageSkeleton() {
  return (
    <div className="container" style={{ position: "relative", zIndex: 1, padding: "24px 16px" }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div
          className="skeleton-shimmer"
          style={{ width: "240px", height: "32px", borderRadius: "6px", marginBottom: "12px" }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: "420px", height: "16px", borderRadius: "4px" }}
        />
      </div>

      {/* KPI grid skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              height: 100,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div className="skeleton-shimmer" style={{ width: "80px", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton-shimmer" style={{ width: "120px", height: "28px", borderRadius: "6px" }} />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div
        className="card"
        style={{
          height: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid rgba(56, 189, 248, 0.2)",
            borderTopColor: "var(--accent-primary)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: 13, color: "var(--ink-secondary)", letterSpacing: "0.02em" }}>
          Loading module…
        </span>
      </div>
    </div>
  );
}
