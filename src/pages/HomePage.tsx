import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/react";

export default function HomePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>NCUIM 2026 Fresher</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* TODO: module card grid */}
      </IonContent>
    </IonPage>
  );
}
