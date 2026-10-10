import React from "react";

export const HomeFooter: React.FC = () => (
  <footer
    style={{
      textAlign: "center",
      padding: "24px 16px 36px",
      fontSize: 13,
      color: "var(--ncu-muted, #64748b)",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      flexWrap: "nowrap",
      overflowX: "auto",
    }}
  >
    <a
      href="https://github.com/NCUIM/NCUIM.github.io"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub 專案與 Star"
      style={{
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
        opacity: 0.9,
        flexShrink: 0,
      }}
    >
      <img
        src="https://img.shields.io/github/stars/NCUIM/NCUIM.github.io?style=flat-square&label=STARS&color=eab308&logo=github"
        alt="GitHub Stars"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        style={{ height: 20, borderRadius: 3 }}
      />
    </a>

    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        opacity: 0.9,
        flexShrink: 0,
      }}
    >
      <img
        src="https://hits.sh/ncuim.github.io.svg?style=flat-square&label=VISITORS&color=2563eb"
        alt="Visitors Counter"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        style={{ height: 20, borderRadius: 3 }}
      />
    </div>
  </footer>
);

export default HomeFooter;

