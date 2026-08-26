import { IonPage, IonHeader, IonToolbar, IonTitle, IonBackButton, IonContent } from "@ionic/react";

export default function FoodPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/" text="" slot="start" />
          <IonTitle>中大美食地圖</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* TODO: food map UI */}
      </IonContent>
    </IonPage>
  );
}
