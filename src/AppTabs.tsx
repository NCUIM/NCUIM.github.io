import { lazy, Suspense } from "react";
import { Route, Switch } from "react-router-dom";

import RouteLoadingFallback from "./components/common/RouteLoadingFallback";
import TabsShell from "./TabsShell";

const withRouteSuspense = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => {
  const RouteSuspendedComponent: React.FC = (props) => (
    <Suspense fallback={<RouteLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
  return RouteSuspendedComponent;
};

const LotteryPage = withRouteSuspense(lazy(() => import("./pages/LotteryPage")));
const LotteryAdminPage = withRouteSuspense(lazy(() => import("./pages/LotteryAdminPage")));

// Depth: Switch(1) > Route(2) > TabsShell/LotteryPage(3) — within limit.
// Switch preserves original routing: lottery pages bypass IonTabs so tab animations stay smooth.
const AppTabs = () => (
  <Switch>
    <Route exact path="/stage/lottery" component={LotteryPage} />
    <Route exact path="/admin/lottery" component={LotteryAdminPage} />
    <Route path="/">
      <TabsShell />
    </Route>
  </Switch>
);

export default AppTabs;
