import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  type RefresherEventDetail,
} from "@ionic/react";
import {
  refreshOutline,
  openOutline,
  chevronBackOutline,
  chevronForwardOutline,
  warningOutline,
  documentTextOutline,
  newspaperOutline,
  bookOutline,
  micOutline,
  schoolOutline,
  briefcaseOutline,
  trophyOutline,
  extensionPuzzleOutline,
} from "ionicons/icons";
import {
  fetchDepartmentNews,
  type DepartmentNewsCategory,
  type DepartmentNewsItem,
} from "../services/department-news-api";
import { DepartmentNewsModal } from "../components/announcements/DepartmentNewsModal";
import { FilterChips, type FilterChipTab } from "../components/common/FilterChips";

const ANNOUNCEMENT_TABS: readonly FilterChipTab<DepartmentNewsCategory>[] = [
  { id: "最新消息", label: "最新", icon: newspaperOutline, iconColor: "var(--ncu-primary, #0284c7)" },
  { id: "課程消息", label: "課程", icon: bookOutline, iconColor: "#2563eb" },
  { id: "演講訊息", label: "演講", icon: micOutline, iconColor: "#7c3aed" },
  { id: "工讀獎學金", label: "獎助", icon: schoolOutline, iconColor: "#d97706" },
  { id: "實習與企業徵才", label: "徵才", icon: briefcaseOutline, iconColor: "var(--ncu-success, #0f766e)" },
  { id: "榮譽榜", label: "榮譽", icon: trophyOutline, iconColor: "#e11d48" },
  { id: "其他活動", label: "活動", icon: extensionPuzzleOutline, iconColor: "#64748b" },
];

export const AnnouncementsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<DepartmentNewsCategory>("最新消息");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [items, setItems] = useState<readonly DepartmentNewsItem[]>([]);
  const [total, setTotal] = useState<number>(0);
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
        setTotal(res.total);
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

  const isLastPage = useMemo(() => {
    if (items.length === 0) return true;
    if (total > 20) {
      return currentPage * 20 >= total;
    }
    return items.length < 20;
  }, [items.length, total, currentPage]);

  const totalPagesText = useMemo(() => {
    if (total > 20) {
      const maxPages = Math.ceil(total / 20);
      return `第 ${currentPage} / ${maxPages} 頁`;
    }
    return `第 ${currentPage} 頁`;
  }, [currentPage, total]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>系網公告</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => loadNews(activeCategory, currentPage, true)}
              title="重新整理"
              aria-label="重新整理"
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
            <IonButton
              href="https://im.mgt.ncu.edu.tw"
              target="_blank"
              rel="noopener noreferrer"
              title="前往中央資管系官網"
              aria-label="前往中央資管系官網"
            >
              <IonIcon slot="icon-only" icon={openOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding-bottom"
        style={{ "--background": "var(--ncu-canvas)" }}
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="下拉重新整理" refreshingSpinner="crescent" />
        </IonRefresher>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 0" }}>
          {/* Category Chips Scroll */}
          <FilterChips<DepartmentNewsCategory>
            activeCategory={activeCategory}
            onSelectCategory={handleCategoryChange}
            tabs={ANNOUNCEMENT_TABS}
            ariaLabel="公告分類"
          />

          {/* Search bar */}
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value ?? "")}
            placeholder={`搜尋本頁 ${activeCategory}...`}
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
                正在載入公告...
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredItems.map((item) => {
                const isImportant =
                  item.tag.includes("重要") || item.title.includes("【重要】");
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenDetail(item.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      font: "inherit",
                      color: "inherit",
                      padding: "13px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--ncu-border, #e2e8f0)",
                      background: "#ffffff",
                      cursor: "pointer",
                      transition: "transform 0.1s ease, box-shadow 0.1s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {isImportant && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#fef3c7",
                            color: "#b45309",
                          }}
                        >
                          重要
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--ncu-muted, #64748b)",
                          fontWeight: 500,
                        }}
                      >
                        {item.category}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ncu-border, #cbd5e1)" }}>•</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--ncu-muted, #94a3b8)",
                        }}
                      >
                        #{item.id}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        lineHeight: 1.45,
                        margin: 0,
                        color: "var(--ncu-ink, #0f172a)",
                      }}
                    >
                      {item.title}
                    </h3>
                  </button>
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
                {totalPagesText}
              </span>

              <IonButton
                size="small"
                fill="outline"
                disabled={isLastPage || loading}
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
