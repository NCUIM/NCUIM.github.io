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

// Register custom element stub for <ion-icon> before Stencil/Ionic registers its real component.
// This ensures that even when a test file partially mocks @ionic/react with vi.importActual,
// the underlying web component never makes relative HTTP network requests or triggers
// undefined toLowerCase() render errors in Happy-DOM.
if (typeof customElements !== "undefined" && !customElements.get("ion-icon")) {
  customElements.define(
    "ion-icon",
    class extends HTMLElement {
      static get observedAttributes() {
        return ["icon", "name", "src", "color", "size", "aria-label"];
      }
    },
  );
}

// Suppress Ionicons missing icon warnings in happy-dom test environment
const origConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[Ionicons Warning]")) {
    return;
  }
  origConsoleWarn(...args);
};

// Guard console.error so that only verified Ionic/Stencil internal bundle stack errors
// in Happy-DOM are suppressed, preserving all unrelated application errors and diagnostics.
const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  const isStencilBundleError =
    (typeof first === "string" && (first.includes("p-DqLB8yFQ") || first.includes("p-CHqRYvYm"))) ||
    (first instanceof Error &&
      typeof first.stack === "string" &&
      (first.stack.includes("p-DqLB8yFQ") || first.stack.includes("p-CHqRYvYm")));

  if (isStencilBundleError) {
    return;
  }
  origConsoleError(...args);
};

// Mock IonIcon in @ionic/react setup to avoid overhead and keep shallow testing clean.
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
