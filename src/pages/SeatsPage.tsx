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
  readonly colSpan?: number;
  readonly rowSpan?: number;
}

interface SpecialCell {
  readonly type: "door" | "corridor" | "printer" | "pillar" | "empty";
  readonly label?: string;
  readonly colSpan?: number;
  readonly rowSpan?: number;
}

type GridCell = SeatCell | SpecialCell;

interface RoomLayout {
  readonly id: string;
  readonly name: string;
  readonly cols: number;
  readonly rows: GridCell[][];
}

// ---------------------------------------------------------------------------
// Room layouts (from Excel screenshots)
// ---------------------------------------------------------------------------

const ROOM_LAYOUTS: readonly RoomLayout[] = [
  // ── 209: 4×5 grid, door top-left ──────────────────────────────────
  {
    id: "209",
    name: "209 研究室",
    cols: 7,
    rows: [
      [{ type: "door", label: "大門" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }],
      [{ type: "seat", label: "1-1" }, { type: "empty" }, { type: "seat", label: "2-1" }, { type: "empty" }, { type: "seat", label: "3-1" }, { type: "empty" }, { type: "seat", label: "4-1" }],
      [{ type: "seat", label: "1-2" }, { type: "empty" }, { type: "seat", label: "2-2" }, { type: "empty" }, { type: "seat", label: "3-2" }, { type: "empty" }, { type: "seat", label: "4-2" }],
      [{ type: "seat", label: "1-3" }, { type: "empty" }, { type: "seat", label: "2-3" }, { type: "empty" }, { type: "seat", label: "3-3" }, { type: "empty" }, { type: "seat", label: "4-3" }],
      [{ type: "seat", label: "1-4" }, { type: "empty" }, { type: "seat", label: "2-4" }, { type: "empty" }, { type: "seat", label: "3-4" }, { type: "empty" }, { type: "seat", label: "4-4" }],
      [{ type: "seat", label: "1-5" }, { type: "empty" }, { type: "seat", label: "2-5" }, { type: "empty" }, { type: "seat", label: "3-5" }, { type: "empty" }, { type: "seat", label: "4-5" }],
    ],
  },

  // ── 310: 5 seat groups (each 2 cols) + printer/extra (2 cols) ──────
  {
    id: "310",
    name: "310 研究室",
    cols: 12,
    rows: [
      // Row 1: door spans A-B, rest empty
      [{ type: "door", label: "大門", colSpan: 2 }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }],
      // Row 2: seats 1-1 to 5-1 (each 2 cols) + printer (2 cols, spans 3 rows)
      [{ type: "seat", label: "1-1", colSpan: 2 }, { type: "seat", label: "2-1", colSpan: 2 }, { type: "seat", label: "3-1", colSpan: 2 }, { type: "seat", label: "4-1", colSpan: 2 }, { type: "seat", label: "5-1", colSpan: 2 }, { type: "printer", label: "印表機區", colSpan: 2, rowSpan: 3 }],
      // Row 3: seats 1-2 to 5-2 (printer continues via rowSpan)
      [{ type: "seat", label: "1-2", colSpan: 2 }, { type: "seat", label: "2-2", colSpan: 2 }, { type: "seat", label: "3-2", colSpan: 2 }, { type: "seat", label: "4-2", colSpan: 2 }, { type: "seat", label: "5-2", colSpan: 2 }],
      // Row 4: seats 1-3 to 5-3 (printer continues via rowSpan)
      [{ type: "seat", label: "1-3", colSpan: 2 }, { type: "seat", label: "2-3", colSpan: 2 }, { type: "seat", label: "3-3", colSpan: 2 }, { type: "seat", label: "4-3", colSpan: 2 }, { type: "seat", label: "5-3", colSpan: 2 }],
      // Row 5: seats 1-4 to 5-4 + 6-1 (K col) + empty (L col)
      [{ type: "seat", label: "1-4", colSpan: 2 }, { type: "seat", label: "2-4", colSpan: 2 }, { type: "seat", label: "3-4", colSpan: 2 }, { type: "seat", label: "4-4", colSpan: 2 }, { type: "seat", label: "5-4", colSpan: 2 }, { type: "seat", label: "6-1" }, { type: "empty" }],
      // Row 6: seats 1-5 to 5-5 + 6-2 (K col) + empty (L col)
      [{ type: "seat", label: "1-5", colSpan: 2 }, { type: "seat", label: "2-5", colSpan: 2 }, { type: "seat", label: "3-5", colSpan: 2 }, { type: "seat", label: "4-5", colSpan: 2 }, { type: "seat", label: "5-5", colSpan: 2 }, { type: "seat", label: "6-2" }, { type: "empty" }],
    ],
  },

  // ── 313: 3 seat cols + 4th col with door/pillar, 7 CSS cols ──────
  {
    id: "313",
    name: "313 研究室",
    cols: 7,
    rows: [
      // Row 1: door in col 7 (same column as 4-x seats)
      [{ type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "door", label: "大門" }],
      // Row 2: 3 seats + 4-1
      [{ type: "seat", label: "1-1" }, { type: "empty" }, { type: "seat", label: "2-1" }, { type: "empty" }, { type: "seat", label: "3-1" }, { type: "empty" }, { type: "seat", label: "4-1" }],
      // Row 3: 3 seats + pillar (replaces 4-x)
      [{ type: "seat", label: "1-2" }, { type: "empty" }, { type: "seat", label: "2-2" }, { type: "empty" }, { type: "seat", label: "3-2" }, { type: "empty" }, { type: "pillar", label: "牆柱" }],
      // Rows 4-7: 3 seats + 4-x continues
      [{ type: "seat", label: "1-3" }, { type: "empty" }, { type: "seat", label: "2-3" }, { type: "empty" }, { type: "seat", label: "3-3" }, { type: "empty" }, { type: "seat", label: "4-2" }],
      [{ type: "seat", label: "1-4" }, { type: "empty" }, { type: "seat", label: "2-4" }, { type: "empty" }, { type: "seat", label: "3-4" }, { type: "empty" }, { type: "seat", label: "4-3" }],
      [{ type: "seat", label: "1-5" }, { type: "empty" }, { type: "seat", label: "2-5" }, { type: "empty" }, { type: "seat", label: "3-5" }, { type: "empty" }, { type: "seat", label: "4-4" }],
      [{ type: "seat", label: "1-6" }, { type: "empty" }, { type: "seat", label: "2-6" }, { type: "empty" }, { type: "seat", label: "3-6" }, { type: "empty" }, { type: "seat", label: "4-5" }],
    ],
  },

  // ── 919: 2-col corridor layout, doors top & bottom ──────────────
  {
    id: "919",
    name: "919 研究室",
    cols: 2,
    rows: [
      [{ type: "door", label: "大門" }, { type: "seat", label: "2-1" }],
      [{ type: "seat", label: "1-1" }, { type: "seat", label: "2-2" }],
      [{ type: "seat", label: "1-2" }, { type: "seat", label: "2-3" }],
      [{ type: "seat", label: "1-3" }, { type: "seat", label: "2-4" }],
      [{ type: "corridor", label: "走道", colSpan: 2 }],
      [{ type: "seat", label: "1-4" }, { type: "seat", label: "2-5" }],
    ],
  },
];

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const SEAT_STYLE: React.CSSProperties = {
  minWidth: 44,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  background: "var(--ncu-primary-light)",
  border: "1.5px solid var(--ncu-primary)",
  color: "var(--ncu-ink)",
  padding: "0 4px",
};

