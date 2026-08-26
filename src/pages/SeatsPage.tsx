import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { useState } from "react";

const rooms = [
  { id: "209", name: "209 研究室", seats: 20 },
  { id: "310", name: "310 研究室", seats: 27 },
  { id: "313", name: "313 研究室", seats: 23 },
  { id: "919", name: "919 研究室", seats: 9 },
];

export default function SeatsPage() {
  const [selectedRoom, setSelectedRoom] = useState("209");

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/" text="" slot="start" />
          <IonTitle>研究室座位表</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSegment
          value={selectedRoom}
          onIonChange={(e) => setSelectedRoom(e.detail.value as string)}
          scrollable
        >
          {rooms.map((room) => (
            <IonSegmentButton key={room.id} value={room.id}>
              {room.id}
            </IonSegmentButton>
          ))}
        </IonSegment>

        <div style={{ marginTop: "var(--ncu-space-4)" }}>
          {rooms
            .filter((r) => r.id === selectedRoom)
            .map((room) => (
              <IonCard
                key={room.id}
                style={{
                  margin: 0,
                  border: "2px solid var(--ncu-ink)",
                  boxShadow: "var(--ncu-shadow-hard)",
                }}
              >
                <IonCardHeader>
                  <IonCardTitle>{room.name}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>總席數：{room.seats} 席</p>
                  <div
                    style={{
                      padding: "var(--ncu-space-8)",
                      textAlign: "center",
                      color: "var(--ncu-muted)",
                      background: "var(--ncu-canvas)",
                      borderRadius: "var(--ncu-radius-md)",
                      border: "1px dashed var(--ncu-border)",
                    }}
                  >
                    座位圖即將上線
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
