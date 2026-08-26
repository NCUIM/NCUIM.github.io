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
  IonCheckbox,
  IonNote,
} from "@ionic/react";
import { openOutline, link } from "ionicons/icons";
import { useState } from "react";

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

const links = [
  { title: "2026 新生知訊網", url: "https://ncufresh.ncu.edu.tw/link" },
  { title: "NCU Portal", url: "https://portal.ncu.edu.tw/" },
  { title: "新 ee-class", url: "https://ncueeclass.ncu.edu.tw/" },
  { title: "iNCU 首頁", url: "https://cis.ncu.edu.tw/iNCU/home" },
  { title: "iNCU 學校活動", url: "https://cis.ncu.edu.tw/iNCU/messageNotice/activityManagement/activity" },
  { title: "NCU TALK 臉書版", url: "https://www.facebook.com/groups/NCUgroup/" },
  { title: "復活福利社", url: "https://www.facebook.com/groups/209055389218793/" },
  { title: "雲端租屋生活網", url: "https://house.nfu.edu.tw/NCU" },
];

export default function GuidePage() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const toggleItem = (id: string, checked: boolean) => setCompletedIds((ids) => checked ? [...ids, id] : ids.filter((itemId) => itemId !== id));

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
              {checklist.map((item) => {
                const done = completedIds.includes(item.id);
                return (
                <IonItem key={item.id}>
                  <IonCheckbox slot="start" checked={done} onIonChange={(event) => toggleItem(item.id, event.detail.checked)} />
                  <IonLabel style={{ textDecoration: done ? "line-through" : "none" }}>
                    {item.title}
                  </IonLabel>
                </IonItem>
                );
              })}
            </IonList>
          </IonCardContent>
        </IonCard>

        <h3 style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: "var(--ncu-font-weight-bold)" }}>
          校園資源直達車
        </h3>
        <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
          {resources.map((res, i) => (
            <IonItem key={i} disabled>
              <IonLabel>{res.title}</IonLabel>
              <IonNote slot="end">準備中</IonNote>
            </IonItem>
          ))}
        </IonList>

        <h3 style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: "var(--ncu-font-weight-bold)", marginTop: "var(--ncu-space-4)" }}>
          常用連結
        </h3>
        <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
          {links.map((l, i) => (
            <IonItem key={i} button href={l.url} target="_blank" rel="noopener noreferrer">
              <IonIcon icon={link} slot="start" color="medium" />
              <IonLabel>{l.title}</IonLabel>
              <IonIcon icon={openOutline} slot="end" color="primary" />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}
