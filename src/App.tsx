import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import AppTabs from "./AppTabs";
import PwaInstallPrompt from "./components/pwa/PwaInstallPrompt";

// App.tsx JSX depth: IonApp(1) > IonReactRouter(2) > AppTabs(3) / PwaInstallPrompt(3) — within limit.
// AppTabs.tsx handles IonTabs + IonRouterOutlet + IonTabBar as direct JSX children (Ionic requirement).
const App = () => (
  <IonApp>
    <IonReactRouter basename={import.meta.env.BASE_URL}>
      <AppTabs />
      <PwaInstallPrompt />
    </IonReactRouter>
  </IonApp>
);

export default App;
