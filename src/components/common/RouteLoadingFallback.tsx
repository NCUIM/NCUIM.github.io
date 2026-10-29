import React from "react";
import { IonContent, IonPage, IonSpinner } from "@ionic/react";

export const RouteLoadingFallback: React.FC = () => (
  <IonPage style={{ background: "var(--ncu-canvas, #ffffff)" }}>
    <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas, #ffffff)" }}>
      <div
        role="status"
        aria-busy="true"
        aria-label="頁面載入中"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          gap: 16,
        }}
      >
        <IonSpinner name="crescent" color="primary" />
        <span style={{ fontSize: 13, color: "var(--ncu-muted, #666666)" }}>
          載入頁面中…
        </span>
      </div>
    </IonContent>
  </IonPage>
);

export default RouteLoadingFallback;
