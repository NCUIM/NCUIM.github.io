import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
} from "@ionic/react";
import {
  trophy,
  medal,
  ribbon,
  refreshOutline,
  peopleOutline,
} from "ionicons/icons";
import { useState, useEffect, useCallback } from "react";
import {
  fetchLiveLeaderboard,
  getSavedParticipantInfo,
  type LeaderboardEntry,
  type LeaderboardResponse,
  type SavedParticipantInfo,
} from "../services/card-event-api";

const RankBadge = ({ rank }: Readonly<{ rank: number }>) => {
  if (rank === 1) {
    return <IonIcon icon={trophy} style={{ fontSize: 24, color: "var(--ncu-star)" }} />;
  }
  if (rank === 2) {
    return <IonIcon icon={medal} style={{ fontSize: 22, color: "#94a3b8" }} />;
  }
  if (rank === 3) {
    return <IonIcon icon={ribbon} style={{ fontSize: 22, color: "#cd7f32" }} />;
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "var(--ncu-primary-light)",
        color: "var(--ncu-primary)",
        fontWeight: 700,
        fontSize: "12px",
      }}
    >
      {rank}
    </span>
  );
};

const LeaderboardPlayerItem = ({
  player,
  isMe,
}: Readonly<{
  player: LeaderboardEntry;
  isMe: boolean;
}>) => (
  <IonItem
    lines="full"
    style={{
      "--background": isMe ? "var(--ncu-primary-light)" : "transparent",
    }}
  >
    <div slot="start" style={{ marginRight: "var(--ncu-space-3)", minWidth: 28, textAlign: "center" }}>
      <RankBadge rank={player.rank} />
    </div>
    <IonLabel>
      <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{player.nickname}</span>
        {isMe && <IonBadge color="primary" style={{ fontSize: 10 }}>我</IonBadge>}
      </div>
    </IonLabel>
    <div slot="end" style={{ textAlign: "right" }}>
      <span
        style={{
          fontWeight: 800,
          color: "var(--ncu-primary)",
          fontSize: "var(--ncu-font-size-md)",
        }}
      >
        {player.score}
      </span>
      <span style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-xs)", marginLeft: 3 }}>
        pts
      </span>
    </div>
  </IonItem>
);

const LeaderboardSummaryCard = ({
  data,
  savedUser,
}: Readonly<{
  data: LeaderboardResponse | null;
  savedUser: SavedParticipantInfo | null;
}>) => {
  const myRankEntry = data?.top.find(
    (p) => savedUser && p.nickname === savedUser.label,
  );

  return (
    <IonCard
      style={{
        margin: "16px 16px 8px",
        background: "linear-gradient(135deg, #1b2a4a 0%, #2b4c7e 100%)",
        color: "#fff",
        borderRadius: "var(--ncu-radius-lg)",
        boxShadow: "var(--ncu-shadow-hard)",
      }}
    >
      <IonCardContent style={{ padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#93c5fd", fontWeight: 700, letterSpacing: 1 }}>
              {data?.event.name ?? "NCUIM2026-Fresher"}
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 0", color: "#fff" }}>
              即時排行榜 (Top 10)
            </h2>
          </div>
          <IonBadge color="light" style={{ padding: "6px 10px", fontSize: "13px", fontWeight: 700 }}>
            <IonIcon icon={peopleOutline} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {data ? `${data.totalRanked} 人在榜` : "載入中..."}
          </IonBadge>
        </div>

        {!savedUser ? (
          <div
            style={{
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
              還沒完成迎新活動報到？
            </span>
            <IonButton
              routerLink="/cards"
              size="small"
              color="light"
              style={{ fontWeight: 800 }}
            >
              前往報到頁 📝
            </IonButton>
          </div>
        ) : (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>已報到身分：</span>
              <span style={{ fontWeight: 700, marginLeft: 4 }}>{savedUser.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {myRankEntry && (
                <IonBadge color="warning" style={{ fontWeight: 800 }}>
                  第 {myRankEntry.rank} 名 ({myRankEntry.score} 分)
                </IonBadge>
              )}
              <IonButton
                routerLink="/cards"
                size="small"
                fill="clear"
                color="light"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                我的名片 ↗
              </IonButton>
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

const LeaderboardPage = () => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedUser, setSavedUser] = useState<SavedParticipantInfo | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLiveLeaderboard();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "排行榜載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSavedUser(getSavedParticipantInfo());
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const res = await fetchLiveLeaderboard();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      event.detail.complete();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cards" text="" />
          </IonButtons>
          <IonTitle>即時排行榜</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={loadLeaderboard} aria-label="重新整理">
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ncu-leaderboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <LeaderboardSummaryCard data={data} savedUser={savedUser} />

        <div style={{ padding: "0 16px 16px" }}>
          <IonCard style={{ margin: 0 }}>
            <IonCardHeader style={{ paddingBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <IonCardTitle style={{ fontSize: "16px" }}>Top 10 排行</IonCardTitle>
                {data && (
                  <span style={{ fontSize: "11px", color: "var(--ncu-muted)" }}>
                    更新於 {new Date(data.updatedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </IonCardHeader>

            {loading && !data && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <IonSpinner name="crescent" />
                <p style={{ color: "var(--ncu-muted)", fontSize: "13px", marginTop: 8 }}>
                  正在載入最新名次…
                </p>
              </div>
            )}

            {error && !data && (
              <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--ncu-danger)" }}>
                <p>{error}</p>
                <IonButton size="small" fill="outline" onClick={loadLeaderboard}>
                  點此重試
                </IonButton>
              </div>
            )}

            {data && (
              <>
                <IonList lines="full">
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
                    padding: "10px 16px 6px",
                    fontSize: "12px",
                    color: "var(--ncu-muted)",
                    textAlign: "center",
                  }}
                >
                  📌 公開榜單依活動規則僅展示前 10 名；全員分數由主辦方後台記錄
                </div>
                <div style={{ padding: "8px 16px 14px" }}>
                  <IonButton
                    expand="block"
                    routerLink="/cards"
                    fill="outline"
                    style={{ fontWeight: 700 }}
                  >
                    📝 前往活動身分報到 / 電子名片 ↗
                  </IonButton>
                </div>
              </>
            )}
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LeaderboardPage;
