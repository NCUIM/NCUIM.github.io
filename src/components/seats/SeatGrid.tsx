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

import {
  type FlatCellItem,
  resolveFont,
  resolveLeftAisleTrack,
  resolveRowOffset,
  resolveSeatColumn,
  buildTemplateColumns,
  buildFlatItems,
  resolveTotalGridRows,
  resolveDoorJustify,
} from "./seat-layout-math";

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

const PrinterCellElement = ({
  cell,
  rowSpan,
  sizes,
  hasRowAisles,
  itemStyle,
}: Readonly<{
  cell: SpecialCell;
  rowSpan: number;
  sizes: SeatSizes;
  hasRowAisles: boolean;
  itemStyle: React.CSSProperties;
}>) => (
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

const SpecialBlockCell = ({
  type,
  label,
  sizes,
  hasRowAisles,
  itemStyle,
}: Readonly<{
  type: "sofa" | "whiteboard";
  label?: string;
  sizes: SeatSizes;
  hasRowAisles: boolean;
  itemStyle: React.CSSProperties;
}>) => (
  <div
    style={{
      ...itemStyle,
      ...SPECIAL_STYLES[type],
      ...(type === "whiteboard" ? { minHeight: 44, boxSizing: "border-box" } : {}),
      marginBottom: -(hasRowAisles ? 0 : sizes.gap),
    }}
  >
    {label}
  </div>
);

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

  switch (cell.type) {
    case "empty":
      return null;
    case "seat":
      return <SeatCellElement cell={cell} sizes={sizes} layoutId={layout.id} itemStyle={itemStyle} />;
    case "door":
      return (
        <DoorCellElement
          cell={cell}
          sizes={sizes}
          doorOpen={layout.doorOpen}
          hasRowAisles={hasRowAisles}
          itemStyle={itemStyle}
        />
      );
    case "printer":
      return (
        <PrinterCellElement
          cell={cell}
          rowSpan={rowSpan}
          sizes={sizes}
          hasRowAisles={hasRowAisles}
          itemStyle={itemStyle}
        />
      );
    case "sofa":
    case "whiteboard":
      return (
        <SpecialBlockCell
          type={cell.type}
          label={cell.label}
          sizes={sizes}
          hasRowAisles={hasRowAisles}
          itemStyle={itemStyle}
        />
      );
    default:
      return (
        <div style={{ ...itemStyle, ...SPECIAL_STYLES[cell.type] }}>
          {cell.label}
        </div>
      );
  }
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
