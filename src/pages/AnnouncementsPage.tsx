import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonCard,
  IonCardContent,
  type RefresherEventDetail,
} from "@ionic/react";
import {
  refreshOutline,
  openOutline,
  newspaperOutline,
  chevronBackOutline,
  chevronForwardOutline,
  warningOutline,
  documentTextOutline,
} from "ionicons/icons";
import {
  fetchDepartmentNews,
  DEPARTMENT_NEWS_CATEGORIES,
  type DepartmentNewsCategory,
  type DepartmentNewsItem,
} from "../services/department-news-api";
import { DepartmentNewsModal } from "../components/announcements/DepartmentNewsModal";

const CATEGORY_CHIPS: readonly DepartmentNewsCategory[] = DEPARTMENT_NEWS_CATEGORIES;

export const AnnouncementsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<DepartmentNewsCategory>("最新消息");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [items, setItems] = useState<readonly DepartmentNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadNews = useCallback(
    async (category: DepartmentNewsCategory, page: number, forceRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDepartmentNews(category, page, forceRefresh);
        setItems(res.items);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadNews(activeCategory, currentPage);
  }, [activeCategory, currentPage, loadNews]);

  const handleCategoryChange = (cat: DepartmentNewsCategory) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const handleRefresh = async (event?: CustomEvent<RefresherEventDetail>) => {
    await loadNews(activeCategory, currentPage, true);
    event?.detail.complete();
  };

  const handleOpenDetail = (id: string) => {
    setSelectedNewsId(id);
    setIsModalOpen(true);
  };

  const handleDismissModal = () => {
    setIsModalOpen(false);
    setSelectedNewsId(null);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [items, searchQuery]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="返回" />
          </IonButtons>
          <IonTitle>系網即時公告</IonTitle>
          <IonButtons slot="end">
            <IonButton
              href="https://im.mgt.ncu.edu.tw"
              target="_blank"
              rel="noopener noreferrer"
              title="前往中央資管系官網"
            >
              <IonIcon slot="icon-only" icon={openOutline} />
            </IonButton>
            <IonButton
              onClick={() => loadNews(activeCategory, currentPage, true)}
              title="重新整理"
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding-bottom">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="下拉重新整理" refreshingSpinner="crescent" />
        </IonRefresher>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 16px 0" }}>
          {/* Header Banner */}
          <div
            style={{
              padding: "16px 18px",
              marginBottom: 16,
              borderRadius: "var(--ncu-radius-lg, 14px)",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--ncu-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#bae6fd",
                }}
              >
                <IonIcon icon={newspaperOutline} style={{ fontSize: 16 }} />
                <span>國立中央大學資訊管理學系</span>
              </div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "6px 0 2px",
                  color: "#ffffff",
                }}
              >
                系網公告專區
              </h1>
              <p style={{ margin: 0, fontSize: 12.5, color: "#e0f2fe" }}>
                即時串接官網公告 · 分類篩選與內文檢視
              </p>
            </div>
            <IonBadge
              color="light"
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 10px",
                borderRadius: 8,
              }}
            >
              {activeCategory}
            </IonBadge>
          </div>

          {/* Category Chips Scroll */}
          <div
            role="tablist"
            aria-label="公告分類"
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 8,
              marginBottom: 12,
              scrollbarWidth: "none",
            }}
          >
            {CATEGORY_CHIPS.map((cat) => {
              const isSelected = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: isSelected
                      ? "1.5px solid var(--ncu-primary, #0284c7)"
                      : "1.5px solid var(--ncu-border, #cbd5e1)",
                    background: isSelected
                      ? "var(--ncu-primary, #0284c7)"
                      : "var(--ncu-surface, #ffffff)",
                    color: isSelected ? "#ffffff" : "var(--ncu-ink, #1e293b)",
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value ?? "")}
            placeholder={`在 ${activeCategory} 中搜尋標題...`}
            debounce={200}
            style={{ padding: "0 0 12px" }}
          />

          {/* Loading State */}
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
                正在同步系網最新公告...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                color: "var(--ncu-danger)",
              }}
            >
              <IonIcon icon={warningOutline} style={{ fontSize: 44, marginBottom: 8 }} />
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>{error}</p>
              <IonButton
                size="small"
                fill="outline"
                onClick={() => loadNews(activeCategory, currentPage, true)}
              >
                點此重試
              </IonButton>
            </div>
          )}

          {/* Announcements List */}
          {!loading && !error && filteredItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredItems.map((item) => {
                const isImportant =
                  item.tag.includes("重要") || item.title.includes("【重要】");
                return (
                  <IonCard
                    key={item.id}
                    button
                    onClick={() => handleOpenDetail(item.id)}
                    style={{
                      margin: 0,
                      borderRadius: 12,
                      border: isImportant
                        ? "1.5px solid #f59e0b"
                        : "1px solid var(--ncu-border, #e2e8f0)",
                      boxShadow: isImportant
                        ? "0 2px 4px rgba(245, 158, 11, 0.15)"
                        : "var(--ncu-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))",
                      background: "var(--ncu-surface, #ffffff)",
                    }}
                  >
                    <IonCardContent style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {item.tag && (
                              <IonBadge
                                color={isImportant ? "warning" : "medium"}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                {item.tag}
                              </IonBadge>
                            )}
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--ncu-muted, #64748b)",
                                fontWeight: 600,
                              }}
                            >
                              #{item.id}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              lineHeight: 1.45,
                              margin: 0,
                              color: "var(--ncu-ink, #0f172a)",
                            }}
                          >
                            {item.title}
                          </h3>
                        </div>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="在系網開啟"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: 6,
                            color: "var(--ncu-muted, #64748b)",
                            display: "inline-flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IonIcon icon={openOutline} style={{ fontSize: 18 }} />
                        </a>
                      </div>
                    </IonCardContent>
                  </IonCard>
                );
              })}
            </div>
          )}

          {/* Empty search results */}
          {!loading && !error && filteredItems.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 16px",
                color: "var(--ncu-muted)",
              }}
            >
              <IonIcon icon={documentTextOutline} style={{ fontSize: 44, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                {searchQuery ? "找不到相符的公告" : "此分類目前暫無公告"}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 4px 32px",
                marginTop: 8,
              }}
            >
              <IonButton
                size="small"
                fill="outline"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <IonIcon slot="start" icon={chevronBackOutline} />
                上一頁
              </IonButton>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ncu-muted, #64748b)",
                }}
              >
                第 {currentPage} 頁
              </span>

              <IonButton
                size="small"
                fill="outline"
                disabled={items.length === 0 || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                下一頁
                <IonIcon slot="end" icon={chevronForwardOutline} />
              </IonButton>
            </div>
          )}
        </div>

        {/* Post Detail Reader Modal */}
        <DepartmentNewsModal
          isOpen={isModalOpen}
          newsId={selectedNewsId}
          onDismiss={handleDismissModal}
        />
      </IonContent>
    </IonPage>
  );
};

export default AnnouncementsPage;
