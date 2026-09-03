import type React from "react";

export interface SeatSizes {
  readonly seat: number;
  readonly gap: number;
  readonly name: number;
  readonly code: number;
  readonly height?: number;
}

export const getSeatSizes = (cols: number): SeatSizes => {
  if (cols <= 2) return { seat: 112, gap: 8, name: 18, code: 11 };
  if (cols === 4) return { seat: 64, gap: 6, name: 13, code: 9 };
  return { seat: 58, gap: 5, name: 12, code: 8 };
};

export const getSeatStyle = (
  sizes: SeatSizes,
  vacant: boolean,
): React.CSSProperties => ({
  minWidth: sizes.seat,
  minHeight: sizes.height ?? 52,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  fontSize: sizes.name,
  fontWeight: 700,
  lineHeight: 1.3,
  padding: "3px 4px",
  background: vacant ? "var(--ncu-canvas)" : "var(--ncu-primary-light)",
  border: vacant ? "1.5px dashed var(--ncu-border)" : "1.5px solid var(--ncu-primary)",
  color: vacant ? "var(--ncu-muted)" : "var(--ncu-ink)",
});

export const SPECIAL_STYLES: Record<string, React.CSSProperties> = {
  corridor: {
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 6,
    color: "var(--ncu-muted)",
    borderTop: "1px dashed var(--ncu-border)",
    borderBottom: "1px dashed var(--ncu-border)",
  },
  printer: {
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "var(--ncu-surface)",
    border: "1.5px dashed var(--ncu-border)",
    color: "var(--ncu-muted)",
    padding: "6px 4px",
  },
  sofa: {
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "var(--ncu-canvas)",
    border: "1.5px dashed var(--ncu-border)",
    color: "var(--ncu-muted)",
    letterSpacing: 4,
    padding: "6px 4px",
  },
  pillar: {
    minWidth: 44,
    minHeight: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "var(--ncu-canvas)",
    border: "1.5px dashed var(--ncu-border)",
    color: "var(--ncu-muted)",
  },
  whiteboard: {
    minHeight: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    background: "var(--ncu-surface)",
    border: "1.5px solid var(--ncu-border)",
    color: "var(--ncu-ink)",
    padding: "4px 8px",
    letterSpacing: 4,
    boxSizing: "border-box",
  },
  // Placeholder cell that reserves its grid slot without drawing anything.
  empty: {},
};

export const DOOR_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  background: "#fef3c7",
  border: "1.5px solid #d97706",
  color: "#92400e",
  padding: "4px 12px",
};
