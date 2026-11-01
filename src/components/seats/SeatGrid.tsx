import type React from "react";
import type { RoomLayout } from "../../data/room-layouts";
import { getSeatSizes, type SeatSizes } from "./seat-styles";
import {
  resolveFont,
  resolveLeftAisleTrack,
  resolveRowOffset,
  resolveSeatColumn,
  resolveLayoutFlags,
  buildTemplateColumns,
  buildFlatItems,
  resolveTotalGridRows,
} from "./seat-layout-math";
import {
  GridCellElement,
  TopDoorElement,
  TopWhiteboardElement,
  SideDoorElement,
  SideWhiteboardElement,
  SidePrinterElement,
} from "./SeatGridCells";
import {
  HorizontalWalkway,
  RowGapSpacer,
  VerticalAisleTrack,
} from "./AisleTrack";

export const SeatGrid = ({ layout }: Readonly<{ layout: RoomLayout }>) => {
  const baseSizes = getSeatSizes(layout.cols);
  const seatW = layout.seatWidth ?? baseSizes.seat;
  const seatH = layout.seatHeight ?? 52;
  const font = resolveFont(seatW);
  const sizes: SeatSizes = { ...baseSizes, seat: seatW, height: seatH, name: font.name, code: font.code };

  const flags = resolveLayoutFlags(layout);
  const leftAisleTrack = resolveLeftAisleTrack(flags.hasLeftAisle, flags.hasSideTrack);

  const seatColumn = (logical: number): number =>
    resolveSeatColumn(logical, flags.hasAisles, flags.leadingTracks);

  const templateColumns = buildTemplateColumns(layout, flags);

  const rightAisleTrack = flags.hasRightAisle ? templateColumns.length : undefined;
  const hasDoorWalkway = layout.doorWalkway === true;
  const rowOffset = resolveRowOffset(layout.doorColumn, hasDoorWalkway);

  const flat = buildFlatItems(layout, flags.hasAisles, flags.hasRowAisles, rowOffset, seatColumn);
  const doorCol = layout.doorColumn !== undefined ? seatColumn(layout.doorColumn - 1) : undefined;

  const rowSpacers = (layout.rowGaps ?? []).map((h, r) => ({
    keyId: `spacer-row-${r * 2 + 2 + rowOffset}`,
    gridRow: r * 2 + 2 + rowOffset,
    height: h,
  }));

  const totalGridRows = resolveTotalGridRows(flat, layout);

  const verticalAisleLines = (layout.gaps ?? [])
    .map((g, i) => (g >= 12 ? flags.leadingTracks + i * 2 + 2 : -1))
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
          columnGap: flags.hasAisles ? 0 : sizes.gap,
          rowGap: flags.hasRowAisles ? 0 : sizes.gap,
        }}
      >
        {doorCol !== undefined && (
          <TopDoorElement
            doorCol={doorCol}
            sizes={sizes}
            doorOpen={layout.doorOpen}
            hasDoorWalkway={hasDoorWalkway}
            hasRowAisles={flags.hasRowAisles}
          />
        )}
        {layout.topWhiteboardCols !== undefined && (
          <TopWhiteboardElement
            key="top-whiteboard"
            colStart={seatColumn(layout.topWhiteboardCols[0] - 1)}
            colEnd={seatColumn(layout.topWhiteboardCols[1] - 1)}
            hasRowAisles={flags.hasRowAisles}
            gap={sizes.gap}
          />
        )}
        {hasDoorWalkway && (
          <HorizontalWalkway key="door-walkway" gridRow={2} height={22} />
        )}
        {rowSpacers.map((s) => (
          <RowGapSpacer key={s.keyId} gridRow={s.gridRow} height={s.height} />
        ))}
        {/* Vertical aisle dividers (209/310/313): dashed frame lines along desk-separation walkways */}
        {flags.hasAisles &&
          verticalAisleLines.map((colTrack) => (
            <VerticalAisleTrack
              key={`aisle-col-${colTrack}`}
              colTrack={colTrack}
              rowOffset={rowOffset}
              totalGridRows={totalGridRows}
            />
          ))}
        {/* Outer Left vertical aisle (310) */}
        {leftAisleTrack !== undefined && (
          <VerticalAisleTrack
            key="left-aisle"
            colTrack={leftAisleTrack}
            rowOffset={rowOffset}
            totalGridRows={totalGridRows}
          />
        )}
        {/* Outer Right vertical aisle */}
        {rightAisleTrack !== undefined && (
          <VerticalAisleTrack
            key="right-aisle"
            colTrack={rightAisleTrack}
            rowOffset={rowOffset}
            totalGridRows={totalGridRows}
          />
        )}
        {/* Side wall door */}
        {flags.hasSideDoor && layout.sideDoorRow !== undefined && (
          <SideDoorElement
            key="side-door"
            sideDoorRow={layout.sideDoorRow}
            minHeight={sizes.height ?? 52}
          />
        )}
        {/* Side wall whiteboard */}
        {layout.sideWhiteboardRow !== undefined && (
          <SideWhiteboardElement
            key="side-whiteboard"
            sideWhiteboardRow={layout.sideWhiteboardRow}
          />
        )}
        {/* Side wall printer */}
        {layout.sidePrinterRow !== undefined && (
          <SidePrinterElement
            key="side-printer"
            sidePrinterRow={layout.sidePrinterRow}
            rowSpan={layout.sidePrinterRowSpan ?? 3}
          />
        )}
        {flat.map((item) => (
          <GridCellElement
            key={item.id}
            item={item}
            sizes={sizes}
            layout={layout}
            hasRowAisles={flags.hasRowAisles}
          />
        ))}
      </div>
    </div>
  );
};

export default SeatGrid;
