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
import { Route, Switch } from "react-router-dom";
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

// skipcq: JS-0415 - Ionic React strictly requires direct nesting of IonRouterOutlet, IonTabBar, and IonTabButton inside IonTabs
const App = () => (
  <IonApp>
    <IonReactRouter>
      <Switch>
        <Route exact path="/stage/lottery" component={LotteryPage} />
        <Route exact path="/admin/lottery" component={LotteryAdminPage} />
        <Route path="/">
          <IonTabs>
            <IonRouterOutlet>
              {/* Tab root routes */}
              <Route exact path="/" component={HomePage} tab="home" />
              <Route exact path="/guide" component={GuidePage} tab="guide" />
              <Route exact path="/cards" component={CardsPage} tab="user" />

              {/* Sub-routes under tabs */}
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
        </Route>
      </Switch>
    </IonReactRouter>
  </IonApp>
);

export default App;
