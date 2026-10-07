import { useCallback, useMemo } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  useIonToast,
} from "@ionic/react";
import {
  bookmarkOutline,
  copyOutline,
  openOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import { useModalHistorySync } from "../utils/useModalHistorySync";
import { generateBookmarkletCode } from "../services/cis-bookmarklet";

export { generateBookmarkletCode };

interface CisLoginModalProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
}

const BookmarkletInstructions = ({
  bookmarkletCode,
  onCopy,
}: Readonly<{
  bookmarkletCode: string;
  onCopy: () => void;
}>) => (
  <div style={{ fontSize: 13.5, color: "var(--ncu-ink)", lineHeight: 1.6 }}>
    <div
      style={{
        background: "var(--ncu-surface)",
        border: "1.5px solid var(--ncu-border)",
        borderRadius: "var(--ncu-radius-md)",
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ncu-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <IonIcon icon={bookmarkOutline} />
        <span>拖曳至書籤列，登入後點擊同步</span>
      </div>

      <div style={{ textAlign: "center", margin: "12px 0 10px" }}>
        <a
          href={bookmarkletCode}
          title="將此按鈕拖曳至書籤列"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--ncu-primary)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "var(--ncu-radius-md)",
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "var(--ncu-shadow-sm)",
            cursor: "grab",
          }}
        >
          <IonIcon icon={bookmarkOutline} style={{ fontSize: 18 }} />
          <span>🔖 拖曳此按鈕至書籤列</span>
        </a>
      </div>

      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <IonButton size="small" fill="outline" onClick={onCopy} style={{ fontSize: 12 }}>
          <IonIcon slot="start" icon={copyOutline} />
          複製書籤代碼
        </IonButton>
      </div>

      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
        <li style={{ marginBottom: 4 }}>拖曳按鈕到瀏覽器書籤列</li>
        <li style={{ marginBottom: 4 }}>開啟 <a href="https://cis.ncu.edu.tw/Course/main/login" target="_blank" rel="noreferrer" style={{ color: "var(--ncu-primary)", fontWeight: 600 }}>課務系統 <IonIcon icon={openOutline} style={{ fontSize: 11, verticalAlign: "middle" }} /></a> 並登入</li>
        <li>點擊書籤，自動匯入課表</li>
      </ol>
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        background: "rgba(16, 185, 129, 0.06)",
        borderRadius: "var(--ncu-radius-sm)",
        border: "1px solid rgba(16, 185, 129, 0.15)",
        color: "var(--ncu-muted)",
        fontSize: 11.5,
      }}
    >
      <IonIcon icon={shieldCheckmarkOutline} style={{ color: "#10b981", fontSize: 14, flexShrink: 0 }} />
      <span>代碼僅在本地執行，不上傳任何帳號密碼。</span>
    </div>
  </div>
);

const CisModalHeader = ({ onDismiss }: Readonly<{ onDismiss: () => void }>) => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>同步課務修課紀錄</IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={onDismiss}>關閉</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const CisLoginModal = ({
  isOpen,
  onDismiss,
}: Readonly<CisLoginModalProps>) => {
  useModalHistorySync(isOpen, onDismiss, "cis-login-modal");
  const [presentToast] = useIonToast();

  const targetUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://ncuim.github.io/tools/credit";
    const path = window.location.pathname || "/tools/credit";
    return `${window.location.origin}${path}`;
  }, []);

  const bookmarkletCode = useMemo(
    () => generateBookmarkletCode(targetUrl),
    [targetUrl],
  );

  const handleCopyBookmarklet = useCallback(() => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      presentToast({
        message: "📋 已複製書籤代碼！可在瀏覽器書籤網址欄貼上。",
        duration: 3000,
        color: "success",
        position: "top",
      });
    }).catch(() => {
      presentToast({
        message: "複製失敗，請手動選取代碼複製",
        duration: 3000,
        color: "warning",
        position: "top",
      });
    });
  }, [bookmarkletCode, presentToast]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <CisModalHeader onDismiss={onDismiss} />
      <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
        <BookmarkletInstructions
          bookmarkletCode={bookmarkletCode}
          onCopy={handleCopyBookmarklet}
        />
      </IonContent>
    </IonModal>
  );
};

export default CisLoginModal;
