import type React from "react";

/**
 * Horizontal aisle walkway strip (e.g., door walkway or row gap walkway).
 */
export const HorizontalWalkway = ({
  gridRow,
  height = 22,
}: Readonly<{
  gridRow: number;
  height?: number;
}>) => (
  <div
    style={{
      gridRow,
      gridColumn: "1 / -1",
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 6,
      color: "var(--ncu-muted)",
      borderTop: "1px dashed var(--ncu-border)",
      borderBottom: "1px dashed var(--ncu-border)",
      userSelect: "none",
    }}
  >
    走道
  </div>
);

/**
 * Row gap spacer: renders walkway strip if height >= 12, or invisible spacer otherwise.
 */
export const RowGapSpacer = ({
  gridRow,
  height,
}: Readonly<{
  gridRow: number;
  height: number;
}>) =>
  height >= 12 ? (
    <HorizontalWalkway gridRow={gridRow} height={height} />
  ) : (
    <div style={{ gridRow, gridColumn: "1 / -1", height }} />
  );

/**
 * Vertical aisle column track running from top rowOffset to totalGridRows.
 */
export const VerticalAisleTrack = ({
  colTrack,
  rowOffset,
  totalGridRows,
}: Readonly<{
  colTrack: number;
  rowOffset: number;
  totalGridRows: number;
}>) => (
  <div
    style={{
      gridColumn: colTrack,
      gridRow: `${rowOffset + 1} / ${totalGridRows + 1}`,
      borderLeft: "1px dashed var(--ncu-border)",
      borderRight: "1px dashed var(--ncu-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    }}
  >
    <span
      style={{
        writingMode: "vertical-rl",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 6,
        color: "var(--ncu-muted)",
      }}
    >
      走道
    </span>
  </div>
);
