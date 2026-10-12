import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useModalHistorySync,
  markModalDismissed,
  isModalDismissCooldown,
} from "../utils/useModalHistorySync";

describe("useModalHistorySync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.history.replaceState(null, "");
  });

  it("pushes history state when modal opens", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const onDismiss = vi.fn();

    const { rerender } = renderHook(
      ({ isOpen }) => useModalHistorySync(isOpen, onDismiss, "test-modal"),
      { initialProps: { isOpen: false } }
    );

    expect(pushSpy).not.toHaveBeenCalled();

    rerender({ isOpen: true });
    expect(pushSpy).toHaveBeenCalledWith({ modal: "test-modal" }, "");
  });

  it("calls onDismiss when popstate event fires while open", () => {
    const onDismiss = vi.fn();

    renderHook(() => useModalHistorySync(true, onDismiss, "test-modal"));

    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(isModalDismissCooldown()).toBe(true);
  });

  it("reverts history when modal is closed via UI button", () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const onDismiss = vi.fn();

    const { rerender } = renderHook(
      ({ isOpen }) => useModalHistorySync(isOpen, onDismiss, "test-modal"),
      { initialProps: { isOpen: true } }
    );

    rerender({ isOpen: false });
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it("does not call history.back if user already navigated to a new route", () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const onDismiss = vi.fn();

    const { rerender } = renderHook(
      ({ isOpen }) => useModalHistorySync(isOpen, onDismiss, "test-modal"),
      { initialProps: { isOpen: true } }
    );

    // Simulate route navigation replacing history state
    window.history.replaceState({ usr: "/announcements" }, "");

    rerender({ isOpen: false });
    expect(backSpy).not.toHaveBeenCalled();
  });

  it("guards against ghost click reopening with isModalDismissCooldown", () => {
    markModalDismissed();
    expect(isModalDismissCooldown(400)).toBe(true);

    // After cooldown period expires
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 500);
    expect(isModalDismissCooldown(400)).toBe(false);
  });

  it("blocks rapid reopen trigger handler when cooldown is active", () => {
    markModalDismissed();
    let opened = false;
    const guardedTrigger = () => {
      if (isModalDismissCooldown()) return;
      opened = true;
    };

    guardedTrigger();
    expect(opened).toBe(false);

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 500);
    guardedTrigger();
    expect(opened).toBe(true);
  });

  it("uses CloseWatcher when supported without manipulating history", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const onDismiss = vi.fn();
    const mockDestroy = vi.fn();

    let closeHandler: (() => void) | null = null;
    class MockCloseWatcher {
      destroy = mockDestroy;
      set onclose(fn: () => void) {
        closeHandler = fn;
      }
    }

    (window as any).CloseWatcher = MockCloseWatcher;

    try {
      const { unmount } = renderHook(() =>
        useModalHistorySync(true, onDismiss, "watcher-modal")
      );

      expect(pushSpy).not.toHaveBeenCalled();
      expect(closeHandler).toBeDefined();

      if (closeHandler) {
        (closeHandler as () => void)();
      }
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(isModalDismissCooldown()).toBe(true);

      unmount();
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    } finally {
      delete (window as any).CloseWatcher;
    }
  });
});
