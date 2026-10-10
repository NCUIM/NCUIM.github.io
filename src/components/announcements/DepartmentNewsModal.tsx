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
  IonSpinner,
  isPlatform,
} from "@ionic/react";
import {
  closeOutline,
  openOutline,
  calendarOutline,
  attachOutline,
  downloadOutline,
  warningOutline,
  refreshOutline,
  eyeOutline,
  documentTextOutline,
  imageOutline,
  chevronUpOutline,
} from "ionicons/icons";
import {
  fetchDepartmentNewsDetail,
  type DepartmentNewsDetail,
} from "../../services/department-news-api";
import { useModalHistorySync } from "../../utils/useModalHistorySync";
import { sanitizeDepartmentNewsHtml } from "../../utils/sanitize-news-html";

export interface DepartmentNewsModalProps {
  readonly isOpen: boolean;
  readonly newsId: string | null;
  readonly onDismiss: () => void;
}

const isPdf = (name: string, url: string = ""): boolean => {
  const pdfRegex = /\.pdf(\?.*)?$/i;
  return pdfRegex.test(name) || pdfRegex.test(url);
};

const isImage = (name: string, url: string = ""): boolean => {
  const imgRegex = /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i;
  return imgRegex.test(name) || imgRegex.test(url);
};

const isPreviewable = (name: string, url: string = ""): boolean => {
  return isPdf(name, url) || isImage(name, url);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (isPlatform("mobile") || isPlatform("android") || isPlatform("ios")) {
      return true;
    }
  } catch {
    // Ignore in non-browser or mock test environments
  }
  const hasTouchScreen =
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
    "ontouchstart" in window;
  const isNarrowScreen =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 768px)").matches;
  const isMobileUserAgent =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (hasTouchScreen && isNarrowScreen) || isMobileUserAgent;
};

export const getPdfPreviewUrl = (rawUrl: string, isMobile: boolean): string => {
  if (isMobile) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  }
  return `${rawUrl}#view=FitH`;
};


const extractTextSnippet = (html: string): string => {
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

interface AttachmentItemProps {
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

const AttachmentItem: React.FC<AttachmentItemProps> = ({
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
  const isMobile = isMobileDevice();
  const pdfSrc = getPdfPreviewUrl(att.url, isMobile);

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
            title={att.name}
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

export const DepartmentNewsModal: React.FC<DepartmentNewsModalProps> = ({
  isOpen,
  newsId,
  onDismiss,
}) => {
  useModalHistorySync(isOpen, onDismiss, "department-news-detail-modal");

  const [detail, setDetail] = useState<DepartmentNewsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<{ name: string; url: string } | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !newsId) {
      setDetail(null);
      setError(null);
      setSelectedPreview(null);
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
          const firstPreview = data.attachments?.find((att) => isPreviewable(att.name, att.url));
          if (firstPreview) {
            setSelectedPreview(firstPreview);
            const textOnly = extractTextSnippet(data.contentHtml || "");
            setIsPreviewExpanded(textOnly.length < 80);
          } else {
            setSelectedPreview(null);
            setIsPreviewExpanded(false);
          }
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
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      backdropDismiss={true}
      className="department-news-floating-modal"
    >
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
                      const firstPreview = data.attachments?.find((att) => isPreviewable(att.name, att.url));
                      if (firstPreview) {
                        setSelectedPreview(firstPreview);
                        const textOnly = extractTextSnippet(data.contentHtml || "");
                        setIsPreviewExpanded(textOnly.length < 80);
                      } else {
                        setSelectedPreview(null);
                        setIsPreviewExpanded(false);
                      }
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
          .ncu-announcement-html-body {
            font-size: 15px;
            line-height: 1.75;
            color: var(--ncu-ink, #0f172a);
          }
          .ncu-announcement-html-body * {
            max-width: 100% !important;
            background-color: transparent !important;
          }
          .ncu-announcement-html-body p {
            margin: 0 0 0.85em;
          }
          .ncu-announcement-html-body p:last-child {
            margin-bottom: 0;
          }
          .ncu-announcement-html-body span.text-big {
            font-size: 1.05em !important;
          }
          .ncu-announcement-html-body img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 8px;
            margin: 14px auto;
            display: block;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }
          .ncu-announcement-html-body figure.image {
            margin: 14px 0;
            text-align: center;
          }
          .ncu-announcement-html-body table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 13.5px;
            border: 1px solid var(--ncu-border, #e2e8f0);
            border-radius: 6px;
            overflow: hidden;
          }
          .ncu-announcement-html-body table th {
            background-color: var(--ncu-surface-secondary, #f8fafc) !important;
            color: var(--ncu-text-main, #334155);
            font-weight: 600;
            border: 1px solid var(--ncu-border, #e2e8f0);
            padding: 8px 12px;
          }
          .ncu-announcement-html-body table td {
            border: 1px solid var(--ncu-border, #e2e8f0);
            padding: 8px 12px;
          }
          .ncu-announcement-html-body ol,
          .ncu-announcement-html-body ul {
            padding-left: 22px;
            margin: 10px 0;
          }
          .ncu-announcement-html-body li {
            margin-bottom: 5px;
          }
          .ncu-announcement-html-body a {
            color: var(--ncu-primary, #0284c7);
            word-break: break-all;
            text-decoration: underline;
            text-underline-offset: 2px;
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
              const hasStructuredAttachments = Boolean(
                detail.attachments && detail.attachments.length > 0,
              );
              const sanitizedHtml = sanitizeDepartmentNewsHtml(detail.contentHtml || "", {
                stripAttachmentBlock: hasStructuredAttachments,
              });

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

            {/* Unified Attachments & In-App Reader */}
            {detail.attachments && detail.attachments.length > 0 && (
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
                  <span>相關附件 ({detail.attachments.length})</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {detail.attachments.map((att, idx) => (
                    <AttachmentItem
                      key={`${att.name}-${idx}`}
                      att={att}
                      idx={idx}
                      isSelected={selectedPreview?.url === att.url}
                      isExpanded={isPreviewExpanded}
                      onTogglePreview={(selected) => {
                        if (selectedPreview?.url === selected.url) {
                          setIsPreviewExpanded((v) => !v);
                        } else {
                          setSelectedPreview(selected);
                          setIsPreviewExpanded(true);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </IonContent>
    </IonModal>
  );
};

export default DepartmentNewsModal;
