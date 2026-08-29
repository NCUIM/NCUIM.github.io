/**
 * CIS Session Login Modal
 *
 * Asks the user to paste their JSESSIONID from the browser's DevTools.
 * The user logs into cis.ncu.edu.tw in their own browser first,
 * then copies the cookie value here. We never touch their credentials.
 */

import { useState, useCallback } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonSpinner,
} from "@ionic/react";
import {
  cisLogin,
  sanitizeJsessionId,
  validateJsessionIdFormat,
} from "../services/cis-login";

interface CisLoginModalProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
  readonly onSuccess: () => void;
}

const CisInstructions = () => (
  <div style={{ fontSize: 13, color: "var(--ncu-muted)", marginBottom: 16 }}>
    <p style={{ margin: "0 0 8px" }}>
      <strong>步驟：</strong>
    </p>
    <ol style={{ margin: 0, paddingLeft: 20 }}>
      <li>
        在瀏覽器開啟{" "}
        <a
          href="https://cis.ncu.edu.tw/Course/main/login"
          target="_blank"
          rel="noreferrer"
        >
          cis.ncu.edu.tw
        </a>{" "}
        並登入
      </li>
      <li>
        按 <code>F12</code> 開啟 DevTools
      </li>
      <li>
        到 <code>Application → Cookies → cis.ncu.edu.tw</code>
      </li>
      <li>
        複製 <code>JSESSIONID</code> 的值，貼到下方
      </li>
    </ol>
  </div>
);

const CisModalHeader = ({ onDismiss }: Readonly<{ onDismiss: () => void }>) => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>連結課務系統</IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={onDismiss}>取消</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const CisModalBody = ({
  sessionId,
  loading,
  error,
  onSessionIdChange,
  onLogin,
}: Readonly<{
  sessionId: string;
  loading: boolean;
  error: string | null;
  onSessionIdChange: (val: string) => void;
  onLogin: () => void;
}>) => (
  <IonContent className="ion-padding">
    <CisInstructions />

    <IonItem>
      <IonLabel position="stacked">JSESSIONID</IonLabel>
      <IonInput
        value={sessionId}
        onIonInput={(e) => onSessionIdChange(e.detail.value ?? "")}
        placeholder="例如：7DFF50FF6F2B55531B6A803D2DEAEF4C"
        autocomplete="off"
        clearInput
      />
    </IonItem>

    {error && (
      <IonText
        color="danger"
        style={{ display: "block", marginTop: 12, fontSize: 13 }}
      >
        ⚠ {error}
      </IonText>
    )}

    <IonButton
      expand="block"
      onClick={onLogin}
      disabled={loading}
      style={{ marginTop: 16 }}
    >
      {loading ? (
        <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
      ) : (
        "連結"
      )}
    </IonButton>

    <p
      style={{
        fontSize: 11,
        color: "var(--ncu-muted)",
        textAlign: "center",
        marginTop: 12,
      }}
    >
      Session ID 僅存於你的瀏覽器本地，不會傳送到任何伺服器。
    </p>
  </IonContent>
);

const CisLoginModal = ({
  isOpen,
  onDismiss,
  onSuccess,
}: CisLoginModalProps) => {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionIdChange = useCallback((raw: string) => {
    const cleaned = sanitizeJsessionId(raw);
    setSessionId(cleaned || raw);
    setError(null);
  }, []);

  const handleLogin = useCallback(async () => { // skipcq: JS-R1005
    const formatCheck = validateJsessionIdFormat(sessionId);
    if (!formatCheck.valid) {
      setError(formatCheck.error ?? "JSESSIONID 格式不正確");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await cisLogin(sessionId);
      if (result.ok) {
        onSuccess();
        onDismiss();
        setSessionId("");
      } else {
        setError(result.error ?? "驗證失敗");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "驗證失敗");
    } finally {
      setLoading(false);
    }
  }, [sessionId, onSuccess, onDismiss]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <CisModalHeader onDismiss={onDismiss} />
      <CisModalBody
        sessionId={sessionId}
        loading={loading}
        error={error}
        onSessionIdChange={handleSessionIdChange}
        onLogin={handleLogin}
      />
    </IonModal>
  );
};

export default CisLoginModal;
