import type { RoomLayout, GridCell, SpecialCell } from "../../data/room-layouts";

export interface FlatCellItem {
  readonly id: string;
  readonly cell: GridCell;
  readonly row: number;
  readonly col: number;
  readonly rowSpan: number;
  readonly colSpan: number;
}

export const resolveFont = (seatW: number): { name: number; code: number } => {
  if (seatW >= 54) return { name: 13, code: 9 };
  if (seatW >= 44) return { name: 12, code: 8 };
  return { name: 10, code: 8 };
};

export const resolveLeftAisleTrack = (
  hasLeftAisle: boolean,
  hasSideTrack: boolean
): number | undefined => {
  if (!hasLeftAisle) return undefined;
  return hasSideTrack ? 2 : 1;
};

export const resolveRowOffset = (
  doorColumn?: number,
  hasDoorWalkway?: boolean
): number => {
  if (doorColumn === undefined) return 0;
  return hasDoorWalkway ? 2 : 1;
};

export const resolveSeatColumn = (
  logical: number,
  hasAisles: boolean,
  leadingTracks: number
): number => {
  if (!hasAisles) return leadingTracks + logical + 1;
  return leadingTracks + logical * 2 + 1;
};

export const resolvePhysicalSpan = (
  isSoloCorridor: boolean,
  hasAisles: boolean,
  logical: number,
  colSpan: number,
  seatColumn: (col: number) => number,
  totalCols: number
): number => {
  if (isSoloCorridor) {
    return seatColumn(totalCols - 1) + 1 - seatColumn(0);
  }
  if (hasAisles) {
    return seatColumn(logical + colSpan - 1) - seatColumn(logical) + 1;
  }
  return colSpan;
};

export interface SeatLayoutFlags {
  readonly hasAisles: boolean;
  readonly hasRowAisles: boolean;
  readonly hasSideTrack: boolean;
  readonly hasSideDoor: boolean;
  readonly hasLeftAisle: boolean;
  readonly hasRightAisle: boolean;
  readonly leadingTracks: number;
}

export const resolveLayoutFlags = (layout: RoomLayout): SeatLayoutFlags => {
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

  return {
    hasAisles,
    hasRowAisles,
    hasSideTrack,
    hasSideDoor,
    hasLeftAisle,
    hasRightAisle,
    leadingTracks,
  };
};

export const buildTemplateColumns = (
  layout: RoomLayout,
  flags?: SeatLayoutFlags
): string[] => {
  const resolved = flags ?? resolveLayoutFlags(layout);
  const tracks: string[] = [];
  if (resolved.hasSideTrack) tracks.push("auto");
  if (resolved.hasLeftAisle) tracks.push("minmax(24px, auto)");

  if (resolved.hasAisles && layout.gaps) {
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

  if (resolved.hasRightAisle) tracks.push("24px");
  return tracks;
};

export const buildRowFlatItems = (
  row: readonly GridCell[],
  rowIndex: number,
  layout: RoomLayout,
  hasAisles: boolean,
  hasRowAisles: boolean,
  rowOffset: number,
  seatColumn: (col: number) => number
): FlatCellItem[] => {
  const items: FlatCellItem[] = [];
  const isSoloRow = row.length === 1;
  let logical = 0;

  for (let cIdx = 0; cIdx < row.length; cIdx++) {
    const cell = row[cIdx];
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
      layout.cols
    );

    const cellId =
      cell.type === "seat"
        ? `seat-${cell.label}`
        : `special-${rowIndex}-${cIdx}-${cell.type}`;

    items.push({
      id: cellId,
      cell,
      row: (hasRowAisles ? rowIndex * 2 : rowIndex) + rowOffset,
      col: startCol,
      rowSpan,
      colSpan: physicalSpan,
    });
    logical += colSpan;
  }

  return items;
};

export const buildFlatItems = (
  layout: RoomLayout,
  hasAisles: boolean,
  hasRowAisles: boolean,
  rowOffset: number,
  seatColumn: (col: number) => number
): FlatCellItem[] => {
  const flat: FlatCellItem[] = [];
  for (let r = 0; r < layout.rows.length; r++) {
    const rowItems = buildRowFlatItems(
      layout.rows[r],
      r,
      layout,
      hasAisles,
      hasRowAisles,
      rowOffset,
      seatColumn
    );
    flat.push(...rowItems);
  }
  return flat;
};

export const resolveTotalGridRows = (
  flat: readonly FlatCellItem[],
  layout: RoomLayout
): number => {
  return Math.max(
    ...flat.map((f) => f.row + f.rowSpan),
    layout.doorColumn !== undefined ? 1 : 0,
    layout.topWhiteboardCols !== undefined ? 1 : 0,
    (layout.sidePrinterRow ?? 0) + (layout.sidePrinterRowSpan ?? 1) - 1,
    layout.sideDoorRow ?? 0,
    layout.sideWhiteboardRow ?? 0
  );
};

export const resolveDoorJustify = (side: "down" | "left" | "right"): string => {
  if (side === "right") return "flex-end";
  if (side === "left") return "flex-start";
  return "center";
};