const SPECIAL_STYLES: Record<string, React.CSSProperties> = {
  door: {
    minWidth: 44,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    background: "#fef3c7",
    border: "1.5px solid #d97706",
    color: "#92400e",
  },
  corridor: {
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ncu-muted)",
    background: "repeating-linear-gradient(90deg, var(--ncu-border) 0, var(--ncu-border) 6px, transparent 6px, transparent 12px)",
    borderRadius: 4,
    gridColumn: "1 / -1",
  },
  printer: {
    minWidth: 44,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: "#f3e8ff",
    border: "1.5px solid #7c3aed",
    color: "#5b21b6",
  },
  pillar: {
    minWidth: 44,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    background: "var(--ncu-canvas)",
    border: "1.5px dashed var(--ncu-border)",
    color: "var(--ncu-muted)",
  },
  empty: {
    minWidth: 12,
    height: 34,
  },
};

const getSeatSizes = (cols: number) => {
  if (cols <= 4) return { seat: 52, empty: 16, gap: 6, door: 52 };
  if (cols <= 6) return { seat: 46, empty: 14, gap: 5, door: 46 };
  if (cols <= 8) return { seat: 38, empty: 8, gap: 3, door: 38 };
  return { seat: 32, empty: 6, gap: 3, door: 32 };
};

const SeatGrid = ({ layout }: Readonly<{ layout: RoomLayout }>) => {
  const sizes = getSeatSizes(layout.cols);
  const rows = layout.rows.length;

  // Build positioned items with explicit grid coordinates
  const items: { key: number; row: number; col: number; span: number; rowSpan: number; el: React.ReactNode }[] = [];
  let itemIdx = 0;

  for (let r = 0; r < rows; r++) {
    let col = 1;
    for (const cell of layout.rows[r]) {
      const isStruct = cell.type === "seat" || cell.type === "door" || cell.type === "corridor" || cell.type === "printer" || cell.type === "pillar";
      const span = isStruct ? ((cell as SeatCell | SpecialCell).colSpan ?? 1) : 1;
      const rs = isStruct ? ((cell as SeatCell | SpecialCell).rowSpan ?? 1) : 1;

      let el: React.ReactNode;
      if (cell.type === "corridor") {
        el = <div style={SPECIAL_STYLES.corridor}>{cell.label}</div>;
      } else if (cell.type === "empty") {
        el = <div style={{ ...SPECIAL_STYLES.empty, minWidth: sizes.empty }} />;
      } else if (cell.type === "seat") {
        el = (
          <div style={{ ...SEAT_STYLE, minWidth: sizes.seat }}>
            {cell.label}
          </div>
        );
      } else {
        const base = SPECIAL_STYLES[cell.type];
        const w = cell.type === "door" ? sizes.door : undefined;
        el = (
          <div style={{ ...base, ...(w ? { minWidth: w } : {}), ...(rs > 1 ? { height: "100%" } : {}) }}>
            {cell.label}
          </div>
        );
      }

      items.push({ key: itemIdx++, row: r, col, span, rowSpan: rs, el });
      col += span;
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0", overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.cols}, auto)`,
          gap: sizes.gap,
          alignItems: "center",
        }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              gridRow: item.rowSpan > 1 ? `${item.row + 1} / span ${item.rowSpan}` : item.row + 1,
              gridColumn: item.span > 1 ? `${item.col} / span ${item.span}` : item.col,
              ...(item.rowSpan > 1 ? { alignSelf: "stretch" } : {}),
            }}
          >
            {item.el}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Existing sub-components
// ---------------------------------------------------------------------------

const RoomCard = ({ layout }: Readonly<{ layout: RoomLayout }>) => {
  const seatCount = layout.rows.flat().filter((c) => c.type === "seat").length;
  return (
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
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--ncu-muted)" }}>
          總席數：{seatCount} 席
        </p>
        <SeatGrid layout={layout} />
      </IonCardContent>
    </IonCard>
  );
};

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
  <IonContent className="ion-padding" scrollY={false}>
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
