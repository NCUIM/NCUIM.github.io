/**
 * Utility functions for department news previewing, attachment type checking,
 * and mobile environment detection.
 */

export const isPdf = (name: string, url: string = ""): boolean => {
  const pdfRegex = /\.pdf(\?.*)?$/i;
  return pdfRegex.test(name) || pdfRegex.test(url);
};

export const isImage = (name: string, url: string = ""): boolean => {
  const imgRegex = /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i;
  return imgRegex.test(name) || imgRegex.test(url);
};

export const isPreviewable = (name: string, url: string = ""): boolean => {
  return isPdf(name, url) || isImage(name, url);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return true;
  }
  const hasTouchScreen =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  const isNarrowScreen =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 768px)").matches;

  return hasTouchScreen && isNarrowScreen;
};

export const isSafePublicPdfUrl = (urlStr: string): boolean => {
  try {
    const parsed = new URL(urlStr);
    if (parsed.username || parsed.password) {
      return false;
    }
    const sensitiveKeys = [
      "token",
      "auth",
      "secret",
      "password",
      "apikey",
      "access_token",
      "session",
      "sig",
      "signature",
    ];
    for (const key of sensitiveKeys) {
      if (parsed.searchParams.has(key)) {
        return false;
      }
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "im.mgt.ncu.edu.tw" ||
      hostname.endsWith(".ncu.edu.tw") ||
      hostname.endsWith(".edu.tw")
    );
  } catch {
    return false;
  }
};

export const getPdfPreviewUrl = (rawUrl: string, isMobile: boolean): string => {
  if (isMobile && isSafePublicPdfUrl(rawUrl)) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  }
  return `${rawUrl}#view=FitH`;
};

export const extractTextSnippet = (html: string): string => {
  if (!html) return "";
  const attachmentIndex = html.search(/<b>\s*附件[：:]/i);
  const content = attachmentIndex !== -1 ? html.slice(0, attachmentIndex) : html;
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(content, "text/html");
      return (doc.body.textContent || "").trim();
    } catch {
      // Fallback
    }
  }
  return content.trim();
};
