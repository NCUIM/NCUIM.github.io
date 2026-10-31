import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  isPdf,
  isImage,
  isPreviewable,
  isMobileDevice,
  isSafePublicPdfUrl,
  getPdfPreviewUrl,
  extractTextSnippet,
} from "../utils/news-preview-utils";
import PdfViewerFrame from "../components/announcements/PdfViewerFrame";
import NewsAttachmentList from "../components/announcements/NewsAttachmentList";
import AttachmentItem from "../components/announcements/AttachmentItem";

describe("News Preview Utilities", () => {
  describe("isPdf & isImage & isPreviewable", () => {
    it("correctly identifies PDF files by name or url", () => {
      expect(isPdf("document.pdf")).toBe(true);
      expect(isPdf("doc.PDF")).toBe(true);
      expect(isPdf("file", "https://im.ncu.edu.tw/file.pdf?v=1")).toBe(true);
      expect(isPdf("document.docx")).toBe(false);
      expect(isPdf("image.png")).toBe(false);
    });

    it("correctly identifies Image files by extension", () => {
      expect(isImage("photo.jpg")).toBe(true);
      expect(isImage("photo.jpeg")).toBe(true);
      expect(isImage("photo.png")).toBe(true);
      expect(isImage("photo.webp")).toBe(true);
      expect(isImage("photo.svg")).toBe(true);
      expect(isImage("photo.gif")).toBe(true);
      expect(isImage("file.pdf")).toBe(false);
      expect(isImage("archive.zip")).toBe(false);
    });

    it("identifies previewable media types", () => {
      expect(isPreviewable("doc.pdf")).toBe(true);
      expect(isPreviewable("img.png")).toBe(true);
      expect(isPreviewable("data.xlsx")).toBe(false);
    });
  });

  describe("extractTextSnippet", () => {
    it("returns empty string when input is empty", () => {
      expect(extractTextSnippet("")).toBe("");
    });

    it("extracts text before the attachment block indicator", () => {
      const html = "<p>這是公告內容。</p><b>附件：</b><a href='#'>檔案.pdf</a>";
      expect(extractTextSnippet(html)).toBe("這是公告內容。");
    });

    it("strips HTML tags and returns plain text", () => {
      const html = "<div><h2>公告標題</h2><p>第一段文字</p></div>";
      const snippet = extractTextSnippet(html);
      expect(snippet).toBe("公告標題第一段文字");
      expect(snippet).not.toMatch(/<[^>]+>/);
    });
  });

  describe("isSafePublicPdfUrl & getPdfPreviewUrl", () => {
    it("safely handles malformed URLs without throwing", () => {
      expect(isSafePublicPdfUrl("not a url")).toBe(false);
      expect(isSafePublicPdfUrl("javascript:alert(1)")).toBe(false);
    });

    it("generates desktop preview URL with FitH hash anchor", () => {
      const raw = "https://im.mgt.ncu.edu.tw/doc.pdf";
      expect(getPdfPreviewUrl(raw, false)).toBe(`${raw}#view=FitH`);
    });

    it("generates mobile preview URL with Google Docs embedded viewer for safe URLs", () => {
      const raw = "https://im.mgt.ncu.edu.tw/doc.pdf";
      const preview = getPdfPreviewUrl(raw, true);
      expect(preview).toBe(`https://docs.google.com/viewer?url=${encodeURIComponent(raw)}&embedded=true`);
    });
  });
});

describe("PdfViewerFrame Component", () => {
  it("renders iframe with title and source", () => {
    const raw = "https://im.mgt.ncu.edu.tw/sample.pdf";
    render(<PdfViewerFrame url={raw} title="測試附件" />);
    const iframe = screen.getByTitle("測試附件") as HTMLIFrameElement;
    expect(iframe).toBeDefined();
    expect(iframe.tagName.toLowerCase()).toBe("iframe");
    expect(iframe.src).toBe(getPdfPreviewUrl(raw, isMobileDevice()));
  });
});

describe("NewsAttachmentList & AttachmentItem Components", () => {
  it("returns null when attachments array is empty", () => {
    const { container } = render(
      <NewsAttachmentList
        attachments={[]}
        selectedPreview={null}
        isPreviewExpanded={false}
        onTogglePreview={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders attachment count and individual items", () => {
    const attachments = [
      { name: "簡章.pdf", url: "https://im.mgt.ncu.edu.tw/guide.pdf" },
      { name: "海報.png", url: "https://im.mgt.ncu.edu.tw/poster.png" },
      { name: "檔案.zip", url: "https://im.mgt.ncu.edu.tw/archive.zip" },
    ];
    const toggleSpy = vi.fn();

    render(
      <NewsAttachmentList
        attachments={attachments}
        selectedPreview={attachments[0]}
        isPreviewExpanded={true}
        onTogglePreview={toggleSpy}
      />
    );

    expect(screen.getByText("相關附件 (3)")).toBeDefined();
    expect(screen.getByText("簡章.pdf")).toBeDefined();
    expect(screen.getByText("海報.png")).toBeDefined();
    expect(screen.getByText("檔案.zip")).toBeDefined();

    // Verify non-previewable file shows download button
    expect(screen.getByText("下載")).toBeDefined();
  });

  it("triggers onTogglePreview when preview button is clicked", () => {
    const toggleSpy = vi.fn();
    const att = { name: "海報.png", url: "https://im.mgt.ncu.edu.tw/poster.png" };

    render(
      <AttachmentItem
        att={att}
        idx={0}
        isSelected={false}
        isExpanded={false}
        onTogglePreview={toggleSpy}
      />
    );

    const previewButton = screen.getByText("預覽");
    fireEvent.click(previewButton);
    expect(toggleSpy).toHaveBeenCalledWith(att);
  });
});
