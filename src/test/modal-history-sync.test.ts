import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useModalHistorySync } from "../utils/useModalHistorySync";

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
});
