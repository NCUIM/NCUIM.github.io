import { describe, it, expect } from "vitest";
import { getPdfPreviewUrl, isMobileDevice } from "../components/announcements/DepartmentNewsModal";

describe("DepartmentNewsModal PDF Preview", () => {
  const samplePdfUrl = "https://im.mgt.ncu.edu.tw/download/newpost/sample-announcement.pdf";

  it("returns native FitH URL for desktop preview", () => {
    const url = getPdfPreviewUrl(samplePdfUrl, false);
    expect(url).toBe("https://im.mgt.ncu.edu.tw/download/newpost/sample-announcement.pdf#view=FitH");
  });

  it("returns Google Docs embedded viewer URL for mobile preview", () => {
    const url = getPdfPreviewUrl(samplePdfUrl, true);
    expect(url).toBe(
      `https://docs.google.com/viewer?url=${encodeURIComponent(samplePdfUrl)}&embedded=true`
    );
  });

  it("correctly encodes special characters in PDF URL for mobile preview", () => {
    const chinesePdfUrl = "https://im.mgt.ncu.edu.tw/download/newpost/115學年度入學適用-科目表.pdf";
    const url = getPdfPreviewUrl(chinesePdfUrl, true);
    expect(url).toContain("https://docs.google.com/viewer?url=");
    expect(url).toContain(encodeURIComponent(chinesePdfUrl));
    expect(url).toContain("&embedded=true");
  });

  it("isMobileDevice returns a boolean without throwing in test environment", () => {
    const isMobile = isMobileDevice();
    expect(typeof isMobile).toBe("boolean");
  });
});
