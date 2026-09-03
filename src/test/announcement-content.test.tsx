import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  isSafeImageUrl,
  isSafeLinkUrl,
  parseInlineSegments,
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

  describe("isSafeLinkUrl validation", () => {
    it("allows https: and http: URLs", () => {
      expect(isSafeLinkUrl("https://drive.google.com/folder")).toBe(true);
      expect(isSafeLinkUrl("http://portal.ncu.edu.tw")).toBe(true);
    });

    it("blocks javascript:, data:, and malformed schemes", () => {
      expect(isSafeLinkUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeLinkUrl("data:text/html,bad")).toBe(false);
      expect(isSafeLinkUrl("not-a-url")).toBe(false);
    });
  });

  describe("parseInlineSegments", () => {
    it("parses bare URL like Issue #25 Google Drive folder link", () => {
      const url = "https://drive.google.com/drive/folders/1UjGO9JeJuUVcN2PXq0a9vT0sRaskHbgr?usp=sharing";
      const segments = parseInlineSegments(url, "test-seg");
      expect(segments).toEqual([
        {
          id: "test-seg-l-0",
          type: "link",
          text: url,
          url,
        },
      ]);
    });

    it("parses markdown links [text](url)", () => {
      const text = "請至 [茶會簡報雲端](https://drive.google.com/folder) 下載。";
      const segments = parseInlineSegments(text, "test-seg");
      expect(segments).toEqual([
        { id: "test-seg-t-0", type: "text", text: "請至 " },
        { id: "test-seg-l-3", type: "link", text: "茶會簡報雲端", url: "https://drive.google.com/folder" },
        { id: "test-seg-t-44", type: "text", text: " 下載。" },
      ]);
    });

    it("strips trailing punctuation from bare URLs", () => {
      const text = "系網請見 https://im.ncu.edu.tw。 謝謝！";
      const segments = parseInlineSegments(text, "test-seg");
      expect(segments).toEqual([
        { id: "test-seg-t-0", type: "text", text: "系網請見 " },
        { id: "test-seg-l-5", type: "link", text: "https://im.ncu.edu.tw", url: "https://im.ncu.edu.tw" },
        { id: "test-seg-t-26", type: "text", text: "。" },
        { id: "test-seg-t-27", type: "text", text: " 謝謝！" },
      ]);
    });

    it("blocks javascript: links and leaves them as plain text", () => {
      const text = "惡意 [點我領獎](javascript:alert(1))";
      const segments = parseInlineSegments(text, "test-seg");
      expect(segments).toEqual([
        { id: "test-seg-t-0", type: "text", text: "惡意 [點我領獎](javascript:alert(1))" },
      ]);
    });
  });

  describe("parseContentSegments", () => {
    it("returns empty array for empty string", () => {
      expect(parseContentSegments("")).toEqual([]);
    });

    it("parses pure plain text as a single text segment", () => {
      const text = "這是普通公告內容，無圖片。";
      const segments = parseContentSegments(text);
      expect(segments).toEqual([{ id: "text-0", type: "text", content: text }]);
    });

    it("extracts safe markdown images and surrounding text", () => {
      const text = "請看迎新海報：\n![迎新海報](https://github.com/user-attachments/assets/xyz)\n歡迎踴躍報名！";
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ id: "text-0", type: "text", content: "請看迎新海報：" });
      expect(segments[1]).toEqual({
        id: "img-8",
        type: "image",
        content: "https://github.com/user-attachments/assets/xyz",
        alt: "迎新海報",
      });
      expect(segments[2]).toEqual({ id: "text-63", type: "text", content: "歡迎踴躍報名！" });
    });

    it("treats malicious javascript: syntax as pure text without image extraction", () => {
      const text = "惡意攻擊：![點我看獎勵](javascript:alert(1))";
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({
        id: "text-0",
        type: "text",
        content: "惡意攻擊：![點我看獎勵](javascript:alert(1))",
      });
    });

    it("falls back to plain text for untrusted HTTPS URLs without image extensions", () => {
      const text = "非圖片連結：![檔案](https://malicious.com/payload.exe)";
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ id: "text-0", type: "text", content: "非圖片連結：" });
      expect(segments[1]).toEqual({
        id: "text-6",
        type: "text",
        content: "![檔案](https://malicious.com/payload.exe)",
      });
    });
  });

  describe("AnnouncementContent React component", () => {
    it("renders image with secure attributes (lazy loading, no raw asset link)", () => {
      const content = "歡迎參加：\n![活動資訊](https://github.com/user-attachments/assets/camp-flyer.png)";
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img", { name: "活動資訊" });
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe("https://github.com/user-attachments/assets/camp-flyer.png");
      expect(img.getAttribute("loading")).toBe("lazy");

      // Standalone images should not wrap in anchor tags pointing to raw asset
      expect(img.closest("a")).toBeNull();
    });

    it("renders clickable hyperlinks for bare URLs and markdown links", () => {
      const content = "請點選：[簡報連結](https://drive.google.com/deck) 或直接造訪 https://drive.google.com/folder";
      render(<AnnouncementContent content={content} />);

      const mdLink = screen.getByRole("link", { name: /簡報連結/ });
      expect(mdLink).toBeTruthy();
      expect(mdLink.getAttribute("href")).toBe("https://drive.google.com/deck");
      expect(mdLink.getAttribute("target")).toBe("_blank");
      expect(mdLink.getAttribute("rel")).toBe("noopener noreferrer");

      const bareLink = screen.getByRole("link", { name: /https:\/\/drive\.google\.com\/folder/ });
      expect(bareLink).toBeTruthy();
      expect(bareLink.getAttribute("href")).toBe("https://drive.google.com/folder");
      expect(bareLink.getAttribute("target")).toBe("_blank");
      expect(bareLink.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("extracts HTML img tags with width and alt attributes", () => {
      const text =
        '排球群組：\n<img width="100" height="100" alt="Image" src="https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460" />\n歡迎加入！';
      const segments = parseContentSegments(text);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ id: "text-0", type: "text", content: "排球群組：" });
      expect(segments[1]).toEqual({
        id: "img-6",
        type: "image",
        content: "https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460",
        alt: "Image",
        width: 100,
      });
      expect(segments[2]).toEqual({ id: "text-136", type: "text", content: "歡迎加入！" });
    });

    it("does not render img tag when payload is an unsafe scheme", () => {
      const content = "![攻擊](javascript:alert(document.cookie))";
      render(<AnnouncementContent content={content} />);

      expect(screen.queryByRole("img")).toBeNull();
      expect(screen.getByText("![攻擊](javascript:alert(document.cookie))")).toBeTruthy();
    });

    it("renders HTML img tags with specified width attribute safely", () => {
      const content =
        '👇 排球群組 👇\nhttps://line.me/ti/g/tyMF8YycaA\n<img width="100" height="100" alt="Image" src="https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460" />';
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img", { name: "Image" });
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe(
        "https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460",
      );
      expect(img.style.width).toBe("100px");

      const lineLink = screen.getByRole("link", { name: /https:\/\/line\.me\/ti\/g\/tyMF8YycaA/ });
      expect(lineLink).toBeTruthy();
      expect(lineLink.getAttribute("href")).toBe("https://line.me/ti/g/tyMF8YycaA");
    });

    it("discards onerror or script injection inside HTML img tags", () => {
      const content =
        '<img src="https://github.com/user-attachments/assets/valid-pic.png" onerror="alert(1)" />';
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img");
      expect(img).toBeTruthy();
      expect(img.getAttribute("onerror")).toBeNull();
      expect(img.getAttribute("src")).toBe(
        "https://github.com/user-attachments/assets/valid-pic.png",
      );
    });

    it("handles linked HTML img tag, jumping to target linkUrl instead of image asset", () => {
      const content =
        '<a href="https://line.me/ti/g/abc">\n<img width="100" alt="群組 QR Code" src="https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460" />\n</a>';
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img", { name: "群組 QR Code" });
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe(
        "https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460",
      );

      const link = img.closest("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("https://line.me/ti/g/abc");
      expect(link?.getAttribute("target")).toBe("_blank");
    });

    it("renders linked markdown image with destination link and smart QR sizing", () => {
      const content =
        "[![排球群組](https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460)](https://line.me/ti/g/tyMF8YycaA)";
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img", { name: "排球群組" });
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe(
        "https://github.com/user-attachments/assets/68dd1bb7-f9ab-44b2-9f49-fdce5e810460",
      );
      // Smart QR/invite sizing capped at 120px instead of 100% full screen
      expect(img.style.maxWidth).toBe("120px");

      const link = img.closest("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("https://line.me/ti/g/tyMF8YycaA");
    });

    it("does not wrap unlinked images in anchor tags, avoiding raw image navigation", () => {
      const content = "![普通海報](https://github.com/user-attachments/assets/poster.png)";
      render(<AnnouncementContent content={content} />);

      const img = screen.getByRole("img", { name: "普通海報" });
      expect(img).toBeTruthy();
      expect(img.closest("a")).toBeNull();
    });
  });
});
