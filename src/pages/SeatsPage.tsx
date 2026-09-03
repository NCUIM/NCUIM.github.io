import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Layout data types
// ---------------------------------------------------------------------------

interface SeatCell {
  readonly type: "seat";
  readonly label: string;
  readonly occupant?: string;
}

interface SpecialCell {
  readonly type: "corridor" | "printer" | "pillar" | "door" | "empty" | "sofa" | "whiteboard";
  readonly label?: string;
  readonly colSpan?: number;
  readonly rowSpan?: number;
}

type GridCell = SeatCell | SpecialCell;

interface RoomLayout {
  readonly id: string;
  readonly name: string;
  readonly cols: number;
  /** 1-based column index the door badge is aligned over (above the grid). */
  readonly doorColumn?: number;
  /**
   * Horizontal gap (px) between each pair of adjacent desk columns,
   * length = cols - 1. Omit for a uniform gap.
   */
  readonly gaps?: readonly number[];
  /** Seat width override when aisles shrink the available space. */
  readonly seatWidth?: number;
  /** Seat height override (default 52). */
  readonly seatHeight?: number;
  /** Vertical walkway (px) between the doorColumn door and the first seat row. */
  readonly doorGap?: number;
  /** Side the door opens toward; the opening line is drawn on that side. */
  readonly doorOpen?: "down" | "left" | "right";
  /** Door positioned on the left wall at a specific 1-based row index. */
  readonly sideDoorRow?: number;
  /** Whiteboard on top wall above walkway: [startCol, endCol] (1-based logical seat columns). */
  readonly topWhiteboardCols?: readonly [number, number];
  /** Whiteboard on left wall at a specific 1-based row index. */
  readonly sideWhiteboardRow?: number;
  /** Printer positioned on the left wall at a specific 1-based row index. */
  readonly sidePrinterRow?: number;
  /** RowSpan for printer positioned on the left wall. */
  readonly sidePrinterRowSpan?: number;
  /** Whether there is a horizontal walkway between the door and the first seat row. */
  readonly doorWalkway?: boolean;
  /** Extra vertical aisle to the left of the desk columns. */
  readonly leftAisle?: boolean;
  /** Extra vertical aisle to the right of the desk columns. */
  readonly rightAisle?: boolean;
  /**
   * Vertical gap (px) between each pair of consecutive seat rows,
   * length = rows - 1. Omit for a uniform gap.
   */
  readonly rowGaps?: readonly number[];
  readonly rows: GridCell[][];
}

// ---------------------------------------------------------------------------
// Room layouts — imported from junmountain.github.io/seat-map (115 學年度)
// ---------------------------------------------------------------------------

