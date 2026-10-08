import React from "react";
import { IonIcon } from "@ionic/react";
import { chevronForwardOutline } from "ionicons/icons";
import type { AnnouncementItem } from "../../services/announcement-api";

export const getPriorityBorderColor = (priority: string): string => {
  if (priority === "urgent") return "#f59e0b";
  if (priority === "high") return "#f97316";
  if (priority === "normal") return "#3b82f6";
  return "var(--ncu-ink)";
};

export const AnnouncementBar = ({
  announcements,
  onOpen,
}: Readonly<{
  announcements: readonly AnnouncementItem[];
  onOpen: () => void;
}>) => {
  const latest = announcements[0];
  if (!latest) return null;

  const priorityBorderColor = getPriorityBorderColor(latest.priority);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="查看最新公告"
      style={{
        margin: "0 0 16px",
        padding: "10px 14px",
        width: "100%",
        textAlign: "inherit",
        font: "inherit",
        background: "var(--ncu-surface)",
        border: `2px solid ${priorityBorderColor}`,
        borderRadius: "var(--ncu-radius-md)",
        boxShadow: "var(--ncu-shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <span
          style={{
            color: "var(--ncu-muted)",
            fontSize: 11,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <span>公告</span>
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--ncu-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {latest.title}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: "var(--ncu-muted)",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        <span>{announcements.length > 1 ? `共 ${announcements.length} 則` : "詳情"}</span>
        <IonIcon icon={chevronForwardOutline} style={{ fontSize: 14 }} />
      </div>
    </button>
  );
};
