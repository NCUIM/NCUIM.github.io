import { IonPage, IonHeader, IonToolbar, IonTitle, IonBackButton, IonContent } from "@ionic/react";

export default function LotteryPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/" text="" slot="start" />
          <IonTitle>抽籤大會</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* TODO: lottery stage UI */}
      </IonContent>
    </IonPage>
  );
}
