import { setupIonicReact } from "@ionic/react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "@ionic/react/css/ionic.bundle.css";
import "./theme/variables.css";

setupIonicReact();

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
