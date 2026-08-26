import { setupIonicReact } from "@ionic/react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "@ionic/react/css/ionic.bundle.css";
import "./theme/variables.css";

setupIonicReact();

createRoot(document.getElementById("root")!).render(<App />);
