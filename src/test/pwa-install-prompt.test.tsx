import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import PwaInstallPrompt, {
  checkIsStandalone,
  checkIsDismissed,
  checkIsIosSafari,
  DISMISSED_STORAGE_KEY,
} from "../components/pwa/PwaInstallPrompt";

describe("PwaInstallPrompt Component and PWA Utilities", () => {
  const originalUserAgent = navigator.userAgent;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  afterEach(() => {
    localStorage.clear();
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(navigator, "standalone", {
      value: undefined,
      configurable: true,
    });
  });

  describe("checkIsStandalone", () => {
    it("returns false by default in standard browser tab", () => {
      expect(checkIsStandalone()).toBe(false);
    });

    it("returns true when display-mode: standalone media query matches", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(checkIsStandalone()).toBe(true);
    });

    it("returns true when navigator.standalone is true (iOS standalone)", () => {
      Object.defineProperty(navigator, "standalone", {
        value: true,
        configurable: true,
      });
      expect(checkIsStandalone()).toBe(true);
    });
  });

  describe("checkIsDismissed", () => {
    it("returns false when localStorage has no record", () => {
      expect(checkIsDismissed()).toBe(false);
    });

    it("returns true when dismiss timestamp is in the future", () => {
      localStorage.setItem(DISMISSED_STORAGE_KEY, (Date.now() + 100000).toString());
      expect(checkIsDismissed()).toBe(true);
    });

    it("returns false when dismiss timestamp is expired", () => {
      localStorage.setItem(DISMISSED_STORAGE_KEY, (Date.now() - 1000).toString());
      expect(checkIsDismissed()).toBe(false);
    });
  });

  describe("checkIsIosSafari", () => {
    it("returns true for iOS Safari user agent", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        configurable: true,
      });
      expect(checkIsIosSafari()).toBe(true);
    });

    it("returns false for Chrome on iOS (CriOS)", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.0.0 Mobile/15E148 Safari/604.1",
        configurable: true,
      });
      expect(checkIsIosSafari()).toBe(false);
    });

    it("returns false for desktop Chrome", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        configurable: true,
      });
      expect(checkIsIosSafari()).toBe(false);
    });
  });

  describe("PwaInstallPrompt UI and User Interactions", () => {
    it("does not render when user is already in standalone mode", () => {
      Object.defineProperty(navigator, "standalone", {
        value: true,
        configurable: true,
      });
      render(<PwaInstallPrompt />);
      expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
    });

    it("does not render when dismissal cooldown is active", () => {
      localStorage.setItem(DISMISSED_STORAGE_KEY, (Date.now() + 100000).toString());
      render(<PwaInstallPrompt />);
      expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
    });

    it("renders prompt when beforeinstallprompt event is dispatched and handles install click", async () => {
      render(<PwaInstallPrompt />);
      expect(screen.queryByTestId("pwa-install-banner")).toBeNull();

      const promptMock = vi.fn().mockResolvedValue(undefined);
      const fakeEvent = new Event("beforeinstallprompt") as any;
      fakeEvent.prompt = promptMock;
      fakeEvent.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });

      act(() => {
        window.dispatchEvent(fakeEvent);
      });

      expect(screen.getByTestId("pwa-install-banner")).toBeDefined();
      expect(screen.getByText("安裝 CIM-Life 到主畫面")).toBeDefined();

      const installButton = screen.getByText("安裝");
      await act(async () => {
        fireEvent.click(installButton);
      });

      expect(promptMock).toHaveBeenCalled();
    });

    it("hides banner and sets cooldown when dismiss button is clicked", () => {
      render(<PwaInstallPrompt />);

      const fakeEvent = new Event("beforeinstallprompt") as any;
      fakeEvent.prompt = vi.fn();
      fakeEvent.userChoice = Promise.resolve({ outcome: "dismissed" });

      act(() => {
        window.dispatchEvent(fakeEvent);
      });

      const dismissButton = screen.getByTitle("稍後再說");
      act(() => {
        fireEvent.click(dismissButton);
      });

      expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
      const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(parseInt(stored!, 10)).toBeGreaterThan(Date.now());
    });

    it("renders iOS Safari instruction text on iOS devices", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        configurable: true,
      });

      render(<PwaInstallPrompt />);

      expect(screen.getByTestId("pwa-install-banner")).toBeDefined();
      expect(screen.getByText(/點擊下方分享/)).toBeDefined();
      expect(screen.queryByText("安裝")).toBeNull(); // iOS doesn't have programmatic install button
    });
  });
});
