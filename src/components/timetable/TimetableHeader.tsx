import React from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  calendarOutline,
  linkOutline,
  logOutOutline,
  refreshOutline,
  swapHorizontalOutline,
} from "ionicons/icons";
import { isIosHeaderMode } from "../../services/platform";

export const TimetableHeader = ({
  cisAuthenticated,
  viewScope,
  enrolledCount,
  onToggleViewScope,
  onOpenCisModal,
  onLogout,
}: Readonly<{
  cisAuthenticated: boolean;
  viewScope: "all" | "mine";
  enrolledCount: number;
  onToggleViewScope: () => void;
  onOpenCisModal: () => void;
  onLogout: () => void;
}>) => {
  // Cupertino centers the title across the full toolbar, so on iOS the session
  // action flanks it on the leading side and the rest stay trailing — md/Material
  // keeps the title in flow at the leading edge, so everything can trail.
  const isIos = isIosHeaderMode();
  const linkButton = (
    <IonButton
      size="small"
      fill="clear"
      onClick={onOpenCisModal}
      aria-label="重新連結"
    >
      <IonIcon slot="start" icon={refreshOutline} />
      <span className="responsive-label">重新連結</span>
    </IonButton>
  );
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/" text="" />
          {isIos && cisAuthenticated && linkButton}
        </IonButtons>
        <IonTitle>{viewScope === "mine" ? "我的課表" : "課表查詢"}</IonTitle>
        <IonButtons slot="end">
          <IonButton
            size="small"
            fill="clear"
            href="https://course.ncu.edu.tw/static/file/14/1014/img/371/COUR_S.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="課務日程"
          >
            <IonIcon slot="start" icon={calendarOutline} />
            <span className="responsive-label">課務日程</span>
          </IonButton>
          {cisAuthenticated ? (
            <>
              <IonButton
                fill={viewScope === "mine" ? "solid" : "outline"}
                size="small"
                onClick={onToggleViewScope}
                style={{ fontSize: 12 }}
                aria-label={viewScope === "mine" ? `我的 (${enrolledCount})` : "全所開課"}
              >
                <IonIcon slot="start" icon={swapHorizontalOutline} />
                <span className="responsive-label">
                  {viewScope === "mine" ? `我的 (${enrolledCount})` : "全所開課"}
                </span>
              </IonButton>
              {!isIos && linkButton}
              <IonButton
                size="small"
                fill="clear"
                onClick={onLogout}
                color="medium"
                aria-label="登出"
              >
                <IonIcon slot="start" icon={logOutOutline} />
                <span className="responsive-label">登出</span>
              </IonButton>
            </>
          ) : (
            <IonButton
              size="small"
              fill="outline"
              onClick={onOpenCisModal}
              aria-label="連結課表"
            >
              <IonIcon slot="start" icon={linkOutline} />
              <span className="responsive-label">連結課表</span>
            </IonButton>
          )}
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};
