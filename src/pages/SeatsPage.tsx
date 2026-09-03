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
import { ROOM_LAYOUTS, type RoomLayout } from "../data/room-layouts";
import SeatGrid from "../components/seats/SeatGrid";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const RoomCard = ({ layout }: Readonly<{ layout: RoomLayout }>) => (
  <IonCard
    style={{
      margin: 0,
      border: "2px solid var(--ncu-ink)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <IonCardTitle>{layout.name}</IonCardTitle>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 999,
            background: "var(--ncu-surface)",
            border: "1px solid var(--ncu-border)",
            color: "var(--ncu-muted)",
          }}
        >
          面朝志希館大門
        </span>
      </div>
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
