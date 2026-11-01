import type React from "react";
import type { RoomLayout, GridCell, SpecialCell } from "../../data/room-layouts";
import seatAssignments from "../../data/seats.json";
import {
  getSeatStyle,
  SPECIAL_STYLES,
  DOOR_STYLE,
  type SeatSizes,
} from "./seat-styles";
import {
  type FlatCellItem,
  resolveDoorJustify,
} from "./seat-layout-math";

// ---------------------------------------------------------------------------
// Dedicated Cell Renderers
// ---------------------------------------------------------------------------

export const SeatCellElement = ({
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

export type DoorCell = SpecialCell & { readonly type: "door" };
export type PrinterCell = SpecialCell & { readonly type: "printer" };

export const DoorCellElement = ({
  cell,
  sizes,
  doorOpen,
  hasRowAisles,
  itemStyle,
}: Readonly<{
  cell: DoorCell;
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

export const PrinterCellElement = ({
  cell,
  rowSpan,
  sizes,
  hasRowAisles,
  itemStyle,
}: Readonly<{
  cell: PrinterCell;
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

export const SpecialBlockCell = ({
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

export const GridCellElement = ({
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
          cell={cell as DoorCell}
          sizes={sizes}
          doorOpen={layout.doorOpen}
          hasRowAisles={hasRowAisles}
          itemStyle={itemStyle}
        />
      );
    case "printer":
      return (
        <PrinterCellElement
          cell={cell as PrinterCell}
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
// Room Boundary Facility Elements (Top / Side Wall)
// ---------------------------------------------------------------------------

export const TopDoorElement = ({
  doorCol,
  sizes,
  doorOpen,
  hasDoorWalkway,
  hasRowAisles,
}: Readonly<{
  doorCol: number;
  sizes: SeatSizes;
  doorOpen?: "down" | "left" | "right";
  hasDoorWalkway: boolean;
  hasRowAisles: boolean;
}>) => (
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
        ...(doorOpen === "down" ? { borderBottom: "4px solid var(--ncu-ink)" } : {}),
        ...(doorOpen === "left" ? { borderLeft: "4px solid var(--ncu-ink)" } : {}),
        ...(doorOpen === "right" ? { borderRight: "4px solid var(--ncu-ink)" } : {}),
      }}
    >
      門
    </span>
  </div>
);

export const TopWhiteboardElement = ({
  colStart,
  colEnd,
  hasRowAisles,
  gap,
}: Readonly<{
  colStart: number;
  colEnd: number;
  hasRowAisles: boolean;
  gap: number;
}>) => (
  <div
    style={{
      gridRow: 1,
      gridColumn: `${colStart} / ${colEnd + 1}`,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      width: "100%",
      marginBottom: -(hasRowAisles ? 0 : gap),
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
);

export const SideDoorElement = ({
  sideDoorRow,
  minHeight = 52,
}: Readonly<{
  sideDoorRow: number;
  minHeight?: number;
}>) => (
  <div
    style={{
      gridRow: sideDoorRow,
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
        minHeight,
        boxSizing: "border-box",
        justifyContent: "center",
        borderRight: "4px solid var(--ncu-ink)",
      }}
    >
      門
    </span>
  </div>
);

export const SideWhiteboardElement = ({
  sideWhiteboardRow,
}: Readonly<{
  sideWhiteboardRow: number;
}>) => (
  <div
    style={{
      gridRow: sideWhiteboardRow,
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
);

export const SidePrinterElement = ({
  sidePrinterRow,
  rowSpan = 3,
}: Readonly<{
  sidePrinterRow: number;
  rowSpan?: number;
}>) => (
  <div
    style={{
      gridRow: `${sidePrinterRow} / span ${rowSpan}`,
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
);
