import React, { Suspense } from "react";
import { IonContent, IonPage, IonSpinner } from "@ionic/react";

export const RouteLoadingFallback: React.FC = () => (
  <IonPage style={{ background: "var(--ncu-canvas, #ffffff)" }}>
    <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas, #ffffff)" }}>
      <output
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
      </output>
    </IonContent>
  </IonPage>
);

export const withRouteSuspense = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>
): React.FC<P> => {
  const RouteSuspendedComponent: React.FC<P> = (props) => (
    <Suspense fallback={<RouteLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
  return RouteSuspendedComponent;
};

export default RouteLoadingFallback;
