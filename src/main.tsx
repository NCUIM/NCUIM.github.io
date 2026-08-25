import { createRoot } from "react-dom/client";
import { IonApp } from "@ionic/react";

import "@ionic/react/css/core.css";
import "./theme/variables.css";

createRoot(document.getElementById("root")!).render(
  <IonApp>
    <div style={{ padding: "var(--ncu-space-4)" }}>
      <h1>NCUIM 2026 Fresher</h1>
    </div>
  </IonApp>,
);
