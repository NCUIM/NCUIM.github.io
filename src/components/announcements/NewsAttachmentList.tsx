import React from "react";
import { IonIcon } from "@ionic/react";
import { attachOutline } from "ionicons/icons";
import AttachmentItem from "./AttachmentItem";

export interface NewsAttachmentListProps {
  readonly attachments: ReadonlyArray<{ readonly name: string; readonly url: string }>;
  readonly selectedPreview: { readonly name: string; readonly url: string } | null;
  readonly isPreviewExpanded: boolean;
  readonly onTogglePreview: (att: { name: string; url: string }) => void;
}

export const NewsAttachmentList: React.FC<NewsAttachmentListProps> = ({
  attachments,
  selectedPreview,
  isPreviewExpanded,
  onTogglePreview,
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: 28,
        paddingTop: 20,
        borderTop: "1px solid var(--ncu-border, #e2e8f0)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ncu-muted, #64748b)",
          letterSpacing: "0.03em",
          marginBottom: 12,
        }}
      >
        <IonIcon icon={attachOutline} style={{ fontSize: 16 }} />
        <span>相關附件 ({attachments.length})</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {attachments.map((att, idx) => (
          <AttachmentItem
            key={`${att.name}-${idx}`}
            att={att}
            idx={idx}
            isSelected={selectedPreview?.url === att.url}
            isExpanded={isPreviewExpanded}
            onTogglePreview={onTogglePreview}
          />
        ))}
      </div>
    </section>
  );
};

export default NewsAttachmentList;
