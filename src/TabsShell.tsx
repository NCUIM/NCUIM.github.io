import { lazy } from "react";
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from "@ionic/react";
import { Route, Redirect } from "react-router-dom";
import { grid, book, newspaper } from "ionicons/icons";
import { withRouteSuspense } from "./components/common/RouteLoadingFallback";

const HomePage = withRouteSuspense(lazy(() => import("./pages/HomePage")));
const GuidePage = withRouteSuspense(lazy(() => import("./pages/GuidePage")));
const AnnouncementsPage = withRouteSuspense(lazy(() => import("./pages/AnnouncementsPage")));
const SeatsPage = withRouteSuspense(lazy(() => import("./pages/SeatsPage")));
const TimetablePage = withRouteSuspense(lazy(() => import("./pages/TimetablePage")));
const FoodPage = withRouteSuspense(lazy(() => import("./pages/FoodPage")));
const CreditPage = withRouteSuspense(lazy(() => import("./pages/CreditPage")));

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
