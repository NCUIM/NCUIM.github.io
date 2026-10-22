// Global test setup — add custom matchers or mocks here.
import React from "react";
import { vi } from "vitest";

// Fix happy-dom CSSStyleSheet.replaceSync(undefined) bug when Stencil components connect
if (typeof CSSStyleSheet !== "undefined" && CSSStyleSheet.prototype.replaceSync) {
  const origReplaceSync = CSSStyleSheet.prototype.replaceSync;
  CSSStyleSheet.prototype.replaceSync = function (text: string) {
    return origReplaceSync.call(this, typeof text === "string" ? text : "");
  };
}

// Suppress Ionicons missing icon warnings in happy-dom test environment
const origConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[Ionicons Warning]")) {
    return;
  }
  origConsoleWarn(...args);
};

// Suppress Stencil web component circular FiberNode error dumps in happy-dom
const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("Cannot read properties of undefined (reading 'toLowerCase')") ||
    msg.includes("Cannot read properties of undefined (reading 'replace')")
  ) {
    return;
  }
  if (
    args.some(
      (arg) =>
        arg &&
        typeof arg === "object" &&
        ("__stencil__getHostRef" in (arg as object) ||
          Object.keys(arg as object).some((k) => k.startsWith("__reactFiber"))),
    )
  ) {
    return;
  }
  origConsoleError(...args);
};

// Mock IonIcon to prevent Ionicons web component from attempting relative HTTP fetches
// in Happy-DOM, which produces Invalid URL errors and massive circular Fiber node dumps.
vi.mock("@ionic/react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    IonIcon: ({ icon, ...props }: { icon?: string; [key: string]: unknown }) =>
      React.createElement("span", {
        "data-testid": "ion-icon",
        "data-icon": typeof icon === "string" ? icon : "custom-icon",
        ...props,
      }),
  };
});
