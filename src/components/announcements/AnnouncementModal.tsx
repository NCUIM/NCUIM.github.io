import { useState } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonIcon,
  IonModal,
  IonButtons,
  IonButton,
} from "@ionic/react";
import {
  megaphoneOutline,
  openOutline,
  timeOutline,
} from "ionicons/icons";
import {
  AnnouncementItem,
  AnnouncementCategory,
  CATEGORY_LABELS,
  PRIORITY_CONFIG,
} from "../../services/announcement-api";
import AnnouncementContent from "./AnnouncementContent";
import { FilterChips } from "../common/FilterChips";
import { useModalHistorySync } from "../../utils/useModalHistorySync";

export interface AnnouncementModalProps {
  readonly isOpen: boolean;
  readonly announcements: readonly AnnouncementItem[];
  readonly onDismiss: () => void;
}

const CATEGORIES: readonly AnnouncementCategory[] = [
  "all",
  "course",
  "event",
  "department",
  "career",
  "system",
  "general",
];

const SHORT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  all: "全部",
  course: "選課",
  event: "迎新",
  department: "系所",
  career: "職涯",
  system: "系統",
  general: "一般",
};

const isTodayAnnouncement = (item: AnnouncementItem): boolean => {
  const ts =
    item.createdAt
      ? new Date(item.createdAt).getTime()
      : new Date(item.date).getTime();
  if (Number.isNaN(ts)) return false;
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const AnnouncementModal = ({
  isOpen,
  announcements,
  onDismiss,
}: AnnouncementModalProps) => {
  useModalHistorySync(isOpen, onDismiss, "announcement-modal");
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory>("all");

  const filtered =
    selectedCategory === "all"
      ? announcements
      : announcements.filter((item) => item.category === selectedCategory);

  const categoryTabs = CATEGORIES.map((cat) => ({
    id: cat,
    label: SHORT_CATEGORY_LABELS[cat] || cat,
  })).filter((tab) => {
    if (tab.id === "all") return true;
    return announcements.some((item) => item.category === tab.id);
  });

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 12 }}>
            <IonIcon icon={megaphoneOutline} style={{ fontSize: 18, color: "var(--ncu-primary)" }} />
            <IonTitle style={{ padding: 0 }}>最新公告與消息</IonTitle>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>關閉</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Category Filter Chips */}
          <FilterChips
            activeCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            tabs={categoryTabs}
            ariaLabel="公告類別篩選"
          />

          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 16px",
                color: "var(--ncu-muted)",
                background: "var(--ncu-surface)",
                borderRadius: "var(--ncu-radius-md)",
                border: "1px dashed var(--ncu-border)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>此分類目前尚無公告</div>
            </div>
          ) : (
            filtered.map((item) => {
              const priorityConfig = PRIORITY_CONFIG[item.priority];
              const categoryConfig = CATEGORY_LABELS[item.category];

              return (
                <IonCard
                  key={item.id}
                  style={{
                    margin: "0 0 14px",
                    border: "1px solid var(--ncu-border, #e2e8f0)",
                    borderLeft:
                      item.priority === "urgent"
                        ? "4px solid #ef4444"
                        : item.priority === "high"
                        ? "4px solid #f97316"
                        : "1px solid var(--ncu-border, #e2e8f0)",
                    borderRadius: "var(--ncu-radius-lg, 12px)",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    background: "var(--ncu-surface, #ffffff)",
                  }}
                >
                  <IonCardHeader style={{ padding: "16px 16px 10px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(2, 132, 199, 0.08)",
                            color: "var(--ncu-primary, #0284c7)",
                            fontSize: 11.5,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span>{categoryConfig.icon}</span>
                          <span>{categoryConfig.label}</span>
                        </span>

                        {item.priority !== "low" && item.priority !== "normal" && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background:
                                item.priority === "urgent"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(249, 115, 22, 0.1)",
                              color: item.priority === "urgent" ? "#dc2626" : "#ea580c",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {priorityConfig.label}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: isTodayAnnouncement(item)
                              ? "#dc2626"
                              : "var(--ncu-muted, #64748b)",
                          }}
                        >
                          {item.date}
                        </span>
                      </div>
                    </div>

                    <IonCardTitle
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--ncu-ink, #0f172a)",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.title}
                    </IonCardTitle>

                    {item.milestone && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "5px 10px",
                          borderRadius: 6,
                          background: "rgba(59, 130, 246, 0.06)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11.5,
                          color: "#1d4ed8",
                          fontWeight: 600,
                        }}
                      >
                        <IonIcon icon={timeOutline} style={{ fontSize: 13 }} />
                        <span>階段：{item.milestone.title}</span>
                        {item.milestone.dueOn && (
                          <span style={{ opacity: 0.85 }}>(截止：{item.milestone.dueOn})</span>
                        )}
                      </div>
                    )}
                  </IonCardHeader>

                  <IonCardContent
                    style={{
                      padding: "0 16px 16px",
                      fontSize: 14,
                      color: "var(--ncu-text-main, #334155)",
                      lineHeight: 1.7,
                    }}
                  >
                    <AnnouncementContent content={item.content} />

                    {item.actionUrls && item.actionUrls.length > 0 && (
                      <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {item.actionUrls.map((url, idx) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid var(--ncu-border, #cbd5e1)",
                              background: "var(--ncu-surface, #ffffff)",
                              color: "var(--ncu-text-main, #334155)",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                            }}
                          >
                            <IonIcon icon={openOutline} style={{ fontSize: 13 }} />
                            <span>{item.actionUrls!.length > 1 ? `開啟連結 ${idx + 1}` : "開啟相關連結"}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        fontSize: 12.5,
                        color: "var(--ncu-muted)",
                        fontWeight: 700,
                        borderTop: "1px dashed var(--ncu-border)",
                        paddingTop: 10,
                      }}
                    >
                      <div>
                        —— {item.role} · {item.author}
                      </div>

                      {item.htmlUrl && (
                        <a
                          href={item.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--ncu-primary)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                          }}
                        >
                          <span>在 GitHub 檢視討論</span>
                          <IonIcon icon={openOutline} style={{ fontSize: 12 }} />
                        </a>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AnnouncementModal;
