import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  buildTemplateColumns,
  resolveSeatColumn,
  resolveRowOffset,
  resolvePhysicalSpan,
  resolveDoorJustify,
  resolveFont,
  buildFlatItems,
  resolveTotalGridRows,
  resolveLeftAisleTrack,
} from "../components/seats/seat-layout-math";
import {
  SeatCellElement,
  DoorCellElement,
  PrinterCellElement,
  SpecialBlockCell,
  GridCellElement,
  TopDoorElement,
  TopWhiteboardElement,
  SideDoorElement,
  SideWhiteboardElement,
  SidePrinterElement,
} from "../components/seats/SeatGridCells";
import {
  HorizontalWalkway,
  RowGapSpacer,
  VerticalAisleTrack,
} from "../components/seats/AisleTrack";
import SeatGrid from "../components/seats/SeatGrid";
import { ROOM_LAYOUTS } from "../data/room-layouts";

describe("Seat Layout Math", () => {
  const room209 = ROOM_LAYOUTS.find((r) => r.id === "209")!;
  const room310 = ROOM_LAYOUTS.find((r) => r.id === "310")!;
  const room313 = ROOM_LAYOUTS.find((r) => r.id === "313")!;

  describe("resolveDoorJustify", () => {
    it("returns correct flex alignment for various door orientations", () => {
      expect(resolveDoorJustify("down")).toBe("center");
      expect(resolveDoorJustify("left")).toBe("flex-start");
      expect(resolveDoorJustify("right")).toBe("flex-end");
    });
  });

  describe("resolveFont", () => {
    it("returns smaller font when width < 44 and standard font otherwise", () => {
      expect(resolveFont(40)).toEqual({ name: 10, code: 8 });
      expect(resolveFont(43)).toEqual({ name: 10, code: 8 });
      expect(resolveFont(44)).toEqual({ name: 12, code: 8 });
      expect(resolveFont(56)).toEqual({ name: 13, code: 9 });
    });
  });

  describe("resolveRowOffset", () => {
    it("returns 0 when doorColumn is undefined", () => {
      expect(resolveRowOffset(undefined, false)).toBe(0);
      expect(resolveRowOffset(undefined, true)).toBe(0);
    });

    it("returns 1 when doorColumn is defined without walkway, and 2 with walkway", () => {
      expect(resolveRowOffset(1, false)).toBe(1);
      expect(resolveRowOffset(1, true)).toBe(2);
    });
  });

  describe("resolveSeatColumn & resolveLeftAisleTrack", () => {
    it("calculates 1-based grid column index accounting for aisles and leading tracks", () => {
      // without aisles: logical 0 -> col 1
      expect(resolveSeatColumn(0, false, 0)).toBe(1);
      expect(resolveSeatColumn(2, false, 0)).toBe(3);

      // with aisles and 0 leading tracks
      expect(resolveSeatColumn(0, true, 0)).toBe(1);
      expect(resolveSeatColumn(1, true, 0)).toBe(3);
      expect(resolveSeatColumn(2, true, 0)).toBe(5);

      // with 1 leading track (e.g. side track or left aisle)
      expect(resolveSeatColumn(0, true, 1)).toBe(2);
      expect(resolveSeatColumn(1, true, 1)).toBe(4);
    });

    it("resolves left aisle track index correctly", () => {
      expect(resolveLeftAisleTrack(false, false)).toBeUndefined();
      expect(resolveLeftAisleTrack(true, false)).toBe(1);
      expect(resolveLeftAisleTrack(true, true)).toBe(2);
    });
  });

  describe("resolvePhysicalSpan", () => {
    const dummySeatCol = (logical: number) => logical * 2 + 1;

    it("returns physical span for corridor spanning entire room", () => {
      // isSoloCorridor = true, totalCols = 4 -> seatColumn(3) - seatColumn(0) + 1 = 7
      expect(resolvePhysicalSpan(true, false, 0, 1, dummySeatCol, 4)).toBe(7);
      expect(resolvePhysicalSpan(true, true, 0, 1, dummySeatCol, 4)).toBe(7);
    });

    it("returns 1 for span = 1", () => {
      expect(resolvePhysicalSpan(false, false, 0, 1, dummySeatCol, 4)).toBe(1);
      expect(resolvePhysicalSpan(false, true, 0, 1, dummySeatCol, 4)).toBe(1);
    });

    it("returns colSpan when hasAisles is false", () => {
      expect(resolvePhysicalSpan(false, false, 0, 3, dummySeatCol, 4)).toBe(3);
    });

    it("multiplies span across aisle gap tracks when hasAisles is true", () => {
      // logical 0 (track 1) to logical 1 (track 3): diff is 3 - 1 + 1 = 3
      expect(resolvePhysicalSpan(false, true, 0, 2, dummySeatCol, 4)).toBe(3);
      // logical 0 (track 1) to logical 2 (track 5): diff is 5 - 1 + 1 = 5
      expect(resolvePhysicalSpan(false, true, 0, 3, dummySeatCol, 4)).toBe(5);
    });
  });

  describe("buildTemplateColumns", () => {
    it("builds correct grid template for room 209", () => {
      const cols = buildTemplateColumns(room209, false, false, true, false);
      expect(cols).toEqual(["auto", "26px", "auto", "4px", "auto", "26px", "auto"]);
    });

    it("builds correct grid template for room 310 with left aisle", () => {
      const cols = buildTemplateColumns(room310, false, true, true, false);
      expect(cols[0]).toBe("minmax(24px, auto)");
      expect(cols).toHaveLength(12); // left aisle + 6 seat cols + 5 gap tracks
    });
  });

  describe("buildFlatItems & resolveTotalGridRows", () => {
    it("flattens room 209 rows and maps correct row and col tracks", () => {
      const seatColumn = (logical: number) => resolveSeatColumn(logical, true, 0);
      const flat = buildFlatItems(room209, true, false, 2, seatColumn);
      expect(flat.length).toBe(20); // 5 rows * 4 cols
      expect(flat[0].row).toBe(2);
      expect(flat[0].col).toBe(1);
      expect(flat[0].cell.type).toBe("seat");

      const totalRows = resolveTotalGridRows(flat, room209);
      expect(totalRows).toBe(7); // rowOffset (2) + 5 rows
    });

    it("flattens room 310 and preserves printer cell spanning", () => {
      const seatColumn = (logical: number) => resolveSeatColumn(logical, true, 1);
      const flat = buildFlatItems(room310, true, false, 2, seatColumn);
      const printerItem = flat.find((item) => item.cell.type === "printer");
      expect(printerItem).toBeDefined();
      expect(printerItem?.rowSpan).toBe(3);
    });
  });
});

