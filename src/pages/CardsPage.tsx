import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonList,
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
} from "@ionic/react";
import {
  refreshOutline,
  logoGithub,
} from "ionicons/icons";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSavedParticipantInfo,
  fetchLiveLeaderboard,
  type SavedParticipantInfo,
  type LeaderboardResponse,
} from "../services/card-event-api";
import { LeaderboardPlayerItem } from "../components/leaderboard/LeaderboardPlayerItem";

// ── Leaderboard Card Component ────────────────────────────────

const LeaderboardCard = ({
  data,
  loading,
  error,
  savedUser,
  onRefresh,
}: Readonly<{
  data: LeaderboardResponse | null;
  loading: boolean;
  error: string | null;
  savedUser: SavedParticipantInfo | null;
  onRefresh: () => void;
}>) => {
  const myRankEntry = data?.top.find((p) => p.nickname === savedUser?.label);

  return (
    <IonCard style={{ margin: "0 0 16px" }}>
      <IonCardHeader style={{ paddingBottom: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <IonCardTitle style={{ fontSize: "17px", fontWeight: 800 }}>
              即時排行榜
            </IonCardTitle>
            {data && (
              <span style={{ fontSize: "11px", color: "var(--ncu-muted)" }}>
                共 {data.totalRanked} 人在榜 · 更新於{" "}
                {new Date(data.updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <IonButton
            size="small"
            fill="clear"
            onClick={onRefresh}
            aria-label="重新整理"
            style={{ marginLeft: "auto" }}
          >
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </div>

        {savedUser && myRankEntry && (
          <div style={{ marginTop: 8 }}>
            <IonBadge
              color="warning"
              style={{ fontWeight: 800, padding: "4px 8px" }}
            >
              我的排名：第 {myRankEntry.rank} 名 ({myRankEntry.score} 分)
            </IonBadge>
          </div>
        )}
      </IonCardHeader>

      <IonCardContent style={{ padding: "0 0 8px" }}>
        {loading && !data && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <IonSpinner name="crescent" />
            <p
              style={{
                color: "var(--ncu-muted)",
                fontSize: "13px",
                marginTop: 8,
              }}
            >
              正在載入最新排行榜…
            </p>
          </div>
        )}

        {error && !data && (
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              color: "var(--ncu-danger)",
            }}
          >
            <p style={{ margin: 0, fontSize: "13px" }}>{error}</p>
            <IonButton
              size="small"
              fill="outline"
              onClick={onRefresh}
              style={{ marginTop: 8 }}
            >
              點此重試
            </IonButton>
          </div>
        )}
        {data && (
          <>
            <IonList
              lines="full"
              style={{
                maxHeight: "42vh",
                overflowY: "auto",
                paddingRight: "var(--ncu-space-1)",
              }}
            >
              {data.top.map((player) => (
                <LeaderboardPlayerItem
                  key={`${player.rank}-${player.nickname}`}
                  player={player}
                  isMe={savedUser?.label === player.nickname}
                />
              ))}
            </IonList>
            <div
              style={{
                padding: "6px 16px 2px",
                fontSize: "11.5px",
                color: "var(--ncu-muted)",
                textAlign: "center",
              }}
            >
              📌 公開榜單僅展示前 10 名；全員分數由主辦方後台記錄
            </div>
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// ── Main Page Component ───────────────────────────────────────

const UserPageFooter = () => (
  <div
    style={{
      textAlign: "center",
      padding: "16px 16px 0",
      fontSize: 12,
      color: "var(--ncu-muted)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
    }}
  >
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.85 }}>
      <img
        src="https://hits.sh/ncuim.github.io.svg?style=flat-square&label=VISITORS&color=2563eb"
        alt="Visitors Counter"
        style={{ height: 18, borderRadius: 3 }}
      />
    </div>
  </div>
);

const CardsPage = () => {
  const [savedUser, setSavedUser] = useState<SavedParticipantInfo | null>(null);

  // Leaderboard data
  const [lbData, setLbData] = useState<LeaderboardResponse | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);

  const loadLeaderboardData = useCallback(async () => {
    setLbLoading(true);
    setLbError(null);
    try {
      const res = await fetchLiveLeaderboard();
      setLbData(res);
    } catch (err) {
      setLbError(err instanceof Error ? err.message : "排行榜載入失敗");
    } finally {
      setLbLoading(false);
    }
  }, []);

  useEffect(() => {
    setSavedUser(getSavedParticipantInfo());
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  const handlePullRefresh = async (
    event: CustomEvent<RefresherEventDetail>,
  ) => {
    try {
      const res = await fetchLiveLeaderboard();
      setLbData(res);
      setLbError(null);
    } catch (err) {
      setLbError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      event.detail.complete();
    }
  };

  const contentRef = useRef<HTMLIonContentElement | null>(null);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>個人中心</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="outline"
              size="small"
              href="https://github.com/NCUIM/NCUIM.github.io"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <IonIcon slot="icon-only" icon={logoGithub} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        ref={contentRef}
        className="ion-padding"
        style={{ "--background": "var(--ncu-canvas)" }}
      >
        <IonRefresher slot="fixed" onIonRefresh={handlePullRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <LeaderboardCard
          data={lbData}
          loading={lbLoading}
          error={lbError}
          savedUser={savedUser}
          onRefresh={loadLeaderboardData}
        />

        <UserPageFooter />
      </IonContent>
    </IonPage>
  );
};

export default CardsPage;
