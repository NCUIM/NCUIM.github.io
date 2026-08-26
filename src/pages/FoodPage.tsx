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
  IonChip,
  IonButton,
} from "@ionic/react";
import { useState } from "react";

const areas: readonly string[] = ["後門", "宵夜街", "前門", "校內"];

const AreaFilterChips = ({
  selectedArea,
  onSelectArea,
}: Readonly<{
  selectedArea: string | null;
  onSelectArea: (area: string | null) => void;
}>) => (
  <div style={{ display: "flex", gap: "var(--ncu-space-2)", flexWrap: "wrap", marginBottom: "var(--ncu-space-4)" }}>
    <IonChip
      color={selectedArea === null ? "primary" : undefined}
      onClick={() => onSelectArea(null)}
    >
      全部
    </IonChip>
    {areas.map((area) => (
      <IonChip
        key={area}
        color={selectedArea === area ? "primary" : undefined}
        onClick={() => onSelectArea(area)}
      >
        {area}
      </IonChip>
    ))}
  </div>
);

const RecommendationCard = () => (
  <IonCard
    style={{
      margin: 0,
      border: "2px solid var(--ncu-ink)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader>
      <IonCardTitle>今天吃什麼？</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <p style={{ color: "var(--ncu-muted)" }}>
        選擇區域後，按下按鈕隨機推薦一家店！
      </p>
      <IonButton expand="block" color="primary" disabled>
        🎲 隨機推薦
      </IonButton>
    </IonCardContent>
  </IonCard>
);

const FoodPage = () => {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>中大美食地圖</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <AreaFilterChips selectedArea={selectedArea} onSelectArea={setSelectedArea} />
        <RecommendationCard />

        <div style={{ marginTop: "var(--ncu-space-4)", color: "var(--ncu-muted)", textAlign: "center" }}>
          美食店家資料即將上線
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FoodPage;