const ROOM_LAYOUTS: readonly RoomLayout[] = [
  // ── 209: wall | col1 | 走道 | col2+col3 貼齊 | 走道 | col4 | wall ──
  {
    id: "209",
    name: "209 研究室",
    cols: 4,
    doorColumn: 1,
    doorOpen: "down",
    doorWalkway: true,
    gaps: [26, 4, 26],
    seatWidth: 54,
    rows: [
      [{ type: "seat", label: "1-1" }, { type: "seat", label: "2-1" }, { type: "seat", label: "3-1" }, { type: "seat", label: "4-1" }],
      [{ type: "seat", label: "1-2" }, { type: "seat", label: "2-2" }, { type: "seat", label: "3-2" }, { type: "seat", label: "4-2" }],
      [{ type: "seat", label: "1-3" }, { type: "seat", label: "2-3" }, { type: "seat", label: "3-3" }, { type: "seat", label: "4-3" }],
      [{ type: "seat", label: "1-4" }, { type: "seat", label: "2-4" }, { type: "seat", label: "3-4" }, { type: "seat", label: "4-4" }],
      [{ type: "seat", label: "1-5" }, { type: "seat", label: "2-5" }, { type: "seat", label: "3-5" }, { type: "seat", label: "4-5" }],
    ],
  },

  // ── 310: left aisle (with door) | col1+col2 貼齊 | 走道 | col3+col4 貼齊 | 走道 | col5+col6 貼齊 | wall ──
  {
    id: "310",
    name: "310 研究室",
    cols: 6,
    doorColumn: 1,
    doorOpen: "down",
    doorWalkway: true,
    leftAisle: true,
    gaps: [4, 18, 4, 18, 4],
    seatWidth: 42,
    doorGap: 18,
    rows: [
      [{ type: "seat", label: "1-1" }, { type: "seat", label: "2-1" }, { type: "seat", label: "3-1" }, { type: "seat", label: "4-1" }, { type: "seat", label: "5-1" }, { type: "printer", label: "印表機", rowSpan: 3 }],
      [{ type: "seat", label: "1-2" }, { type: "seat", label: "2-2" }, { type: "seat", label: "3-2" }, { type: "seat", label: "4-2" }, { type: "seat", label: "5-2" }],
      [{ type: "seat", label: "1-3" }, { type: "seat", label: "2-3" }, { type: "seat", label: "3-3" }, { type: "seat", label: "4-3" }, { type: "seat", label: "5-3" }],
      [
        { type: "corridor", label: "走道", colSpan: 2 },
        { type: "corridor", label: "走道", colSpan: 2 },
        { type: "corridor", label: "走道", colSpan: 2 },
      ],
      [{ type: "seat", label: "1-4" }, { type: "seat", label: "2-4" }, { type: "seat", label: "3-4" }, { type: "seat", label: "4-4" }, { type: "seat", label: "5-4" }, { type: "seat", label: "6-1" }],
      [{ type: "seat", label: "1-5" }, { type: "seat", label: "2-5" }, { type: "seat", label: "3-5" }, { type: "seat", label: "4-5" }, { type: "seat", label: "5-5" }, { type: "seat", label: "6-2" }],
    ],
  },

  // ── 313: 4-col desks, top equipment (printer, sofa, door), vertical aisles between cols 1-2 and 3-4 ──
  {
    id: "313",
    name: "313 研究室",
    cols: 4,
    doorOpen: "left",
    gaps: [24, 4, 24],
    seatWidth: 54,
    rows: [
      [
        { type: "printer", label: "印表機" },
        { type: "sofa", label: "沙發", colSpan: 2 },
        { type: "door", label: "大門" },
      ],
      [
        { type: "corridor", label: "走道" },
        { type: "corridor", label: "走道", colSpan: 2 },
        { type: "corridor", label: "走道" },
      ],
      [{ type: "seat", label: "1-1" }, { type: "seat", label: "2-1" }, { type: "seat", label: "3-1" }, { type: "seat", label: "4-1" }],
      [{ type: "seat", label: "1-2" }, { type: "seat", label: "2-2" }, { type: "seat", label: "3-2" }, { type: "pillar", label: "牆柱" }],
      [{ type: "seat", label: "1-3" }, { type: "seat", label: "2-3" }, { type: "seat", label: "3-3" }, { type: "seat", label: "4-2" }],
      [{ type: "seat", label: "1-4" }, { type: "seat", label: "2-4" }, { type: "seat", label: "3-4" }, { type: "seat", label: "4-3" }],
      [{ type: "seat", label: "1-5" }, { type: "seat", label: "2-5" }, { type: "seat", label: "3-5" }, { type: "seat", label: "4-4" }],
      [{ type: "seat", label: "1-6" }, { type: "seat", label: "2-6" }, { type: "seat", label: "3-6" }, { type: "seat", label: "4-5" }],
    ],
  },

    // ── 919: 2-col desks with left aisle from door & printer and right aisle to wall ──
  {
    id: "919",
    name: "919 研究室",
    cols: 2,
    seatWidth: 54,
    sideDoorRow: 1,
    sidePrinterRow: 4,
    sidePrinterRowSpan: 3,
    doorOpen: "right",
    leftAisle: true,
    rightAisle: true,
    gaps: [4],
    rows: [
      [{ type: "seat", label: "1-1" }, { type: "seat", label: "2-1" }],
      [{ type: "seat", label: "1-2" }, { type: "seat", label: "2-2" }],
      [{ type: "corridor", label: "走道" }],
      [{ type: "seat", label: "1-3" }, { type: "seat", label: "2-3" }],
      [{ type: "seat", label: "1-4" }, { type: "seat", label: "2-4" }],
      [{ type: "seat", label: "1-5" }, { type: "seat", label: "2-5" }],
    ],
  },
];

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const getSeatSizes = (cols: number) => {
  if (cols <= 2) return { seat: 112, gap: 8, name: 18, code: 11 };
  if (cols === 4) return { seat: 64, gap: 6, name: 13, code: 9 };
  return { seat: 58, gap: 5, name: 12, code: 8 };
};

