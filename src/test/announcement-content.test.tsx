import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  isSafeImageUrl,
  parseContentSegments,
  AnnouncementContent,
} from "../components/announcements/AnnouncementContent";

describe("AnnouncementContent Security & Parsing", () => {
  describe("isSafeImageUrl validation", () => {
    it("allows valid GitHub user-attachments URLs", () => {
      const url = "https://github.com/user-attachments/assets/12345678-abcd-ef01-2345-6789abcdef01";
      expect(isSafeImageUrl(url)).toBe(true);
    });

    it("allows trusted GitHub raw / user-images URLs", () => {
      expect(isSafeImageUrl("https://raw.githubusercontent.com/org/repo/main/poster.png")).toBe(true);
      expect(isSafeImageUrl("https://user-images.githubusercontent.com/1234/5678.jpg")).toBe(true);
    });

    it("allows HTTPS URLs with standard image extensions", () => {
      expect(isSafeImageUrl("https://example.com/assets/banner.png")).toBe(true);
      expect(isSafeImageUrl("https://example.com/images/flyer.webp")).toBe(true);
      expect(isSafeImageUrl("https://example.com/images/icon.svg")).toBe(true);
    });

    it("blocks javascript: scheme injection", () => {
      expect(isSafeImageUrl("javascript:alert('XSS')")).toBe(false);
      expect(isSafeImageUrl("javascript:/*--></title></style>*/alert(1)")).toBe(false);
    });

    it("blocks data: scheme URLs", () => {
      expect(isSafeImageUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeImageUrl("data:image/svg+xml;base64,PHN2Zz4...")).toBe(false);
    });

    it("blocks insecure http: URLs", () => {
      expect(isSafeImageUrl("http://example.com/banner.png")).toBe(false);
    });

    it("blocks non-image executable or unknown payloads on untrusted hosts", () => {
      expect(isSafeImageUrl("https://malicious.com/payload.exe")).toBe(false);
      expect(isSafeImageUrl("https://malicious.com/api/steal")).toBe(false);
    });

    it("handles malformed URLs safely without throwing", () => {
      expect(isSafeImageUrl("not-a-url")).toBe(false);
      expect(isSafeImageUrl("")).toBe(false);
    });
  });

  describe("parseContentSegments", () => {
    it("returns empty array for empty string", () => {
      expect(parseContentSegments("")).toEqual([]);
    });

    it("parses pure plain text as a single text segment", () => {
      const text = "這是普通公告內容，無圖片。";
      const segments = parseContentSegments(text);
      expect(segments).toEqual([{ type: "text", content: text }]);
    });

    it("extracts safe markdown images and surrounding text", () => {
      const text = "請看迎新海報：\n![迎新海報](https://github.com/user-attachments/assets/xyz)\n歡迎踴躍報名！";
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ type: "text", content: "請看迎新海報：\n" });
      expect(segments[1]).toEqual({
        type: "image",
        content: "https://github.com/user-attachments/assets/xyz",
        alt: "迎新海報",
      });
      expect(segments[2]).toEqual({ type: "text", content: "\n歡迎踴躍報名！" });
    });

    it("treats malicious javascript: syntax as pure text without image extraction", () => {
      const text = "惡意攻擊：![點我看獎勵](javascript:alert(1))";
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({
        type: "text",
        content: "惡意攻擊：![點我看獎勵](javascript:alert(1))",
      });
    });

    it("falls back to plain text for untrusted HTTPS URLs without image extensions", () => {
      const text = "非圖片連結：![檔案](https://malicious.com/payload.exe)";
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ type: "text", content: "非圖片連結：" });
      expect(segments[1]).toEqual({
        type: "text",
        content: "![檔案](https://malicious.com/payload.exe)",
      });
    });
  });

  describe("AnnouncementContent React component", () => {
    it("renders image with secure attributes (lazy, noopener, rel)", () => {
      const content = "歡迎參加：\n![活動資訊](https://github.com/user-attachments/assets/camp-flyer.png)";
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img", { name: "活動資訊" });
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe("https://github.com/user-attachments/assets/camp-flyer.png");
      expect(img.getAttribute("loading")).toBe("lazy");

      const link = img.closest("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("does not render img tag when payload is an unsafe scheme", () => {
      const content = "![攻擊](javascript:alert(document.cookie))";
      render(<AnnouncementContent content={content} />);

      expect(screen.queryByRole("img")).toBeNull();
      expect(screen.getByText("![攻擊](javascript:alert(document.cookie))")).toBeTruthy();
    });
  });
});
