import { useEffect, useRef } from "react";

/**
 * Synchronizes an open modal with the browser history stack.
 *
 * Problem on mobile:
 * When a user swipes from the screen edge to go back on mobile browsers (Safari / Chrome),
 * the browser triggers a history 'popstate' event. Because modals are rendered on top of
 * the page without updating the browser history, the browser attempts to navigate away from
 * the underlying page (causing a flash of the previous page/route), while the React modal
 * state remains open.
 *
 * Solution:
 * When the modal opens, this hook pushes a state entry onto window.history.
 * When the user swipes back or taps browser/system back:
 * - 'popstate' fires -> modal calls onDismiss() and closes cleanly without changing page!
 * When the modal is closed programmatically (via close button or backdrop):
 * - If the modal pushed history state, it calls window.history.back() to clean up the stack.
 */
export const useModalHistorySync = (
  isOpen: boolean,
  onDismiss: () => void,
  modalKey: string
) => {
  const isPushedRef = useRef(false);
  const isPopstateClosingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!isPushedRef.current) {
        window.history.pushState({ modal: modalKey }, "");
        isPushedRef.current = true;
      }
      isPopstateClosingRef.current = false;

      const handlePopState = () => {
        if (isPushedRef.current) {
          isPushedRef.current = false;
          isPopstateClosingRef.current = true;
          onDismiss();
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      if (isPushedRef.current && !isPopstateClosingRef.current) {
        isPushedRef.current = false;
        window.history.back();
      }
      isPopstateClosingRef.current = false;
    }
  }, [isOpen, onDismiss, modalKey]);
};
