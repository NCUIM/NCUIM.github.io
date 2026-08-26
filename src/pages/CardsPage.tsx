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
import { people, scan } from "ionicons/icons";

export default function CardsPage() {
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
            <p
              style={{
                color: "var(--ncu-muted)",
                marginTop: "var(--ncu-space-2)",
              }}
            >
              QR 掃碼互換 · Profile 卡片 · 成就 · 排行榜
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
              <IonCardTitle>報到與收集</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>掃描 Entry Code 建立身分，填寫 Profile，開始收集卡片。</p>
              <IonButton expand="block" color="primary">
                <IonIcon icon={scan} slot="start" />
                掃描 Entry Code 報到
              </IonButton>
            </IonCardContent>
          </IonCard>

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
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
