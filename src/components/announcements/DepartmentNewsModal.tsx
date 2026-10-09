import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonBadge,
  IonSpinner,
} from "@ionic/react";
import {
  closeOutline,
  openOutline,
  calendarOutline,
  attachOutline,
  downloadOutline,
  warningOutline,
  refreshOutline,
} from "ionicons/icons";
import {
  fetchDepartmentNewsDetail,
  type DepartmentNewsDetail,
} from "../../services/department-news-api";
import { useModalHistorySync } from "../../utils/useModalHistorySync";

export interface DepartmentNewsModalProps {
  readonly isOpen: boolean;
  readonly newsId: string | null;
  readonly onDismiss: () => void;
}

export const DepartmentNewsModal: React.FC<DepartmentNewsModalProps> = ({
  isOpen,
  newsId,
  onDismiss,
}) => {
  useModalHistorySync(isOpen, onDismiss, "department-news-detail-modal");

  const [detail, setDetail] = useState<DepartmentNewsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !newsId) {
      setDetail(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchDepartmentNewsDetail(newsId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "載入失敗");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, newsId]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>公告詳情</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                if (newsId) {
                  setLoading(true);
                  setError(null);
                  fetchDepartmentNewsDetail(newsId, true)
                    .then((data) => {
                      setDetail(data);
                      setLoading(false);
                    })
                    .catch((err: unknown) => {
                      setError(err instanceof Error ? err.message : "重試失敗");
                      setLoading(false);
                    });
                }
              }}
              title="重新整理"
              aria-label="重新整理"
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
            {detail?.originalUrl && (
              <IonButton
                href={detail.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="在系網開啟"
              >
                <IonIcon slot="icon-only" icon={openOutline} />
              </IonButton>
            )}
            <IonButton onClick={onDismiss} aria-label="關閉">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <style>{`
          .ncu-announcement-html-body img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 8px;
            margin: 14px auto;
            display: block;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          .ncu-announcement-html-body figure.image {
            margin: 14px 0;
            text-align: center;
          }
          .ncu-announcement-html-body table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 14px;
          }
          .ncu-announcement-html-body table th,
          .ncu-announcement-html-body table td {
            border: 1px solid var(--ncu-border, #cbd5e1);
            padding: 8px 10px;
          }
          .ncu-announcement-html-body a {
            color: var(--ncu-primary, #0284c7);
            word-break: break-all;
          }
        `}</style>
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 16px",
              gap: 12,
            }}
          >
            <IonSpinner name="crescent" color="primary" />
            <span style={{ fontSize: 14, color: "var(--ncu-muted)" }}>
              載入公告內容中...
            </span>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "36px 16px",
              color: "var(--ncu-danger)",
            }}
          >
            <IonIcon icon={warningOutline} style={{ fontSize: 40, marginBottom: 8 }} />
            <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>{error}</p>
            <IonButton
              size="small"
              fill="outline"
              onClick={() => {
                if (newsId) {
                  setLoading(true);
                  setError(null);
                  fetchDepartmentNewsDetail(newsId, true)
                    .then((data) => {
                      setDetail(data);
                      setLoading(false);
                    })
                    .catch((err: unknown) => {
                      setError(err instanceof Error ? err.message : "重試失敗");
                      setLoading(false);
                    });
                }
              }}
            >
              重新整理
            </IonButton>
          </div>
        )}

        {detail && !loading && (
          <article style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 32 }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                lineHeight: 1.4,
                margin: "0 0 12px",
                color: "var(--ncu-ink)",
              }}
            >
              {detail.title}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 13,
                color: "var(--ncu-muted)",
                paddingBottom: 14,
                marginBottom: 16,
                borderBottom: "1px solid var(--ncu-border, #e2e8f0)",
              }}
            >
              {detail.date && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <IonIcon icon={calendarOutline} />
                  <span>{detail.date}</span>
                </span>
              )}
              {detail.originalUrl && (
                <a
                  href={detail.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--ncu-primary)",
                    textDecoration: "none",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  系網原文 <IonIcon icon={openOutline} style={{ fontSize: 12 }} />
                </a>
              )}
            </div>

            {/* Post Content */}
            {(() => {
              let sanitizedHtml = (detail.contentHtml || "")
                .replace(/src=["']\/(?!\/)/g, 'src="https://im.mgt.ncu.edu.tw/')
                .replace(/href=["']\/(?!\/)/g, 'href="https://im.mgt.ncu.edu.tw/');

              // If structured attachments exist, strip the raw CMS attachment block at the bottom
              if (detail.attachments && detail.attachments.length > 0) {
                sanitizedHtml = sanitizedHtml
                  .replace(/(?:<\/div>\s*)?<b>\s*附件[：:]\s*<\/b>[\s\S]*$/i, "")
                  .trim();
              }

              if (!sanitizedHtml.trim()) {
                if (detail.attachments && detail.attachments.length > 0) {
                  return null;
                }
                return (
                  <div
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      background: "var(--ncu-surface-secondary, #f8fafc)",
                      borderRadius: 12,
                      border: "1px dashed var(--ncu-border, #cbd5e1)",
                      margin: "20px 0",
                    }}
                  >
                    <p style={{ margin: "0 0 12px", color: "var(--ncu-muted)", fontSize: 14 }}>
                      此公告內文為外部表單或附件格式，請點擊下方按鈕前往官網閱讀完整內容。
                    </p>
                    {detail.originalUrl && (
                      <IonButton
                        href={detail.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        style={{ fontWeight: 700 }}
                      >
                        前往系網原文 ↗
                      </IonButton>
                    )}
                  </div>
                );
              }

              return (
                <div
                  className="ncu-announcement-html-body"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "var(--ncu-text-main, #1e293b)",
                    overflowX: "auto",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              );
            })()}

            {/* Attachments Section */}
            {detail.attachments && detail.attachments.length > 0 && (
              <div
                style={{
                  marginTop: 28,
                  padding: "16px",
                  background: "var(--ncu-surface-secondary, #f8fafc)",
                  borderRadius: 10,
                  border: "1px solid var(--ncu-border, #e2e8f0)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ncu-ink)",
                    marginBottom: 10,
                  }}
                >
                  <IonIcon icon={attachOutline} style={{ fontSize: 18 }} />
                  <span>附件下載 ({detail.attachments.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {detail.attachments.map((att, idx) => (
                    <a
                      key={`${att.name}-${idx}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#fff",
                        borderRadius: 8,
                        border: "1px solid var(--ncu-border, #e2e8f0)",
                        textDecoration: "none",
                        color: "var(--ncu-primary)",
                        fontWeight: 600,
                        fontSize: 13.5,
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginRight: 8,
                        }}
                      >
                        {att.name || `附件 ${idx + 1}`}
                      </span>
                      <IonIcon icon={downloadOutline} style={{ fontSize: 16, flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </IonContent>
    </IonModal>
  );
};

export default DepartmentNewsModal;
