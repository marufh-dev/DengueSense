export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        marginTop: "auto",
        borderTop: "1px solid #14080e",
        background: "#ffffff",
        padding: "20px 16px",
        textAlign: "center",
        fontSize: "0.86rem",
        color: "var(--ink-secondary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
        <span>Copyright &copy; 2026 - DengueSense | Built with passion by</span>
        <a
          href="https://github.com/marufh-dev"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#14080e",
            fontWeight: 700,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            transition: "opacity 0.15s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Maruf H.
        </a>
      </div>
    </footer>
  );
}
