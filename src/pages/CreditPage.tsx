import { IonPage, IonHeader, IonToolbar, IonTitle, IonBackButton, IonContent } from "@ionic/react";

export default function CreditPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/" text="" slot="start" />
          <IonTitle>學分試算</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* TODO: credit calculator UI */}
      </IonContent>
    </IonPage>
  );
}
