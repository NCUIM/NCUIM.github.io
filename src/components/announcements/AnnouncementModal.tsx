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
  gridOutline,
} from "ionicons/icons";
import {
  AnnouncementItem,
  AnnouncementCategory,
  CATEGORY_LABELS,
  PRIORITY_CONFIG,
} from "../../services/announcement-api";
import AnnouncementContent from "./AnnouncementContent";

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

export const AnnouncementModal = ({
  isOpen,
  announcements,
  onDismiss,
}: AnnouncementModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory>("all");

  const filtered =
    selectedCategory === "all"
      ? announcements
      : announcements.filter((item) => item.category === selectedCategory);

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
          {/* Category Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 14,
              marginBottom: 8,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {CATEGORIES.map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const isSelected = selectedCategory === cat;
              const isAll = cat === "all";
              const count =
                isAll
                  ? announcements.length
                  : announcements.filter((item) => item.category === cat).length;

              if (!isAll && count === 0) return null;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-label={isAll ? "全部公告" : info.label}
                  title={isAll ? "全部公告" : info.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: isAll ? "5px 12px" : "5px 12px",
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 800 : 600,
                    border: isSelected ? "1.5px solid var(--ncu-ink)" : "1px solid var(--ncu-border)",
                    background: isSelected ? "var(--ncu-ink)" : "var(--ncu-surface)",
                    color: isSelected ? "#ffffff" : "var(--ncu-ink)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: isSelected ? "var(--ncu-shadow-sm)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isAll ? (
                    <IonIcon icon={gridOutline} style={{ fontSize: 16 }} />
                  ) : (
                    <>
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                      <span style={{ opacity: 0.75, fontSize: 11 }}>({count})</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

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
                    margin: "0 0 16px",
                    border:
                      item.priority === "urgent" ? "2.5px solid #ef4444" : "2px solid var(--ncu-ink)",
                    borderRadius: "var(--ncu-radius-md)",
                    boxShadow:
                      item.priority === "urgent"
                        ? "0 0 16px rgba(239, 68, 68, 0.2)"
                        : "var(--ncu-shadow-hard)",
                    background: "var(--ncu-surface)",
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
                            background: priorityConfig.badgeColor,
                            color: "#ffffff",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span>{priorityConfig.icon}</span>
                          <span>{priorityConfig.label}</span>
                        </span>

                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(27, 42, 74, 0.08)",
                            color: "var(--ncu-ink)",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span>{categoryConfig.icon}</span>
                          <span>{categoryConfig.label}</span>
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--ncu-muted)", fontWeight: 600 }}>
                        {item.date}
                      </span>
                    </div>

                    <IonCardTitle
                      style={{
                        fontSize: 16.5,
                        fontWeight: 800,
                        color: "var(--ncu-ink)",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </IonCardTitle>

                    {item.milestone && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(59, 130, 246, 0.08)",
                          border: "1px solid rgba(59, 130, 246, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#1e40af",
                          fontWeight: 700,
                        }}
                      >
                        <IonIcon icon={timeOutline} style={{ fontSize: 14 }} />
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
                      color: "var(--ncu-ink)",
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
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: "1.5px solid var(--ncu-ink)",
                              background: "var(--ncu-surface)",
                              color: "var(--ncu-ink)",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              boxShadow: "var(--ncu-shadow-sm)",
                            }}
                          >
                            <IonIcon icon={openOutline} style={{ fontSize: 14 }} />
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
