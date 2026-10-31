import React from "react";
import { getPdfPreviewUrl, isMobileDevice } from "../../utils/news-preview-utils";

export interface PdfViewerFrameProps {
  readonly url: string;
  readonly title: string;
}

export const PdfViewerFrame: React.FC<PdfViewerFrameProps> = ({ url, title }) => {
  const isMobile = isMobileDevice();
  const pdfSrc = getPdfPreviewUrl(url, isMobile);

  return (
    <div
      style={{
        borderTop: "1px solid var(--ncu-border, #e2e8f0)",
        background: "#fff",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <iframe
        src={pdfSrc}
        title={title}
        scrolling={isMobile ? "yes" : "no"}
        style={{
          width: "100%",
          height: isMobile ? "min(72vh, 560px)" : "min(68vh, 520px)",
          border: "none",
          display: "block",
          background: "#fff",
        }}
      />
    </div>
  );
};

export default PdfViewerFrame;
