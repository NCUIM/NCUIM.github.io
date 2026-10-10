import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from "@ionic/react";
import { Route, Redirect } from "react-router-dom";
import { grid, book, newspaper } from "ionicons/icons";

import HomePage from "./pages/HomePage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
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
      <Route exact path="/announcements" component={AnnouncementsPage} tab="announcements" />
      <Route exact path="/seats" component={SeatsPage} tab="home" />
      <Route exact path="/timetable" component={TimetablePage} tab="home" />
      <Route exact path="/food" component={FoodPage} tab="home" />
      <Route exact path="/tools/credit" component={CreditPage} tab="home" />
      <Route exact path="/cards">
        <Redirect to="/announcements" />
      </Route>
      <Route exact path="/leaderboard">
        <Redirect to="/announcements" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/">
        <IonIcon icon={grid} />
        <IonLabel>常用</IonLabel>
      </IonTabButton>
      <IonTabButton tab="guide" href="/guide">
        <IonIcon icon={book} />
        <IonLabel>指南</IonLabel>
      </IonTabButton>
      <IonTabButton tab="announcements" href="/announcements">
        <IonIcon icon={newspaper} />
        <IonLabel>公告</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default TabsShell;
