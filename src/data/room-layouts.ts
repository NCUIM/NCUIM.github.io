// Layout data types
export interface SeatCell {
  readonly type: "seat";
  readonly label: string;
  readonly occupant?: string;
}

export interface SpecialCell {
  readonly type: "corridor" | "printer" | "pillar" | "door" | "empty" | "sofa" | "whiteboard";
  readonly label?: string;
  readonly colSpan?: number;
  readonly rowSpan?: number;
}

export type GridCell = SeatCell | SpecialCell;

export interface RoomLayout {
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

export const ROOM_LAYOUTS: readonly RoomLayout[] = [
  // ── 209: wall | col1 | 走道 | col2+col3 貼齊 | 走道 | col4 | wall ──
  {
    id: "209",
    name: "209 研究室",
    cols: 4,
    doorColumn: 1,
    doorOpen: "down",
    doorWalkway: true,
    topWhiteboardCols: [2, 4],
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
    topWhiteboardCols: [3, 6],
    leftAisle: true,
    gaps: [4, 18, 4, 18, 4],
    seatWidth: 46,
    seatHeight: 48,
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
        { type: "door", label: "門" },
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

  // ── 919: Rotated 90° clockwise (facing North) ──
  {
    id: "919",
    name: "919 研究室",
    cols: 5,
    seatWidth: 54,
    doorOpen: "down",
    gaps: [4, 4, 24, 4],
    rows: [
      [
        { type: "printer", label: "印表機", colSpan: 3 },
        { type: "whiteboard", label: "白板" },
        { type: "door", label: "門" },
      ],
      [
        { type: "corridor", label: "走道", colSpan: 3 },
        { type: "corridor", label: "走道", colSpan: 2 },
      ],
      [
        { type: "seat", label: "1-5" },
        { type: "seat", label: "1-4" },
        { type: "seat", label: "1-3" },
        { type: "seat", label: "1-2" },
        { type: "seat", label: "1-1" },
      ],
      [
        { type: "seat", label: "2-5" },
        { type: "seat", label: "2-4" },
        { type: "seat", label: "2-3" },
        { type: "seat", label: "2-2" },
        { type: "seat", label: "2-1" },
      ],
      [
        { type: "corridor", label: "走道", colSpan: 3 },
        { type: "corridor", label: "走道", colSpan: 2 },
      ],
    ],
  },
];
