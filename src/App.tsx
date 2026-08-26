import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import AppTabs from "./AppTabs";

// App.tsx JSX depth: IonApp(1) > IonReactRouter(2) > AppTabs(3) — within limit.
// AppTabs.tsx handles IonTabs + IonRouterOutlet + IonTabBar as direct JSX children (Ionic requirement).
const App = () => (
  <IonApp>
    <IonReactRouter>
      <AppTabs />
    </IonReactRouter>
  </IonApp>
);

export default App;
