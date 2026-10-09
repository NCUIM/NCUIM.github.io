import React from "react";
import { IonIcon } from "@ionic/react";
import { logoGithub } from "ionicons/icons";

export const HomeFooter: React.FC = () => (
  <footer
    style={{
      textAlign: "center",
      padding: "28px 16px 36px",
      fontSize: 13,
      color: "var(--ncu-muted, #64748b)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}
  >
    <a
      href="https://github.com/NCUIM/NCUIM.github.io"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="前往 GitHub 專案並參與貢獻"
      style={{
        color: "var(--ncu-ink, #0f172a)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: "var(--ncu-radius-full, 9999px)",
        background: "var(--ncu-surface, #ffffff)",
        border: "1px solid var(--ncu-border, #cbd5e1)",
        fontSize: 12.5,
        fontWeight: 600,
        textDecoration: "none",
        transition: "all 0.15s ease",
        boxShadow: "var(--ncu-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))",
      }}
    >
      <IonIcon icon={logoGithub} style={{ fontSize: 16 }} />
      <span>歡迎參與專案貢獻 (GitHub) ↗</span>
    </a>

    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        opacity: 0.9,
      }}
    >
      <img
        src="https://hits.sh/ncuim.github.io.svg?style=flat-square&label=VISITORS&color=2563eb"
        alt="Visitors Counter"
        style={{ height: 18, borderRadius: 3 }}
      />
    </div>
  </footer>
);

export default HomeFooter;
