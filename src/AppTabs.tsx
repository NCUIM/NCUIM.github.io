import { Route, Switch } from "react-router-dom";

import LotteryPage from "./pages/LotteryPage";
import LotteryAdminPage from "./pages/LotteryAdminPage";
import NcuAuthCallback from "./pages/NcuAuthCallback";
import TabsShell from "./TabsShell";

// Depth: Switch(1) > Route(2) > TabsShell/LotteryPage(3) — within limit.
// Switch preserves original routing: lottery pages bypass IonTabs so tab animations stay smooth.
const AppTabs = () => (
  <Switch>
    <Route exact path="/auth/ncu/callback" component={NcuAuthCallback} />
    <Route exact path="/stage/lottery" component={LotteryPage} />
    <Route exact path="/admin/lottery" component={LotteryAdminPage} />
    <Route path="/">
      <TabsShell />
    </Route>
  </Switch>
);

export default AppTabs;
