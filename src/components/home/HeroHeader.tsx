import React from "react";
import type { ParticleData } from "./types";

export const CTF_CONFIG = {
  activeUrl: "https://im2026ctf.duckdns.org/",
  scoreboardUrl: "https://im2026ctf.duckdns.org/scoreboard",
  endTime: "2026-09-10T10:00:00+08:00",
} as const;

export const isCtfEnded = (): boolean => {
  try {
    return Date.now() > new Date(CTF_CONFIG.endTime).getTime();
  } catch {
    return false;
  }
};

export const getStageIcon = (stage: number): string => {
  if (stage <= 0) return "";
  if (stage <= 4) return "⚡";
  if (stage <= 8) return "🔓";
  if (stage <= 12) return "🔥";
  if (stage <= 16) return "🚨";
  if (stage < 20) return "💥";
  return isCtfEnded() ? "🏆" : "🚩";
};

export const getStageDropShadow = (stage: number): string => {
  if (stage >= 17) return "drop-shadow(0 0 24px #10b981) drop-shadow(0 0 12px #38bdf8)";
  if (stage >= 13) return "drop-shadow(0 0 20px rgba(239, 68, 68, 0.95))";
  if (stage >= 9) return "drop-shadow(0 0 16px rgba(249, 115, 22, 0.9))";
  if (stage >= 5) return "drop-shadow(0 0 12px rgba(168, 85, 247, 0.85))";
  return "drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))";
};

export const getStageRotation = (stage: number): number => {
  if (stage >= 20) return 360;
  return stage % 2 === 0 ? stage * 1.2 : -stage * 1.2;
};

export const getLogoStyle = (stage: number, isUnlocked: boolean): React.CSSProperties => {
  const base: React.CSSProperties = {
    width: 132,
    height: 132,
    marginBottom: 8,
    border: "none",
    overflow: "visible",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    cursor: "pointer",
    userSelect: "none",
    padding: 0,
    transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.18s ease",
    willChange: "transform",
    backfaceVisibility: "hidden",
  };

  if (isUnlocked) {
    return {
      ...base,
      filter: "drop-shadow(0 0 12px #10b981)",
      animation: "unlockedPulse 3s ease-in-out infinite",
    };
  }

  if (stage <= 0) {
    return {
      ...base,
      filter: "drop-shadow(0 4px 12px rgba(27, 42, 74, 0.15))",
      transform: "none",
    };
  }

  const scale = 1.0 + (stage / 20) * 0.32;
  const rotate = getStageRotation(stage);
  const filter = getStageDropShadow(stage);

  return {
    ...base,
    transform: `scale(${scale.toFixed(2)}) rotate(${rotate}deg)`,
    filter,
  };
};

export const NcuimLogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true">
    <image href="/ncuim-icons/hero-logo.svg" x="0" y="0" width="128" height="128" preserveAspectRatio="xMidYMid meet" />
  </svg>
);

export const HeroHeader = ({
  stage,
  isUnlocked,
  particles,
  onLogoClick,
}: Readonly<{
  stage: number;
  isUnlocked: boolean;
  particles: readonly ParticleData[];
  onLogoClick: () => void;
}>) => (
  <div
    style={{
      textAlign: "center",
      padding: "var(--ncu-space-3) 0 var(--ncu-space-2)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <style>{`
      @keyframes unlockedPulse {
        0%, 100% {
          transform: scale(1.04);
          filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.85)) drop-shadow(0 0 8px rgba(56, 189, 248, 0.6));
        }
        50% {
          transform: scale(1.08);
          filter: drop-shadow(0 0 28px rgba(16, 185, 129, 1)) drop-shadow(0 0 14px rgba(56, 189, 248, 0.8));
        }
      }
      @keyframes cyberGlowParticle {
        0% {
          opacity: 0;
          transform: translate3d(0, 8px, 0) scale(0.85);
        }
        15% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
        60% {
          opacity: 0.85;
          transform: translate3d(calc(var(--drift-x, 0px) * 0.5), calc(var(--fly-y, -50px) * 0.5), 0) scale(0.8);
        }
        100% {
          opacity: 0;
          transform: translate3d(var(--drift-x, 0px), var(--fly-y, -50px), 0) scale(0.25);
        }
      }
    `}</style>
    <div style={{ position: "relative", display: "inline-flex", marginBottom: 14 }}>
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="NCUIM Logo"
        style={getLogoStyle(stage, isUnlocked)}
        title="NCUIM"
      >
        <NcuimLogoIcon />
      </button>

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: `calc(50% + ${p.offsetY}px)`,
            left: p.side === "right" ? `calc(100% + ${p.sideOffset}px)` : "auto",
            right: p.side === "left" ? `calc(100% + ${p.sideOffset}px)` : "auto",
            ["--fly-y" as string]: `${p.flyY}px`,
            ["--drift-x" as string]: `${p.driftX}px`,
            fontSize: 20,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: p.stage >= 13 ? "rgba(15, 23, 42, 0.94)" : "rgba(15, 23, 42, 0.88)",
            border: `1.5px solid ${p.stage >= 13 ? "#ef4444" : "#38bdf8"}`,
            boxShadow: p.stage >= 13
              ? "0 0 16px rgba(239, 68, 68, 0.6)"
              : "0 0 14px rgba(56, 189, 248, 0.6)",
            animation: `cyberGlowParticle ${p.duration}s ease-out forwards`,
            willChange: "transform, opacity",
            transformOrigin: "center center",
            backfaceVisibility: "hidden",
            pointerEvents: "none",
            zIndex: 10,
            userSelect: "none",
          }}
        >
          {p.text}
        </div>
      ))}
    </div>

    <h1
      style={{
        fontSize: "var(--ncu-font-size-3xl)",
        fontWeight: "var(--ncu-font-weight-bold)",
        margin: 0,
        lineHeight: 1.2,
        color: "var(--ncu-ink)",
      }}
    >
      CIM-Life 中央資管通
    </h1>
    <p
      style={{
        fontSize: "var(--ncu-font-size-base)",
        color: "var(--ncu-muted)",
        margin: "var(--ncu-space-1) 0 0",
      }}
    >
      歡迎加入資管所
    </p>
  </div>
);
