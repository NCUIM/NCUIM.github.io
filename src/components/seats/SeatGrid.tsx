import type React from "react";
import type { RoomLayout, GridCell, SpecialCell } from "../../data/room-layouts";
import seatAssignments from "../../data/seats.json";
import {
  getSeatSizes,
  getSeatStyle,
  SPECIAL_STYLES,
  DOOR_STYLE,
  type SeatSizes,
} from "./seat-styles";

interface FlatCellItem {
  readonly id: string;
  readonly cell: GridCell;
  readonly row: number;
  readonly col: number;
  readonly rowSpan: number;
  readonly colSpan: number;
}

// ---------------------------------------------------------------------------
// Pure helper functions (Zero cognitive complexity in main component)
// ---------------------------------------------------------------------------

const resolveFont = (seatW: number) => {
  if (seatW >= 54) return { name: 13, code: 9 };
  if (seatW >= 44) return { name: 12, code: 8 };
  return { name: 10, code: 8 };
};

const resolveLeftAisleTrack = (hasLeftAisle: boolean, hasSideTrack: boolean): number | undefined => {
  if (!hasLeftAisle) return undefined;
  return hasSideTrack ? 2 : 1;
};

const resolveRowOffset = (doorColumn?: number, hasDoorWalkway?: boolean): number => {
  if (doorColumn === undefined) return 0;
  return hasDoorWalkway ? 2 : 1;
};

const resolveSeatColumn = (logical: number, hasAisles: boolean, leadingTracks: number): number => {
  if (!hasAisles) return leadingTracks + logical + 1;
  return leadingTracks + logical * 2 + 1;
};

const resolvePhysicalSpan = (
  isSoloCorridor: boolean,
  hasAisles: boolean,
  logical: number,
  colSpan: number,
  seatColumn: (col: number) => number,
  totalCols: number,
): number => {
  if (isSoloCorridor) {
    return seatColumn(totalCols - 1) + 1 - seatColumn(0);
  }
  if (hasAisles) {
    return seatColumn(logical + colSpan - 1) - seatColumn(logical) + 1;
  }
  return colSpan;
};

const buildTemplateColumns = (
  layout: RoomLayout,
  hasSideTrack: boolean,
  hasLeftAisle: boolean,
  hasAisles: boolean,
  hasRightAisle: boolean,
): string[] => {
  const tracks: string[] = [];
  if (hasSideTrack) tracks.push("auto");
  if (hasLeftAisle) tracks.push("minmax(24px, auto)");

  if (hasAisles && layout.gaps) {
    for (let c = 0; c < layout.cols; c++) {
      tracks.push("auto");
      if (c < layout.cols - 1) {
        tracks.push(`${layout.gaps[c]}px`);
      }
    }
  } else {
    const trackCount = Math.max(layout.cols, ...layout.rows.map((r) => r.length));
    for (let c = 0; c < trackCount; c++) {
      tracks.push("auto");
    }
  }

  if (hasRightAisle) tracks.push("24px");
  return tracks;
};

const buildFlatItems = (
  layout: RoomLayout,
  hasAisles: boolean,
  hasRowAisles: boolean,
  rowOffset: number,
  seatColumn: (col: number) => number,
): FlatCellItem[] => {
  const flat: FlatCellItem[] = [];
  const rows = layout.rows;

  for (let r = 0; r < rows.length; r++) {
    const isSoloRow = rows[r].length === 1;
    let logical = 0;

    for (let cIdx = 0; cIdx < rows[r].length; cIdx++) {
      const cell = rows[r][cIdx];
      const isSoloCorridor =
        cell.type === "corridor" && isSoloRow && (cell as SpecialCell).colSpan === undefined;
      const rowSpan = cell.type === "printer" ? (cell.rowSpan ?? 1) : 1;
      const colSpan = (cell as SpecialCell).colSpan ?? 1;
      const startCol = isSoloCorridor ? seatColumn(0) : seatColumn(logical);
      const physicalSpan = resolvePhysicalSpan(
        isSoloCorridor,
        hasAisles,
        logical,
        colSpan,
        seatColumn,
        layout.cols,
      );

      const cellId = cell.type === "seat" ? `seat-${cell.label}` : `special-${r}-${cIdx}-${cell.type}`;
      flat.push({
        id: cellId,
        cell,
        row: (hasRowAisles ? r * 2 : r) + rowOffset,
        col: startCol,
        rowSpan,
        colSpan: physicalSpan,
      });
      logical += colSpan;
    }
  }

  return flat;
};

const resolveTotalGridRows = (flat: readonly FlatCellItem[], layout: RoomLayout): number => {
  return Math.max(
    ...flat.map((f) => f.row + f.rowSpan),
    layout.doorColumn !== undefined ? 1 : 0,
    layout.topWhiteboardCols !== undefined ? 1 : 0,
    (layout.sidePrinterRow ?? 0) + (layout.sidePrinterRowSpan ?? 1) - 1,
    layout.sideDoorRow ?? 0,
    layout.sideWhiteboardRow ?? 0,
  );
};

const resolveDoorJustify = (side: "down" | "left" | "right") => {
  if (side === "right") return "flex-end";
  if (side === "left") return "flex-start";
  return "center";
};

// ---------------------------------------------------------------------------
// Dedicated Cell Renderers
// ---------------------------------------------------------------------------

