import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  getPdfPreviewUrl,
  isMobileDevice,
  isSafePublicPdfUrl,
  AttachmentItem,
} from "../components/announcements/DepartmentNewsModal";

describe("DepartmentNewsModal PDF Preview & Mobile Routing", () => {
  const samplePdfUrl = "https://im.mgt.ncu.edu.tw/download/newpost/sample-announcement.pdf";
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 0,
      configurable: true,
    });
  });

  describe("URL Safety Checks (isSafePublicPdfUrl)", () => {
    it("allows trusted NCU department public URLs without credentials", () => {
      expect(isSafePublicPdfUrl(samplePdfUrl)).toBe(true);
      expect(isSafePublicPdfUrl("https://cis.ncu.edu.tw/course/doc.pdf")).toBe(true);
      expect(isSafePublicPdfUrl("https://www.ncu.edu.tw/rules.pdf")).toBe(true);
    });

    it("rejects URLs containing embedded user credentials", () => {
      expect(isSafePublicPdfUrl("https://admin:secret@im.mgt.ncu.edu.tw/doc.pdf")).toBe(false);
    });

    it("rejects URLs with sensitive query token parameters", () => {
      expect(isSafePublicPdfUrl("https://im.mgt.ncu.edu.tw/doc.pdf?token=abc12345")).toBe(false);
      expect(isSafePublicPdfUrl("https://im.mgt.ncu.edu.tw/doc.pdf?auth=xyz")).toBe(false);
      expect(isSafePublicPdfUrl("https://im.mgt.ncu.edu.tw/doc.pdf?apikey=987")).toBe(false);
      expect(isSafePublicPdfUrl("https://im.mgt.ncu.edu.tw/doc.pdf?access_token=key")).toBe(false);
    });

    it("rejects untrusted third-party domains", () => {
      expect(isSafePublicPdfUrl("https://external-confidential.com/doc.pdf")).toBe(false);
    });

    it("falls back to native FitH preview when URL is not safe for third-party forward", () => {
      const sensitiveUrl = "https://im.mgt.ncu.edu.tw/doc.pdf?token=secret";
      const previewUrl = getPdfPreviewUrl(sensitiveUrl, true);
      expect(previewUrl).toBe(`${sensitiveUrl}#view=FitH`);
      expect(previewUrl).not.toContain("docs.google.com");
    });
  });

  describe("getPdfPreviewUrl routing", () => {
    it("returns native FitH URL for desktop preview", () => {
      const url = getPdfPreviewUrl(samplePdfUrl, false);
      expect(url).toBe("https://im.mgt.ncu.edu.tw/download/newpost/sample-announcement.pdf#view=FitH");
    });

    it("returns Google Docs embedded viewer URL for mobile preview of safe public PDFs", () => {
      const url = getPdfPreviewUrl(samplePdfUrl, true);
      expect(url).toBe(
        `https://docs.google.com/viewer?url=${encodeURIComponent(samplePdfUrl)}&embedded=true`
      );
    });

    it("correctly encodes special characters in Chinese PDF URL for mobile preview", () => {
      const chinesePdfUrl = "https://im.mgt.ncu.edu.tw/download/newpost/115學年度入學適用-科目表.pdf";
      const url = getPdfPreviewUrl(chinesePdfUrl, true);
      expect(url).toContain("https://docs.google.com/viewer?url=");
      expect(url).toContain(encodeURIComponent(chinesePdfUrl));
      expect(url).toContain("&embedded=true");
    });
  });

  describe("Mobile Device Detection (isMobileDevice)", () => {
    it("detects Android mobile user agent string as mobile device", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
        configurable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it("detects iPhone user agent string as mobile device", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        configurable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it("returns false on standard desktop user agent without touch points", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        configurable: true,
      });
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 0,
        configurable: true,
      });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe("AttachmentItem Component Iframe Rendering", () => {
    it("renders iframe with Google Docs Viewer when mobile device is detected", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/120.0",
        configurable: true,
      });

      const { container } = render(
        <AttachmentItem
          att={{
            name: "碩士班修業規定.pdf",
            url: samplePdfUrl,
          }}
          idx={0}
          isSelected={true}
          isExpanded={true}
          onTogglePreview={vi.fn()}
        />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toContain("https://docs.google.com/viewer?url=");
      expect(iframe?.getAttribute("src")).toContain(encodeURIComponent(samplePdfUrl));
    });

    it("renders iframe with native FitH URL on desktop environment", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        configurable: true,
      });
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 0,
        configurable: true,
      });

      const { container } = render(
        <AttachmentItem
          att={{
            name: "碩士班修業規定.pdf",
            url: samplePdfUrl,
          }}
          idx={0}
          isSelected={true}
          isExpanded={true}
          onTogglePreview={vi.fn()}
        />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toBe(`${samplePdfUrl}#view=FitH`);
    });
  });
});
