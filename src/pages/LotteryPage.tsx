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
  IonButton,
} from "@ionic/react";
import { sparkles } from "ionicons/icons";

export default function LotteryPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>抽籤大會</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY={false} scrollX={false}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--ncu-space-6)",
            paddingTop: "var(--ncu-space-8)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "var(--ncu-radius-lg)",
              background: "var(--ncu-star)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40 }}>✨</span>
          </div>

          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontSize: "var(--ncu-font-size-2xl)",
                fontWeight: "var(--ncu-font-weight-bold)",
                margin: 0,
              }}
            >
              抽籤大會
            </h2>
            <p
              style={{
                color: "var(--ncu-muted)",
                marginTop: "var(--ncu-space-2)",
              }}
            >
              大螢幕開獎 · 蛇形相鄰分配 · 即時動畫
            </p>
          </div>

          <IonCard
            style={{
              width: "100%",
              margin: 0,
              border: "2px solid var(--ncu-ink)",
              boxShadow: "var(--ncu-shadow-hard)",
            }}
          >
            <IonCardHeader>
              <IonCardTitle>舞台模式</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>此頁面設計為大螢幕投影使用，請以橫向模式開啟。</p>
              <IonButton expand="block" color="primary" disabled>
                等待管理員啟動抽籤
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