const getSeatStyle = (
  sizes: ReturnType<typeof getSeatSizes> & { height?: number },
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

const SPECIAL_STYLES: Record<string, React.CSSProperties> = {
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

const DOOR_STYLE: React.CSSProperties = {
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

const SeatGrid = ({ layout }: Readonly<{ layout: RoomLayout }>) => {
  const baseSizes = getSeatSizes(layout.cols);
  const seatW = layout.seatWidth ?? baseSizes.seat;
  const seatH = layout.seatHeight ?? 52;
  const font =
    seatW >= 54 ? { name: 13, code: 9 } : seatW >= 44 ? { name: 12, code: 8 } : { name: 10, code: 8 };
  const sizes = { ...baseSizes, seat: seatW, height: seatH, name: font.name, code: font.code };
  const rows = layout.rows;
  const hasAisles = layout.gaps !== undefined;
  const hasRowAisles = layout.rowGaps !== undefined;
  const hasSideTrack =
    layout.sideDoorRow !== undefined ||
    layout.sidePrinterRow !== undefined ||
    layout.sideWhiteboardRow !== undefined;
  const hasSideDoor = layout.sideDoorRow !== undefined;
  const hasLeftAisle = layout.leftAisle === true;
  const hasRightAisle = layout.rightAisle === true;
  const leadingTracks = (hasSideTrack ? 1 : 0) + (hasLeftAisle ? 1 : 0);
  const leftAisleTrack = hasLeftAisle ? (hasSideTrack ? 2 : 1) : undefined;

  /** Physical CSS grid line for a logical seat column (0-based). */
  const seatColumn = (logical: number): number => {
    if (!hasAisles) return leadingTracks + logical + 1;
    // One spacer track precedes every column after the first.
    return leadingTracks + logical * 2 + 1;
  };

  /** gridTemplateColumns: seat tracks (auto) with aisle spacer tracks between. */
  const buildTemplateColumns = (): string[] => {
    const tracks: string[] = [];
    if (hasSideTrack) tracks.push("auto");
    if (hasLeftAisle) tracks.push("minmax(24px, auto)");
    if (hasAisles) {
      tracks.push(
        ...Array.from({ length: layout.cols }, (_, c) => [
          "auto",
          ...(c < layout.cols - 1 ? [`${layout.gaps![c]}px`] : []),
        ]).flat(),
      );
    } else {
      const trackCount = Math.max(layout.cols, ...rows.map((r) => r.length));
      tracks.push(...Array.from({ length: trackCount }, () => "auto"));
    }
    if (hasRightAisle) tracks.push("24px");
    return tracks;
  };

  const templateColumns = buildTemplateColumns();
  const rightAisleTrack = hasRightAisle ? templateColumns.length : undefined;

  const hasDoorWalkway = layout.doorWalkway === true;

  /** Row index offset:
   * - If doorWalkway is true: door is row 1, walkway is row 2, seats start at row 3 (offset = 2).
   * - Else if doorColumn is defined: door is row 1, seats start at row 2 (offset = 1).
   * - Otherwise seats start at row 1 (offset = 0).
   */
  const rowOffset = layout.doorColumn !== undefined ? (hasDoorWalkway ? 2 : 1) : 0;

  const flat: { cell: GridCell; row: number; col: number; rowSpan: number; colSpan: number }[] = [];
  let key = 0;
  for (let r = 0; r < rows.length; r++) {
    const isSoloRow = rows[r].length === 1;
    let logical = 0;
    for (const cell of rows[r]) {
      const isSoloCorridor =
        cell.type === "corridor" && isSoloRow && (cell as SpecialCell).colSpan === undefined;
      const rowSpan = cell.type === "printer" ? (cell.rowSpan ?? 1) : 1;
      const colSpan = (cell as SpecialCell).colSpan ?? 1;
      const startCol = isSoloCorridor ? seatColumn(0) : seatColumn(logical);
      const physicalSpan = isSoloCorridor
        ? seatColumn(layout.cols - 1) + 1 - startCol
        : hasAisles
        ? seatColumn(logical + colSpan - 1) - startCol + 1
        : colSpan;

      // With row aisles each boundary gets its own spacer row: data rows sit
      // on grid lines 1, 3, 5… (stored 0-based, +1 at render time).
      flat.push({
        cell,
        row: (hasRowAisles ? r * 2 : r) + rowOffset,
        col: startCol,
        rowSpan,
        colSpan: physicalSpan,
      });
      logical += colSpan;
    }
  }

  const doorCol =
    layout.doorColumn !== undefined ? seatColumn(layout.doorColumn - 1) : undefined;

  const rowSpacers =
    layout.rowGaps === undefined
      ? []
      : layout.rowGaps.map((h, r) => ({
          gridRow: r * 2 + 2 + rowOffset,
          gridColumn: "1 / -1",
          height: h,
        }));

  const totalGridRows = Math.max(
    ...flat.map((f) => f.row + f.rowSpan),
    layout.doorColumn !== undefined ? 1 : 0,
    layout.topWhiteboardCols !== undefined ? 1 : 0,
    (layout.sidePrinterRow ?? 0) + (layout.sidePrinterRowSpan ?? 1) - 1,
    layout.sideDoorRow ?? 0,
    layout.sideWhiteboardRow ?? 0,
  );

  return (
    <div
      style={{
        position: "relative",
        overflowX: "auto",
        padding: "12px 0 6px",
      }}
    >
      <div
        style={{
          display: "grid",
          width: "max-content",
          margin: "0 auto",
          gridTemplateColumns: templateColumns.join(" "),
          gridTemplateRows: `repeat(${totalGridRows}, auto)`,
          columnGap: hasAisles ? 0 : sizes.gap,
          rowGap: hasRowAisles ? 0 : sizes.gap,
        }}
      >
        {doorCol !== undefined && (
          <div
            style={{
              gridRow: 1,
              gridColumn: doorCol,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              width: "100%",
              paddingBottom: 0,
              ...(hasDoorWalkway ? { marginBottom: -(hasRowAisles ? 0 : sizes.gap) } : {}),
            }}
          >
            <span
              style={{
                ...DOOR_STYLE,
                width: "100%",
                minWidth: sizes.seat,
                minHeight: 40,
                boxSizing: "border-box",
                justifyContent: "center",
                ...(layout.doorOpen === "down" ? { borderBottom: "4px solid var(--ncu-ink)" } : {}),
                ...(layout.doorOpen === "left" ? { borderLeft: "4px solid var(--ncu-ink)" } : {}),
                ...(layout.doorOpen === "right" ? { borderRight: "4px solid var(--ncu-ink)" } : {}),
              }}
            >大門</span>
          </div>
        )}
        {layout.topWhiteboardCols !== undefined && (
          <div
            key="top-whiteboard"
            style={{
              gridRow: 1,
              gridColumn: `${seatColumn(layout.topWhiteboardCols[0] - 1)} / ${seatColumn(layout.topWhiteboardCols[1] - 1) + 1}`,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              width: "100%",
              marginBottom: -(hasRowAisles ? 0 : sizes.gap),
            }}
          >
            <span
              style={{
                ...SPECIAL_STYLES.whiteboard,
                width: "100%",
                minHeight: 40,
                boxSizing: "border-box",
              }}
            >
              白板
            </span>
          </div>
        )}
        {hasDoorWalkway && (
          <div
            key="door-walkway"
            style={{
              gridRow: 2,
              gridColumn: "1 / -1",
              height: 22,
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
        )}
        {rowSpacers.map((s, i) =>
          s.height >= 12 ? (
            <div
              key={`spacer-${i}`}
              style={{
                gridRow: s.gridRow,
                gridColumn: "1 / -1",
                height: s.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 6,
                color: "var(--ncu-muted)",
                borderTop: "1px dashed var(--ncu-border)",
                borderBottom: "1px dashed var(--ncu-border)",
              }}
            >
              走道
            </div>
          ) : (
            <div
              key={`spacer-${i}`}
              style={{ gridRow: s.gridRow, gridColumn: "1 / -1", height: s.height }}
            />
          ),
        )}
        {/* Vertical aisle dividers (209/310/313): dashed frame lines along desk-separation walkways */}
        {hasAisles &&
          layout
            .gaps!.map((g, i) => (g >= 12 ? leadingTracks + i * 2 + 2 : -1))
            .filter((l) => l > 0)
            .map((line) => (
              <div
                key={`aisle-${line}`}
                style={{
                  gridColumn: line,
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
            ))}
        {/* Outer Left vertical aisle (919) */}
        {leftAisleTrack !== undefined && (
          <div
            key="left-aisle"
            style={{
              gridColumn: leftAisleTrack,
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
        )}
        {/* Outer Right vertical aisle (919) */}
        {rightAisleTrack !== undefined && (
          <div
            key="right-aisle"
            style={{
              gridColumn: rightAisleTrack,
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
        )}
        {/* Side wall door (e.g. 919 on the left of left aisle) */}
        {hasSideDoor && (
          <div
            key="side-door"
            style={{
              gridRow: layout.sideDoorRow,
              gridColumn: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              alignSelf: "stretch",
            }}
          >
            <span
              style={{
                ...DOOR_STYLE,
                minHeight: sizes.height ?? 52,
                boxSizing: "border-box",
                justifyContent: "center",
                borderRight: "4px solid var(--ncu-ink)",
              }}
            >大門</span>
          </div>
        )}
        {/* Side wall whiteboard (e.g. 919 to the left of 1-2's walkway) */}
        {layout.sideWhiteboardRow !== undefined && (
          <div
            key="side-whiteboard"
            style={{
              gridRow: layout.sideWhiteboardRow,
              gridColumn: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "stretch",
              ...SPECIAL_STYLES.whiteboard,
              writingMode: "vertical-rl",
              letterSpacing: 4,
              minHeight: 52,
            }}
          >
            白板
          </div>
        )}
        {/* Side wall printer (e.g. 919 to the left of 1-3~1-5) */}
        {layout.sidePrinterRow !== undefined && (
          <div
            key="side-printer"
            style={{
              gridRow: `${layout.sidePrinterRow} / span ${layout.sidePrinterRowSpan ?? 3}`,
              gridColumn: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "stretch",
              ...SPECIAL_STYLES.printer,
              writingMode: "vertical-rl",
              letterSpacing: 3,
              minHeight: 52,
            }}
          >
            印表機
          </div>
        )}
        {flat.map(({ cell, row, col, rowSpan, colSpan }) => {
          const base: React.CSSProperties = {
            gridRow: rowSpan > 1 ? `${row + 1} / span ${rowSpan}` : row + 1,
            gridColumn: colSpan > 1 ? `${col} / span ${colSpan}` : col,
            ...(rowSpan > 1 ? { alignSelf: "stretch" } : {}),
          };

          const itemStyle = base;

          if (cell.type === "printer") {
            return (
              <div
                key={key++}
                style={{
                  ...itemStyle,
                  ...SPECIAL_STYLES.printer,
                  ...(rowSpan > 1 ? { writingMode: "vertical-rl", letterSpacing: 3, minHeight: 52 } : {}),
                  marginBottom: -(hasRowAisles ? 0 : sizes.gap),
                }}
              >
                {cell.label}
              </div>
            );
          }

          if (cell.type === "sofa") {
            return (
              <div
                key={key++}
                style={{
                  ...itemStyle,
                  ...SPECIAL_STYLES.sofa,
                  marginBottom: -(hasRowAisles ? 0 : sizes.gap),
                }}
              >
                {cell.label}
              </div>
            );
          }

          if (cell.type === "whiteboard") {
            return (
              <div
                key={key++}
                style={{
                  ...itemStyle,
                  ...SPECIAL_STYLES.whiteboard,
                  minHeight: 44,
                  boxSizing: "border-box",
                  marginBottom: -(hasRowAisles ? 0 : sizes.gap),
                }}
              >
                {cell.label}
              </div>
            );
          }

          if (cell.type === "seat") {
            const vacant = !cell.occupant;
            return (
              <div key={key++} style={{ ...itemStyle, ...getSeatStyle(sizes, vacant) }}>
                <span style={{ fontSize: sizes.code, fontWeight: 800, opacity: 0.65, lineHeight: 1 }}>
                  {cell.label}
                </span>
                <span>{vacant ? "空" : cell.occupant}</span>
              </div>
            );
          }

          if (cell.type === "empty") {
            return null;
          }

          if (cell.type === "door") {
            const side = layout.doorOpen ?? "down";
            const isHorizontal = side === "down";
            return (
              <div
                key={key++}
                style={{
                  ...itemStyle,
                  display: "flex",
                  flexDirection: isHorizontal ? "column" : "row",
                  alignItems: "flex-end",
                  justifyContent: side === "right" ? "flex-end" : side === "left" ? "flex-start" : "center",
                  gap: 0,
                  marginBottom: -(hasRowAisles ? 0 : sizes.gap),
                }}
              >
                <span
                  style={{
                    ...DOOR_STYLE,
                    width: "100%",
                    minWidth: sizes.seat,
                    minHeight: 44,
                    boxSizing: "border-box",
                    justifyContent: "center",
                    ...(side === "right" ? { borderRight: "4px solid var(--ncu-ink)" } : {}),
                    ...(side === "left" ? { borderLeft: "4px solid var(--ncu-ink)" } : {}),
                    ...(side === "down" ? { borderBottom: "4px solid var(--ncu-ink)" } : {}),
                  }}
                >大門</span>
              </div>
            );
          }

          return (
            <div key={key++} style={{ ...itemStyle, ...SPECIAL_STYLES[cell.type] }}>
              {cell.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Existing sub-components
// ---------------------------------------------------------------------------

const RoomCard = ({ layout }: Readonly<{ layout: RoomLayout }>) => (
  <IonCard
    style={{
      margin: 0,
      border: "2px solid var(--ncu-ink)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader>
      <IonCardTitle>{layout.name}</IonCardTitle>
    </IonCardHeader>

    <IonCardContent>
      <SeatGrid layout={layout} />
    </IonCardContent>
  </IonCard>
);

const SeatsHeader = () => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/" text="" />
      </IonButtons>
      <IonTitle>研究室座位表</IonTitle>
    </IonToolbar>
  </IonHeader>
);

const SeatsBody = ({
  selectedRoom,
  currentLayout,
  onSelectRoom,
}: Readonly<{
  selectedRoom: string;
  currentLayout?: RoomLayout;
  onSelectRoom: (roomId: string) => void;
}>) => (
  <IonContent className="ion-padding">
    <IonSegment
      value={selectedRoom}
      onIonChange={(e) => onSelectRoom(e.detail.value as string)}
      scrollable
    >
      {ROOM_LAYOUTS.map((room) => (
        <IonSegmentButton key={room.id} value={room.id}>
          {room.id}
        </IonSegmentButton>
      ))}
    </IonSegment>

    <div style={{ marginTop: "var(--ncu-space-4)" }}>
      {currentLayout && <RoomCard layout={currentLayout} />}
    </div>
  </IonContent>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SeatsPage = () => {
  const [selectedRoom, setSelectedRoom] = useState("209");
  const currentLayout = ROOM_LAYOUTS.find((r) => r.id === selectedRoom);

  return (
    <IonPage>
      <SeatsHeader />
      <SeatsBody
        selectedRoom={selectedRoom}
        currentLayout={currentLayout}
        onSelectRoom={setSelectedRoom}
      />
    </IonPage>
  );
};

export default SeatsPage;
