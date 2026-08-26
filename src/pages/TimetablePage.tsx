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

const days = ["一", "二", "三", "四", "五"];
const periods = ["1", "2", "3", "4", "N", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E"];

export default function TimetablePage() {
  const [level, setLevel] = useState("graduate");

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/" text="" slot="start" />
          <IonTitle>全系課表</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSegment
          value={level}
          onIonChange={(e) => setLevel(e.detail.value as string)}
        >
          <IonSegmentButton value="graduate">碩博班</IonSegmentButton>
          <IonSegmentButton value="undergraduate">大學部</IonSegmentButton>
        </IonSegment>

        <div style={{ marginTop: "var(--ncu-space-4)" }}>
          <IonCard
            style={{
              margin: 0,
              border: "2px solid var(--ncu-ink)",
              boxShadow: "var(--ncu-shadow-hard)",
              overflow: "auto",
            }}
          >
            <IonCardHeader>
              <IonCardTitle>
                {level === "graduate" ? "碩博班" : "大學部"}課表
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `40px repeat(${days.length}, 1fr)`,
                  gap: 1,
                  fontSize: "var(--ncu-font-size-xs)",
                  minWidth: 300,
                }}
              >
                <div />
                {days.map((d) => (
                  <div
                    key={d}
                    style={{
                      padding: "var(--ncu-space-2)",
                      textAlign: "center",
                      fontWeight: "var(--ncu-font-weight-bold)",
                      background: "var(--ncu-primary)",
                      color: "#fff",
                    }}
                  >
                    週{d}
                  </div>
                ))}
                {periods.map((p) => (
                  <>
                    <div
                      key={`label-${p}`}
                      style={{
                        padding: "var(--ncu-space-1)",
                        textAlign: "center",
                        background: "var(--ncu-primary-light)",
                        fontWeight: "var(--ncu-font-weight-medium)",
                      }}
                    >
                      {p}
                    </div>
                    {days.map((d) => (
                      <div
                        key={`${d}-${p}`}
                        style={{
                          padding: "var(--ncu-space-1)",
                          textAlign: "center",
                          background: "var(--ncu-surface)",
                          border: "1px solid var(--ncu-border)",
                          minHeight: 32,
                        }}
                      />
                    ))}
                  </>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
