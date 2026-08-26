import {
  IonApp,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route } from "react-router-dom";
import { home, scan, trophy, person } from "ionicons/icons";

import HomePage from "./pages/HomePage";
import CardsPage from "./pages/CardsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SeatsPage from "./pages/SeatsPage";
import LotteryPage from "./pages/LotteryPage";
import TimetablePage from "./pages/TimetablePage";
import FoodPage from "./pages/FoodPage";
import CreditPage from "./pages/CreditPage";
import GuidePage from "./pages/GuidePage";

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            {/* Tab root routes */}
            <Route exact path="/" component={HomePage} tab="home" />
            <Route exact path="/cards" component={CardsPage} tab="scan" />
            <Route exact path="/leaderboard" component={LeaderboardPage} tab="leaderboard" />
            <Route exact path="/guide" component={GuidePage} tab="profile" />

            {/* Sub-routes under home tab */}
            <Route exact path="/seats" component={SeatsPage} tab="home" />
            <Route exact path="/stage/lottery" component={LotteryPage} tab="home" />
            <Route exact path="/timetable" component={TimetablePage} tab="home" />
            <Route exact path="/food" component={FoodPage} tab="home" />
            <Route exact path="/tools/credit" component={CreditPage} tab="home" />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/">
              <IonIcon icon={home} />
              <IonLabel>首頁</IonLabel>
            </IonTabButton>
            <IonTabButton tab="scan" href="/cards">
              <IonIcon icon={scan} />
              <IonLabel>掃描</IonLabel>
            </IonTabButton>
            <IonTabButton tab="leaderboard" href="/leaderboard">
              <IonIcon icon={trophy} />
              <IonLabel>排行榜</IonLabel>
            </IonTabButton>
            <IonTabButton tab="profile" href="/guide">
              <IonIcon icon={person} />
              <IonLabel>我的</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}