describe("Seat Grid Sub-Components", () => {
  const dummySizes = {
    seat: 50,
    height: 52,
    gap: 8,
    name: 12,
    code: 9,
  };

  it("renders SeatCellElement with occupant or vacant fallback", () => {
    const { rerender } = render(
      <SeatCellElement
        cell={{ type: "seat", label: "A1", occupant: "王小明" }}
        sizes={dummySizes}
        layoutId="test-room"
        itemStyle={{}}
      />,
    );
    expect(screen.getByText("A1")).toBeTruthy();
    expect(screen.getByText("王小明")).toBeTruthy();

    rerender(
      <SeatCellElement
        cell={{ type: "seat", label: "A2" }}
        sizes={dummySizes}
        layoutId="test-room"
        itemStyle={{}}
      />,
    );
    expect(screen.getByText("A2")).toBeTruthy();
    expect(screen.getByText("空")).toBeTruthy();
  });

  it("renders DoorCellElement with custom border orientation", () => {
    const { container } = render(
      <DoorCellElement
        cell={{ type: "door", label: "大門" }}
        sizes={dummySizes}
        doorOpen="down"
        hasRowAisles={false}
        itemStyle={{}}
      />,
    );
    expect(screen.getByText("大門")).toBeTruthy();
    const doorSpan = container.querySelector("span");
    expect(doorSpan?.style.borderBottom).toContain("var(--ncu-ink)");
  });

  it("renders PrinterCellElement and handles vertical writing mode for spans", () => {
    const { rerender } = render(
      <PrinterCellElement
        cell={{ type: "printer", label: "印表機" }}
        rowSpan={1}
        sizes={dummySizes}
        hasRowAisles={false}
        itemStyle={{}}
      />,
    );
    const element1 = screen.getByText("印表機");
    expect(element1).toBeTruthy();

    rerender(
      <PrinterCellElement
        cell={{ type: "printer", label: "印表機" }}
        rowSpan={3}
        sizes={dummySizes}
        hasRowAisles={false}
        itemStyle={{}}
      />,
    );
    const element2 = screen.getByText("印表機");
    expect(element2.style.writingMode).toBe("vertical-rl");
  });

  it("renders SpecialBlockCell for whiteboard and sofa", () => {
    const { rerender } = render(
      <SpecialBlockCell
        type="whiteboard"
        label="討論白板"
        sizes={dummySizes}
        hasRowAisles={false}
        itemStyle={{}}
      />,
    );
    expect(screen.getByText("討論白板")).toBeTruthy();

    rerender(
      <SpecialBlockCell
        type="sofa"
        label="休息沙發"
        sizes={dummySizes}
        hasRowAisles={false}
        itemStyle={{}}
      />,
    );
    expect(screen.getByText("休息沙發")).toBeTruthy();
  });

  it("renders GridCellElement for empty cells gracefully returning null", () => {
    const { container } = render(
      <GridCellElement
        item={{
          id: "empty-1",
          cell: { type: "empty" },
          row: 0,
          col: 1,
          rowSpan: 1,
          colSpan: 1,
        }}
        sizes={dummySizes}
        layout={ROOM_LAYOUTS[0]}
        hasRowAisles={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders top and side facility elements correctly", () => {
    render(
      <div>
        <TopDoorElement
          doorCol={2}
          sizes={dummySizes}
          doorOpen="down"
          hasDoorWalkway={true}
          hasRowAisles={false}
        />
        <TopWhiteboardElement
          colStart={2}
          colEnd={4}
          hasRowAisles={false}
          gap={dummySizes.gap}
        />
        <SideDoorElement sideDoorRow={3} />
        <SideWhiteboardElement sideWhiteboardRow={4} />
        <SidePrinterElement sidePrinterRow={5} />
      </div>,
    );
    expect(screen.getAllByText("門").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("白板").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("印表機")).toBeTruthy();
  });

  it("renders AisleTrack components (walkways and spacers)", () => {
    render(
      <div>
        <HorizontalWalkway gridRow={2} height={24} />
        <RowGapSpacer gridRow={4} height={14} />
        <RowGapSpacer gridRow={5} height={6} />
        <VerticalAisleTrack colTrack={2} rowOffset={2} totalGridRows={8} />
      </div>,
    );
    expect(screen.getAllByText("走道").length).toBe(3);
  });
});

describe("SeatGrid Integration", () => {
  it("renders Room 209 layout without errors", () => {
    const room209 = ROOM_LAYOUTS.find((r) => r.id === "209")!;
    const { container } = render(<SeatGrid layout={room209} />);
    expect(container.querySelector("div")).toBeTruthy();
    expect(screen.getByText("1-1")).toBeTruthy();
    expect(screen.getByText("4-5")).toBeTruthy();
  });

  it("renders Room 310 layout with printer and left aisle", () => {
    const room310 = ROOM_LAYOUTS.find((r) => r.id === "310")!;
    render(<SeatGrid layout={room310} />);
    expect(screen.getByText("1-1")).toBeTruthy();
    expect(screen.getByText("印表機")).toBeTruthy();
  });

  it("renders Room 313 layout correctly", () => {
    const room313 = ROOM_LAYOUTS.find((r) => r.id === "313")!;
    render(<SeatGrid layout={room313} />);
    expect(screen.getByText("1-1")).toBeTruthy();
  });
});
