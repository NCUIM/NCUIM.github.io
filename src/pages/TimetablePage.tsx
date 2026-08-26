import { IonPage, IonHeader, IonToolbar, IonTitle, IonBackButton, IonContent } from "@ionic/react";

export default function TimetablePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/" text="" slot="start" />
          <IonTitle>全系課表</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* TODO: timetable grid UI */}
      </IonContent>
    </IonPage>
  );
}
