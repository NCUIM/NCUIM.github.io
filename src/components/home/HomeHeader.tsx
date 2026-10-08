import React from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { schoolOutline } from "ionicons/icons";

export const HomeHeader = ({ onOpenQuiz }: Readonly<{ onOpenQuiz: () => void }>) => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>CIM-Life</IonTitle>
      <IonButtons slot="end">
        <IonButton
          fill="clear"
          size="small"
          onClick={onOpenQuiz}
          aria-label="教授"
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: "var(--ncu-primary)",
          }}
        >
          <IonIcon slot="start" icon={schoolOutline} />
          <span className="responsive-label">教授</span>
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);
