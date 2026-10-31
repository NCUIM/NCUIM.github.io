import React from "react";
import { IonIcon, IonButton } from "@ionic/react";
import {
  openOutline,
  attachOutline,
  downloadOutline,
  eyeOutline,
  documentTextOutline,
  imageOutline,
  chevronUpOutline,
} from "ionicons/icons";
import { isPdf, isImage } from "../../utils/news-preview-utils";
import PdfViewerFrame from "./PdfViewerFrame";

export interface AttachmentItemProps {
  readonly att: { readonly name: string; readonly url: string };
  readonly idx: number;
  readonly isSelected: boolean;
  readonly isExpanded: boolean;
  readonly onTogglePreview: (att: { name: string; url: string }) => void;
}

interface AttachmentMeta {
  readonly icon: string;
  readonly color: string;
  readonly label: string | null;
  readonly actionText: string;
  readonly openTitle: string;
}

const getAttachmentMeta = (isPdfFile: boolean, isImageFile: boolean): AttachmentMeta => {
  if (isPdfFile) {
    return {
      icon: documentTextOutline,
      color: "var(--ncu-primary, #0284c7)",
      label: "PDF 文件 · 線上即時閱讀",
      actionText: "閱讀",
      openTitle: "在新分頁開啟原始 PDF",
    };
  }
  if (isImageFile) {
    return {
      icon: imageOutline,
      color: "var(--ncu-success, #10b981)",
      label: "圖片檔案 · 線上即時預覽",
      actionText: "預覽",
      openTitle: "在新分頁開啟原始圖片",
    };
  }
  return {
    icon: attachOutline,
    color: "var(--ncu-muted)",
    label: null,
    actionText: "下載",
    openTitle: "下載附件",
  };
};

export const AttachmentItem: React.FC<AttachmentItemProps> = ({
  att,
  idx,
  isSelected,
  isExpanded,
  onTogglePreview,
}) => {
  const isAttPdf = isPdf(att.name, att.url);
  const isAttImage = isImage(att.name, att.url);
  const canPreview = isAttPdf || isAttImage;
  const isCurrentPreview = isSelected && isExpanded;

  const meta = getAttachmentMeta(isAttPdf, isAttImage);
  const actionButtonText = isCurrentPreview ? "收合" : meta.actionText;

  return (
    <div
      style={{
        borderRadius: 10,
        border: isCurrentPreview
          ? "1px solid var(--ncu-primary, #0284c7)"
          : "1px solid var(--ncu-border, #e2e8f0)",
        background: "#fff",
        overflow: "hidden",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: isCurrentPreview ? "0 2px 10px rgba(2, 132, 199, 0.08)" : "none",
      }}
    >
      {/* Attachment Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: isCurrentPreview ? "rgba(2, 132, 199, 0.04)" : "#fff",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            flex: 1,
          }}
        >
          <IonIcon
            icon={meta.icon}
            style={{
              fontSize: 20,
              color: meta.color,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ncu-text-main, #1e293b)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={att.name || `附件 ${idx + 1}`}
            >
              {att.name || `附件 ${idx + 1}`}
            </div>
            {meta.label && (
              <div style={{ fontSize: 11.5, color: "var(--ncu-muted, #64748b)" }}>
                {meta.label}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {canPreview ? (
            <>
              <IonButton
                fill={isCurrentPreview ? "solid" : "outline"}
                size="small"
                onClick={() => onTogglePreview(att)}
                style={{
                  fontSize: 12.5,
                  height: 30,
                  fontWeight: 600,
                }}
              >
                <IonIcon slot="start" icon={isCurrentPreview ? chevronUpOutline : eyeOutline} />
                {actionButtonText}
              </IonButton>

              <IonButton
                fill="clear"
                size="small"
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                title={meta.openTitle}
                style={{ height: 30 }}
              >
                <IonIcon slot="icon-only" icon={openOutline} />
              </IonButton>
            </>
          ) : (
            <IonButton
              fill="outline"
              size="small"
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              download={att.name}
              style={{
                fontSize: 12.5,
                height: 30,
                fontWeight: 600,
              }}
            >
              <IonIcon slot="start" icon={downloadOutline} />
              下載
            </IonButton>
          )}
        </div>
      </div>

      {/* Inline Preview (PDF Frame or Responsive Image) */}
      {isCurrentPreview && isAttPdf && (
        <PdfViewerFrame url={att.url} title={att.name} />
      )}

      {isCurrentPreview && isAttImage && (
        <div
          style={{
            borderTop: "1px solid var(--ncu-border, #e2e8f0)",
            background: "var(--ncu-surface-secondary, #f8fafc)",
            padding: "16px 12px",
            textAlign: "center",
            overflowX: "auto",
          }}
        >
          <img
            src={att.url}
            alt={att.name || "公告圖片附件"}
            loading="lazy"
            style={{
              maxWidth: "100%",
              maxHeight: "min(70vh, 560px)",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              display: "inline-block",
              backgroundColor: "#fff",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AttachmentItem;
