import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { people, scan, trophy } from "ionicons/icons";
import { useState } from "react";

function HeaderSection() {
  return (
    <>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "var(--ncu-radius-lg)",
          background: "var(--ncu-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IonIcon icon={people} style={{ fontSize: 40, color: "#fff" }} />
      </div>

      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "var(--ncu-font-size-2xl)",
            fontWeight: "var(--ncu-font-weight-bold)",
            margin: 0,
          }}
        >
          活動卡片收集
        </h2>
        <p style={{ color: "var(--ncu-muted)", marginTop: "var(--ncu-space-2)" }}>
          QR 掃碼互換 · Profile 卡片 · 成就 · 排行榜
        </p>
      </div>
    </>
  );
}

function CheckInCard({
  checkedIn,
  onCheckIn,
}: Readonly<{
  checkedIn: boolean;
  onCheckIn: () => void;
}>) {
  return (
    <IonCard
      style={{
        width: "100%",
        margin: 0,
        border: "2px solid var(--ncu-ink)",
        boxShadow: "var(--ncu-shadow-hard)",
      }}
    >
      <IonCardHeader>
        <IonCardTitle>報到與收集</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>
          {checkedIn
            ? "Demo 報到已完成；正式活動會在掃描 Entry Code 後建立身分。"
            : "這是報到流程預覽；正式活動會掃描 Entry Code 建立身分。"}
        </p>
        <IonButton expand="block" color="primary" onClick={onCheckIn} disabled={checkedIn}>
          <IonIcon icon={scan} slot="start" />
          {checkedIn ? "Demo 報到完成" : "預覽掃碼報到"}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}

function MyCollectionCard() {
  return (
    <IonCard
      style={{
        width: "100%",
        margin: 0,
        border: "2px solid var(--ncu-border)",
      }}
    >
      <IonCardHeader>
        <IonCardTitle>我的收集</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p style={{ color: "var(--ncu-muted)" }}>
          報到後即可查看收集清單與排行榜。
        </p>
        <IonButton expand="block" fill="outline" routerLink="/leaderboard">
          <IonIcon icon={trophy} slot="start" />
          查看排行榜
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}

export default function CardsPage() {
  const [checkedIn, setCheckedIn] = useState(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>活動卡片收集</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--ncu-space-6)",
            paddingTop: "var(--ncu-space-8)",
          }}
        >
          <HeaderSection />
          <CheckInCard checkedIn={checkedIn} onCheckIn={() => setCheckedIn(true)} />
          <MyCollectionCard />
        </div>
      </IonContent>
    </IonPage>
  );
}
