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
  eyeOutline,
  documentTextOutline,
  chevronDownOutline,
  chevronUpOutline,
  swapHorizontalOutline,
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

const isPdf = (name: string, url: string = ""): boolean => {
  return name.toLowerCase().endsWith(".pdf") || url.toLowerCase().endsWith(".pdf");
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
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; url: string } | null>(null);
  const [previewEngine, setPreviewEngine] = useState<"native" | "google">("native");
  const [isPdfExpanded, setIsPdfExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !newsId) {
      setDetail(null);
      setError(null);
      setSelectedPdf(null);
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
          const firstPdf = data.attachments?.find((att) => isPdf(att.name, att.url));
          if (firstPdf) {
            setSelectedPdf(firstPdf);
            setIsPdfExpanded(true);
          } else {
            setSelectedPdf(null);
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
                      const firstPdf = data.attachments?.find((att) => isPdf(att.name, att.url));
                      if (firstPdf) {
                        setSelectedPdf(firstPdf);
                        setIsPdfExpanded(true);
                      } else {
                        setSelectedPdf(null);
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

            {/* Interactive PDF Preview Section */}
            {selectedPdf && (
              <div
                style={{
                  marginTop: 24,
                  borderRadius: 12,
                  border: "1px solid var(--ncu-border, #cbd5e1)",
                  overflow: "hidden",
                  background: "var(--ncu-surface-secondary, #f8fafc)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* PDF Preview Toolbar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#fff",
                    borderBottom: "1px solid var(--ncu-border, #e2e8f0)",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <IonIcon
                      icon={documentTextOutline}
                      style={{ fontSize: 20, color: "var(--ncu-primary, #0284c7)", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "var(--ncu-text-main, #1e293b)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={selectedPdf.name}
                      >
                        {selectedPdf.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ncu-muted, #64748b)" }}>
                        PDF 線上即時預覽（{previewEngine === "native" ? "原生瀏覽器引擎" : "Google Docs 引擎"}）
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => setPreviewEngine((e) => (e === "native" ? "google" : "native"))}
                      title="若頁面空白可切換預覽引擎 (原生 / Google Docs)"
                      style={{ fontSize: 12, height: 30 }}
                    >
                      <IonIcon slot="start" icon={swapHorizontalOutline} />
                      {previewEngine === "native" ? "Google 引擎" : "原生引擎"}
                    </IonButton>

                    <IonButton
                      fill="clear"
                      size="small"
                      href={selectedPdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="在新分頁全螢幕開啟"
                      style={{ height: 30 }}
                    >
                      <IonIcon slot="icon-only" icon={openOutline} />
                    </IonButton>

                    <IonButton
                      fill="clear"
                      size="small"
                      href={selectedPdf.url}
                      download={selectedPdf.name}
                      title="下載 PDF"
                      style={{ height: 30 }}
                    >
                      <IonIcon slot="icon-only" icon={downloadOutline} />
                    </IonButton>

                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => setIsPdfExpanded((v) => !v)}
                      title={isPdfExpanded ? "收合預覽" : "展開預覽"}
                      style={{ height: 30 }}
                    >
                      <IonIcon slot="icon-only" icon={isPdfExpanded ? chevronUpOutline : chevronDownOutline} />
                    </IonButton>
                  </div>
                </div>

                {/* PDF Viewer Iframe */}
                {isPdfExpanded && (
                  <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
                    <iframe
                      src={
                        previewEngine === "google"
                          ? `https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdf.url)}&embedded=true`
                          : `${selectedPdf.url}#view=FitH`
                      }
                      title={selectedPdf.name}
                      scrolling="no"
                      style={{
                        width: "100%",
                        height: "min(72vh, 600px)",
                        border: "none",
                        display: "block",
                        background: "#fff",
                        overflow: "hidden",
                      }}
                    />
                    <div
                      style={{
                        padding: "8px 14px",
                        fontSize: 12,
                        color: "var(--ncu-muted, #64748b)",
                        background: "#f8fafc",
                        borderTop: "1px solid var(--ncu-border, #e2e8f0)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <span>💡 免安裝 PDF 閱讀器，支援滑動翻頁與縮放。</span>
                      <a
                        href={selectedPdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--ncu-primary, #0284c7)", textDecoration: "none", fontWeight: 600 }}
                      >
                        新分頁全螢幕檢視 ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments Section */}
            {detail.attachments && detail.attachments.length > 0 && (
              <div
                style={{
                  marginTop: 24,
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
                  <span>附件清單 ({detail.attachments.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {detail.attachments.map((att, idx) => {
                    const isAttPdf = isPdf(att.name, att.url);
                    const isCurrentPreview =
                      selectedPdf?.url === att.url && isPdfExpanded;

                    return (
                      <div
                        key={`${att.name}-${idx}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "#fff",
                          borderRadius: 8,
                          border: isCurrentPreview
                            ? "1px solid var(--ncu-primary, #0284c7)"
                            : "1px solid var(--ncu-border, #e2e8f0)",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <IonIcon
                            icon={isAttPdf ? documentTextOutline : attachOutline}
                            style={{
                              fontSize: 18,
                              color: isAttPdf ? "var(--ncu-primary)" : "var(--ncu-muted)",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "var(--ncu-text-main, #1e293b)",
                            }}
                            title={att.name || `附件 ${idx + 1}`}
                          >
                            {att.name || `附件 ${idx + 1}`}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {isAttPdf && (
                            <IonButton
                              fill={isCurrentPreview ? "solid" : "outline"}
                              size="small"
                              onClick={() => {
                                if (selectedPdf?.url === att.url) {
                                  setIsPdfExpanded((v) => !v);
                                } else {
                                  setSelectedPdf(att);
                                  setIsPdfExpanded(true);
                                }
                              }}
                              style={{ fontSize: 12, height: 28 }}
                            >
                              <IonIcon slot="start" icon={eyeOutline} />
                              {isCurrentPreview ? "預覽中" : "線上預覽"}
                            </IonButton>
                          )}
                          <IonButton
                            fill="clear"
                            size="small"
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={att.name}
                            title="下載檔案"
                            style={{ height: 28 }}
                          >
                            <IonIcon slot="icon-only" icon={downloadOutline} />
                          </IonButton>
                        </div>
                      </div>
                    );
                  })}
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
