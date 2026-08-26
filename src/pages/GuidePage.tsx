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
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from "@ionic/react";
import { checkmarkCircle, openOutline } from "ionicons/icons";

const checklist = [
  { id: "1", title: "完成報到手續", done: false },
  { id: "2", title: "領取學生證", done: false },
  { id: "3", title: "選課登記", done: false },
  { id: "4", title: "學術倫理研習", done: false },
  { id: "5", title: "認識指導教授", done: false },
  { id: "6", title: "加入系上社群", done: false },
];

const resources = [
  { title: "教務處選課系統", url: "#" },
  { title: "計中帳號申請", url: "#" },
  { title: "圖書館借閱", url: "#" },
  { title: "VPN 設定教學", url: "#" },
  { title: "GitHub Student Pack", url: "#" },
  { title: "JetBrains 授權", url: "#" },
];

export default function GuidePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>新生生存指南</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard
          style={{
            margin: "0 0 var(--ncu-space-4)",
            border: "2px solid var(--ncu-ink)",
            boxShadow: "var(--ncu-shadow-hard)",
          }}
        >
          <IonCardHeader>
            <IonCardTitle>入學檢核清單</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
              {checklist.map((item) => (
                <IonItem key={item.id}>
                  <IonIcon
                    icon={checkmarkCircle}
                    slot="start"
                    color={item.done ? "success" : "medium"}
                    style={{ fontSize: 20 }}
                  />
                  <IonLabel style={{ textDecoration: item.done ? "line-through" : "none" }}>
                    {item.title}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>

        <h3 style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: "var(--ncu-font-weight-bold)" }}>
          校園資源直達車
        </h3>
        <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
          {resources.map((res, i) => (
            <IonItem key={i} button detail href={res.url}>
              <IonLabel>{res.title}</IonLabel>
              <IonIcon icon={openOutline} slot="end" color="primary" />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}