const SeatCellElement = ({
  cell,
  sizes,
  layoutId,
  itemStyle,
}: Readonly<{
  cell: Extract<GridCell, { type: "seat" }>;
  sizes: SeatSizes;
  layoutId: string;
  itemStyle: React.CSSProperties;
}>) => {
  const occupant =
    (seatAssignments as Record<string, Record<string, string>>)[layoutId]?.[cell.label] ??
    cell.occupant;
  const vacant = !occupant;

  return (
    <div style={{ ...itemStyle, ...getSeatStyle(sizes, vacant) }}>
      <span style={{ fontSize: sizes.code, fontWeight: 800, opacity: 0.65, lineHeight: 1 }}>
        {cell.label}
      </span>
      <span>{vacant ? "空" : occupant}</span>
    </div>
  );
};

const DoorCellElement = ({
  cell,
  sizes,
  doorOpen,
  hasRowAisles,
  itemStyle,
}: Readonly<{
  cell: SpecialCell;
  sizes: SeatSizes;
  doorOpen?: "down" | "left" | "right";
  hasRowAisles: boolean;
  itemStyle: React.CSSProperties;
}>) => {
  const side = doorOpen ?? "down";
  const isHorizontal = side === "down";

  return (
    <div
      style={{
        ...itemStyle,
        display: "flex",
        flexDirection: isHorizontal ? "column" : "row",
        alignItems: "flex-end",
        justifyContent: resolveDoorJustify(side),
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
      >
        {cell.label ?? "門"}
      </span>
    </div>
  );
};

const GridCellElement = ({
  item,
  sizes,
  layout,
  hasRowAisles,
}: Readonly<{
  item: FlatCellItem;
  sizes: SeatSizes;
  layout: RoomLayout;
  hasRowAisles: boolean;
}>) => {
  const { cell, row, col, rowSpan, colSpan } = item;
  const itemStyle: React.CSSProperties = {
    gridRow: rowSpan > 1 ? `${row + 1} / span ${rowSpan}` : row + 1,
    gridColumn: colSpan > 1 ? `${col} / span ${colSpan}` : col,
    ...(rowSpan > 1 ? { alignSelf: "stretch" } : {}),
  };

  if (cell.type === "empty") {
    return null;
  }

  if (cell.type === "seat") {
    return <SeatCellElement cell={cell} sizes={sizes} layoutId={layout.id} itemStyle={itemStyle} />;
  }

  if (cell.type === "door") {
    return (
      <DoorCellElement
        cell={cell}
        sizes={sizes}
        doorOpen={layout.doorOpen}
        hasRowAisles={hasRowAisles}
        itemStyle={itemStyle}
      />
    );
  }

  if (cell.type === "printer") {
    return (
      <div
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

  return (
    <div style={{ ...itemStyle, ...SPECIAL_STYLES[cell.type] }}>
      {cell.label}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeatGrid = ({ layout }: Readonly<{ layout: RoomLayout }>) => {
  const baseSizes = getSeatSizes(layout.cols);
  const seatW = layout.seatWidth ?? baseSizes.seat;
  const seatH = layout.seatHeight ?? 52;
  const font = resolveFont(seatW);
  const sizes: SeatSizes = { ...baseSizes, seat: seatW, height: seatH, name: font.name, code: font.code };

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
  const leftAisleTrack = resolveLeftAisleTrack(hasLeftAisle, hasSideTrack);

  const seatColumn = (logical: number): number =>
    resolveSeatColumn(logical, hasAisles, leadingTracks);

  const templateColumns = buildTemplateColumns(
    layout,
    hasSideTrack,
    hasLeftAisle,
    hasAisles,
    hasRightAisle,
  );

  const rightAisleTrack = hasRightAisle ? templateColumns.length : undefined;
  const hasDoorWalkway = layout.doorWalkway === true;
  const rowOffset = resolveRowOffset(layout.doorColumn, hasDoorWalkway);

  const flat = buildFlatItems(layout, hasAisles, hasRowAisles, rowOffset, seatColumn);
  const doorCol = layout.doorColumn !== undefined ? seatColumn(layout.doorColumn - 1) : undefined;

  const rowSpacers = (layout.rowGaps ?? []).map((h, r) => ({
    keyId: `spacer-row-${r * 2 + 2 + rowOffset}`,
    gridRow: r * 2 + 2 + rowOffset,
    height: h,
  }));

  const totalGridRows = resolveTotalGridRows(flat, layout);

  const verticalAisleLines = (layout.gaps ?? [])
    .map((g, i) => (g >= 12 ? leadingTracks + i * 2 + 2 : -1))
    .filter((l) => l > 0);

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
            >
              門
            </span>
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
        {rowSpacers.map((s) =>
          s.height >= 12 ? (
            <div
              key={s.keyId}
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
              key={s.keyId}
              style={{ gridRow: s.gridRow, gridColumn: "1 / -1", height: s.height }}
            />
          ),
        )}
        {/* Vertical aisle dividers (209/310/313): dashed frame lines along desk-separation walkways */}
        {hasAisles &&
          verticalAisleLines.map((colTrack) => (
            <div
              key={`aisle-col-${colTrack}`}
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
          ))}
        {/* Outer Left vertical aisle (310) */}
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
        {/* Outer Right vertical aisle */}
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
        {/* Side wall door */}
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
            >
              門
            </span>
          </div>
        )}
        {/* Side wall whiteboard */}
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
        {/* Side wall printer */}
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
        {flat.map((item) => (
          <GridCellElement
            key={item.id}
            item={item}
            sizes={sizes}
            layout={layout}
            hasRowAisles={hasRowAisles}
          />
        ))}
      </div>
    </div>
  );
};

export default SeatGrid;
