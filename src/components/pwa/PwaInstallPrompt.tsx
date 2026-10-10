import React, { useState, useEffect } from "react";
import { IonIcon, IonButton } from "@ionic/react";
import { downloadOutline, closeOutline, shareOutline } from "ionicons/icons";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const DISMISSED_STORAGE_KEY = "pwa_install_dismissed_until";
export const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const checkIsStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const isMatchMediaStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const isNavigatorStandalone = Boolean(
    (navigator as unknown as { standalone?: boolean }).standalone
  );
  return isMatchMediaStandalone || isNavigatorStandalone;
};

export const checkIsDismissed = (): boolean => {
  if (typeof localStorage === "undefined") return false;
  try {
    const item = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!item) return false;
    const until = Number.parseInt(item, 10);
    return Date.now() < until;
  } catch {
    return false;
  }
};

export const checkIsIos = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIos;
};

export const checkIsIosSafari = checkIsIos;

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIosGuide, setIsIosGuide] = useState<boolean>(false);

  useEffect(() => {
    if (checkIsStandalone() || checkIsDismissed()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === DISMISSED_STORAGE_KEY && checkIsDismissed()) {
        setShowPrompt(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("storage", handleStorageChange);

    if (checkIsIos()) {
      setIsIosGuide(true);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(
        DISMISSED_STORAGE_KEY,
        (Date.now() + DISMISS_DURATION_MS).toString()
      );
    } catch {
      // Ignore in mock/restricted environments
    }
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div
      data-testid="pwa-install-banner"
      style={{
        position: "fixed",
        bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
        left: 12,
        right: 12,
        maxWidth: 480,
        margin: "0 auto",
        zIndex: 9999,
        background: "var(--ncu-surface, #ffffff)",
        borderRadius: "var(--ncu-radius-lg, 14px)",
        border: "1px solid var(--ncu-border, #e2e8f0)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        padding: isIosGuide ? "10px 14px" : "8px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <img
          src="/icons/icon-192.png"
          alt="CIM-Life"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--ncu-ink, #0f172a)",
              lineHeight: 1.3,
            }}
          >
            安裝 CIM-Life
          </div>
          {isIosGuide && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ncu-muted, #64748b)",
                lineHeight: 1.3,
                marginTop: 2,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                點擊分享 <IonIcon icon={shareOutline} style={{ fontSize: 13 }} /> ➔ 加入主畫面
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {!isIosGuide && (
          <IonButton
            size="small"
            onClick={handleInstallClick}
            style={{
              fontWeight: 600,
              fontSize: 12.5,
              height: 32,
              margin: 0,
            }}
          >
            <IonIcon slot="start" icon={downloadOutline} />
            安裝
          </IonButton>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="稍後再說"
          title="稍後再說"
          style={{
            background: "none",
            border: "none",
            padding: 6,
            cursor: "pointer",
            color: "var(--ncu-muted, #94a3b8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
          }}
        >
          <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
