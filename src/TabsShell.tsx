import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from "@ionic/react";
import { Route } from "react-router-dom";
import { home, book, person } from "ionicons/icons";

import HomePage from "./pages/HomePage";
import CardsPage from "./pages/CardsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SeatsPage from "./pages/SeatsPage";
import TimetablePage from "./pages/TimetablePage";
import FoodPage from "./pages/FoodPage";
import CreditPage from "./pages/CreditPage";
import GuidePage from "./pages/GuidePage";

// Depth: IonTabs(1) > IonRouterOutlet/IonTabBar(2) > Route/IonTabButton(3) > IonIcon/IonLabel(4)
const TabsShell = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/" component={HomePage} tab="home" />
      <Route exact path="/guide" component={GuidePage} tab="guide" />
      <Route exact path="/cards" component={CardsPage} tab="user" />
      <Route exact path="/leaderboard" component={LeaderboardPage} tab="user" />
      <Route exact path="/seats" component={SeatsPage} tab="home" />
      <Route exact path="/timetable" component={TimetablePage} tab="home" />
      <Route exact path="/food" component={FoodPage} tab="home" />
      <Route exact path="/tools/credit" component={CreditPage} tab="home" />
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/">
        <IonIcon icon={home} />
        <IonLabel>首頁</IonLabel>
      </IonTabButton>
      <IonTabButton tab="guide" href="/guide">
        <IonIcon icon={book} />
        <IonLabel>指南</IonLabel>
      </IonTabButton>
      <IonTabButton tab="user" href="/cards">
        <IonIcon icon={person} />
        <IonLabel>使用者</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default TabsShell;
