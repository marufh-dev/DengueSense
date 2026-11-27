export default function PageSkeleton() {
  return (
    <div className="container" style={{ position: "relative", zIndex: 1, padding: "24px 16px" }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div
          className="skeleton-shimmer"
          style={{ width: "240px", height: "32px", border: "1px solid #000000", marginBottom: "12px" }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: "420px", height: "16px", border: "1px solid #e4e4e7" }}
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
            <div className="skeleton-shimmer" style={{ width: "80px", height: "14px", border: "1px solid #e4e4e7" }} />
            <div className="skeleton-shimmer" style={{ width: "120px", height: "28px", border: "1px solid #000000" }} />
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
            width: 28,
            height: 28,
            border: "2px solid #000000",
            borderTopColor: "transparent",
            animation: "spin 0.6s linear infinite",
          }}
        />
        <span style={{ fontSize: 12, color: "#000000", fontFamily: "monospace", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          [INITIALIZING MODULE...]
        </span>
      </div>
    </div>
  );
}
