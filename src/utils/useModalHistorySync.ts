import { useEffect, useRef } from "react";

let lastModalDismissTimestamp = 0;

/**
 * Record the timestamp when any modal is dismissed.
 * Used to guard against mobile ghost clicks (click-through) that occur
 * when touch release (touchend) dispatches a synthetic click on whatever
 * element was uncovered underneath the closing modal.
 */
export const markModalDismissed = (): void => {
  lastModalDismissTimestamp = Date.now();
};

/**
 * Checks whether a modal was dismissed very recently (within cooldownMs).
 * Call this in modal-opening button handlers to prevent ghost clicks from
 * immediately reopening the modal upon gesture or hardware back.
 */
export const isModalDismissCooldown = (cooldownMs = 400): boolean => {
  return Date.now() - lastModalDismissTimestamp < cooldownMs;
};

/**
 * Synchronizes an open modal with the browser history stack and CloseWatcher API.
 *
 * Modern Android/Desktop CloseWatcher support:
 * - If CloseWatcher is supported by the browser (Chrome 120+, modern Edge),
 *   it directly intercepts close requests (hardware back button / gesture / Esc key)
 *   without polluting or manipulating the browser's navigation history stack.
 *
 * Fallback (Safari / older browsers):
 * - Pushes a dummy state onto window.history.
 * - Listens for 'popstate' and triggers onDismiss().
 * - Reverts the pushed state cleanly if closed via UI button.
 */
export const useModalHistorySync = (
  isOpen: boolean,
  onDismiss: () => void,
  modalKey: string
) => {
  const isPushedRef = useRef(false);
  const isPopstateClosingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (isOpen) {
      // 1. Try CloseWatcher API if available
      if (typeof window !== "undefined" && "CloseWatcher" in window) {
        try {
          const watcher = new (window as any).CloseWatcher();
          watcher.onclose = () => {
            markModalDismissed();
            onDismissRef.current();
          };
          return () => {
            watcher.destroy();
          };
        } catch {
          // Fall back to history manipulation if CloseWatcher instantiation fails
        }
      }

      // 2. Fallback: window.history.pushState
      if (!isPushedRef.current) {
        window.history.pushState({ modal: modalKey }, "");
        isPushedRef.current = true;
      }
      isPopstateClosingRef.current = false;

      const handlePopState = () => {
        if (isPushedRef.current) {
          isPushedRef.current = false;
          isPopstateClosingRef.current = true;
          markModalDismissed();
          onDismissRef.current();
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      if (isPushedRef.current && !isPopstateClosingRef.current) {
        isPushedRef.current = false;
        if (window.history.state?.modal === modalKey) {
          window.history.back();
        }
      }
      isPopstateClosingRef.current = false;
    }
  }, [isOpen, modalKey]);
};
