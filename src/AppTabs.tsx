import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from "@ionic/react";
import { Route } from "react-router-dom";
import { home, book, person } from "ionicons/icons";

import HomePage from "./pages/HomePage";
import CardsPage from "./pages/CardsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SeatsPage from "./pages/SeatsPage";
import LotteryPage from "./pages/LotteryPage";
import LotteryAdminPage from "./pages/LotteryAdminPage";
import TimetablePage from "./pages/TimetablePage";
import FoodPage from "./pages/FoodPage";
import CreditPage from "./pages/CreditPage";
import GuidePage from "./pages/GuidePage";

// IonTabs must have IonRouterOutlet and IonTabBar as direct JSX children (Ionic React requirement).
// Depth from IonTabs root: IonTabs(1) > IonRouterOutlet/IonTabBar(2) > Route/IonTabButton(3) > IonIcon/IonLabel(4)
const AppTabs = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/" component={HomePage} />
      <Route exact path="/guide" component={GuidePage} />
      <Route exact path="/cards" component={CardsPage} />
      <Route exact path="/leaderboard" component={LeaderboardPage} />
      <Route exact path="/seats" component={SeatsPage} />
      <Route exact path="/timetable" component={TimetablePage} />
      <Route exact path="/food" component={FoodPage} />
      <Route exact path="/tools/credit" component={CreditPage} />
      <Route exact path="/stage/lottery" component={LotteryPage} />
      <Route exact path="/admin/lottery" component={LotteryAdminPage} />
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

export default AppTabs;
