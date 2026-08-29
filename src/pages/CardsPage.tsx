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
  IonBadge,
} from "@ionic/react";
import { people, scan, trophy, constructOutline } from "ionicons/icons";
import { useState } from "react";

const HeaderSection = () => (
  <>
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "var(--ncu-radius-lg)",
        background: "var(--ncu-muted)",
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
          color: "var(--ncu-ink)",
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

const CheckInCard = ({
  checkedIn,
  onCheckIn,
}: Readonly<{
  checkedIn: boolean;
  onCheckIn: () => void;
}>) => (
  <IonCard
    style={{
      width: "100%",
      margin: 0,
      border: "2px solid var(--ncu-border)",
      boxShadow: "none",
    }}
  >
    <IonCardHeader>
      <IonCardTitle>報到與收集</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <p style={{ color: "var(--ncu-muted)" }}>
        {checkedIn
          ? "Demo 報到已完成；正式活動會在掃描 Entry Code 後建立身分。"
          : "這是報到流程預覽；正式活動會掃描 Entry Code 建立身分。"}
      </p>
      <IonButton expand="block" color="medium" onClick={onCheckIn} disabled>
        <IonIcon icon={scan} slot="start" />
        預覽掃碼報到
      </IonButton>
    </IonCardContent>
  </IonCard>
);

const MyCollectionCard = () => (
  <IonCard
    style={{
      width: "100%",
      margin: 0,
      border: "2px solid var(--ncu-border)",
      boxShadow: "none",
    }}
  >
    <IonCardHeader>
      <IonCardTitle>我的收集</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <p style={{ color: "var(--ncu-muted)" }}>
        報到後即可查看收集清單與排行榜。
      </p>
      <IonButton expand="block" fill="outline" color="medium" disabled>
        <IonIcon icon={trophy} slot="start" />
        查看排行榜
      </IonButton>
    </IonCardContent>
  </IonCard>
);

const CardsHeader = () => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>使用者中心</IonTitle>
    </IonToolbar>
  </IonHeader>
);

const UnavailableOverlay = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(247, 248, 250, 0.88)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      zIndex: 100,
      textAlign: "center",
    }}
  >
    <div
      style={{
        background: "var(--ncu-surface)",
        padding: "32px 24px",
        borderRadius: "var(--ncu-radius-lg)",
        border: "2px solid var(--ncu-ink)",
        boxShadow: "var(--ncu-shadow-hard)",
        maxWidth: 360,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(100, 116, 139, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <IonIcon
          icon={constructOutline}
          style={{ fontSize: 28, color: "var(--ncu-ink)" }}
        />
      </div>

      <IonBadge
        color="medium"
        style={{
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: 999,
          marginBottom: 10,
          fontWeight: 700,
        }}
      >
        功能未開放
      </IonBadge>

      <h3
        style={{
          margin: "0 0 8px",
          fontSize: 19,
          fontWeight: 800,
          color: "var(--ncu-ink)",
        }}
      >
        此專區暫不提供服務
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          color: "var(--ncu-muted)",
          lineHeight: 1.5,
        }}
      >
        使用者個人檔案、活動報到與卡片收集功能目前暫未啟用。
      </p>
    </div>
  </div>
);

const CardsPage = () => {
  const [checkedIn, setCheckedIn] = useState(false);

  return (
    <IonPage>
      <CardsHeader />
      <IonContent
        className="ion-padding"
        style={{ position: "relative", "--background": "var(--ncu-canvas)" }}
      >
        {/* Background dimmed content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--ncu-space-6)",
            paddingTop: "var(--ncu-space-8)",
            filter: "grayscale(0.6)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <HeaderSection />
          <CheckInCard
            checkedIn={checkedIn}
            onCheckIn={() => setCheckedIn(true)}
          />
          <MyCollectionCard />

          <div
            style={{
              marginTop: 20,
              padding: "16px",
              borderRadius: "var(--ncu-radius-md)",
              border: "2px dashed var(--ncu-border)",
              textAlign: "center",
              color: "var(--ncu-muted)",
              width: "100%",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
              📇 電子名片
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              此區塊預留給電子名片模組整合
            </p>
          </div>
        </div>

        {/* Global Unavailable Overlay */}
        <UnavailableOverlay />
      </IonContent>
    </IonPage>
  );
};

export default CardsPage;
