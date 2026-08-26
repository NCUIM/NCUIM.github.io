import "react-router-dom";

declare module "react-router-dom" {
  export interface RouteProps {
    /** Ionic tab identifier for IonTabs integration. */
    tab?: string;
  }
}
