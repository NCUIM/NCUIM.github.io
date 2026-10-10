import { setupIonicReact } from "@ionic/react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "@ionic/react/css/ionic.bundle.css";
import "./theme/variables.css";

setupIonicReact();

if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed, gracefully ignore
    });
  });
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
