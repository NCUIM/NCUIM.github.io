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
  IonIcon,
  IonBadge,
  IonItem,
  IonInput,
  IonSpinner,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
} from "@ionic/react";
import {
  trophy,
  scan,
  openOutline,
  checkmarkCircle,
  personOutline,
  logOutOutline,
  medal,
  ribbon,
  refreshOutline,
  peopleOutline,
} from "ionicons/icons";
import { useState, useEffect, useCallback } from "react";
import {
  verifyEntryCode,
  getSavedParticipantInfo,
  saveParticipantInfo,
  clearSavedParticipantInfo,
  fetchLiveLeaderboard,
  CARD_EVENT_CONFIG,
  type EntryCodeInfo,
  type SavedParticipantInfo,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from "../services/card-event-api";

// ── Shared Subcomponents ──────────────────────────────────────

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

// ── Card Check-in Components ──────────────────────────────────

const VerifiedEntryResult = ({
  verifiedInfo,
  onSaveAndJoin,
}: Readonly<{
  verifiedInfo: EntryCodeInfo;
  onSaveAndJoin: () => void;
}>) => (
  <div
    style={{
      marginTop: 16,
      padding: "16px",
      background: "var(--ncu-primary-light)",
      borderRadius: "var(--ncu-radius-md)",
      border: "1.5px solid var(--ncu-primary)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ncu-primary)" }}>
      <IonIcon icon={checkmarkCircle} style={{ fontSize: 20 }} />
      <span style={{ fontWeight: 800 }}>驗證成功！</span>
    </div>
    <div style={{ marginTop: 8, fontSize: "14px" }}>
      <div><strong>身分：</strong>{verifiedInfo.label}</div>
      <div><strong>活動：</strong>{verifiedInfo.event.name}</div>
      <div><strong>報到碼：</strong><code>{verifiedInfo.entryCode}</code></div>
    </div>
    <IonButton
      expand="block"
      style={{ marginTop: 12 }}
      onClick={onSaveAndJoin}
    >
      前往建立 / 編輯電子名片
      <IonIcon icon={openOutline} slot="end" style={{ fontSize: 14 }} />
    </IonButton>
  </div>
);

const CheckInFormCard = ({
  entryCode,
  setEntryCode,
  loading,
  error,
  verifiedInfo,
  onVerify,
  onSaveAndJoin,
}: Readonly<{
  entryCode: string;
  setEntryCode: (v: string) => void;
  loading: boolean;
  error: string | null;
  verifiedInfo: EntryCodeInfo | null;
  onVerify: () => void;
  onSaveAndJoin: () => void;
}>) => (
  <IonCard style={{ margin: "0 0 16px" }}>
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <IonCardTitle style={{ fontSize: "17px", fontWeight: 700 }}>
        活動身分報到
      </IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <p style={{ color: "var(--ncu-muted)", fontSize: "13px", marginTop: 0 }}>
        請輸入現場工作人員提供的報到代碼（Entry Code）：
      </p>

      <IonItem
        lines="none"
        style={{
          "--background": "var(--ncu-canvas)",
          borderRadius: "var(--ncu-radius-md)",
          border: "1.5px solid var(--ncu-border)",
          marginTop: 8,
        }}
      >
        <IonInput
          value={entryCode}
          placeholder="例如：JOINNCU1"
          onIonInput={(e) => setEntryCode(String(e.detail.value ?? ""))}
          style={{ fontWeight: 700, letterSpacing: 1 }}
        />
      </IonItem>

      {error && (
        <div style={{ margin: "10px 0 0" }}>
          <p style={{ color: "var(--ncu-danger)", fontSize: "13px", margin: 0 }}>
            {error}
          </p>
          <IonButton
            expand="block"
            fill="outline"
            color="primary"
            style={{ marginTop: 8 }}
            href={`${CARD_EVENT_CONFIG.baseUrl}/join/${encodeURIComponent(entryCode.trim().toUpperCase())}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            直接前往報到建立名片 ↗
          </IonButton>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: 12 }}>
        <IonButton
          expand="block"
          style={{ flex: 1 }}
          onClick={onVerify}
          disabled={loading || !entryCode.trim()}
        >
          {loading ? <IonSpinner name="crescent" /> : "驗證報到碼"}
        </IonButton>
        <IonButton
          expand="block"
          fill="outline"
          style={{ flex: 1 }}
          href={entryCode.trim() ? `${CARD_EVENT_CONFIG.baseUrl}/join/${encodeURIComponent(entryCode.trim().toUpperCase())}` : `${CARD_EVENT_CONFIG.baseUrl}/scan`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {entryCode.trim() ? "前往報到 ↗" : "掃碼報到 ↗"}
        </IonButton>
      </div>

      {verifiedInfo && (
        <VerifiedEntryResult
          verifiedInfo={verifiedInfo}
          onSaveAndJoin={onSaveAndJoin}
        />
      )}
    </IonCardContent>
  </IonCard>
);

const UserProfileCard = ({
  savedUser,
  onLogout,
}: Readonly<{
  savedUser: SavedParticipantInfo;
  onLogout: () => void;
}>) => (
  <IonCard style={{ margin: "0 0 16px", border: "2px solid var(--ncu-ink)" }}>
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <IonCardTitle style={{ fontSize: "17px", fontWeight: 800 }}>
          我的電子名片
        </IonCardTitle>
        <IonBadge color="success">已報到</IonBadge>
      </div>
    </IonCardHeader>
    <IonCardContent>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px",
          background: "var(--ncu-surface)",
          borderRadius: "var(--ncu-radius-md)",
          border: "1.5px solid var(--ncu-border)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--ncu-primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          <IonIcon icon={personOutline} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "16px" }}>{savedUser.label}</div>
          <div style={{ color: "var(--ncu-muted)", fontSize: "12px" }}>
            代碼：<code>{savedUser.entryCode}</code> · {savedUser.eventName}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        <IonButton
          expand="block"
          color="primary"
          href={`${CARD_EVENT_CONFIG.baseUrl}/scan`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IonIcon icon={scan} slot="start" />
          開啟相機 掃碼交換名片
          <IonIcon icon={openOutline} slot="end" style={{ fontSize: 13 }} />
        </IonButton>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <IonButton
            size="small"
            fill="clear"
            href={`${CARD_EVENT_CONFIG.baseUrl}/join/${savedUser.entryCode}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            修改個人名片資料 ↗
          </IonButton>
          <IonButton
            size="small"
            fill="clear"
            color="danger"
            onClick={onLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            切換身分
          </IonButton>
        </div>
      </div>
    </IonCardContent>
  </IonCard>
);

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
  const myRankEntry = data?.top.find(
    (p) => savedUser && p.nickname === savedUser.label,
  );

  return (
    <IonCard style={{ margin: "0 0 16px" }}>
      <IonCardHeader style={{ paddingBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <IonCardTitle style={{ fontSize: "17px", fontWeight: 800 }}>
              迎新即時排行榜
            </IonCardTitle>
            {data && (
              <span style={{ fontSize: "11px", color: "var(--ncu-muted)" }}>
                {data.totalRanked} 人在榜 · 更新於 {new Date(data.updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <IonButton size="small" fill="clear" onClick={onRefresh} aria-label="重新整理">
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </div>

        {savedUser && myRankEntry && (
          <div style={{ marginTop: 8 }}>
            <IonBadge color="warning" style={{ fontWeight: 800, padding: "4px 8px" }}>
              我的排名：第 {myRankEntry.rank} 名 ({myRankEntry.score} 分)
            </IonBadge>
          </div>
        )}
      </IonCardHeader>

      <IonCardContent style={{ padding: "0 0 8px" }}>
        {loading && !data && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <IonSpinner name="crescent" />
            <p style={{ color: "var(--ncu-muted)", fontSize: "13px", marginTop: 8 }}>
              正在載入最新排行榜…
            </p>
          </div>
        )}

        {error && !data && (
          <div style={{ textAlign: "center", padding: "16px", color: "var(--ncu-danger)" }}>
            <p style={{ margin: 0, fontSize: "13px" }}>{error}</p>
            <IonButton size="small" fill="outline" onClick={onRefresh} style={{ marginTop: 8 }}>
              點此重試
            </IonButton>
          </div>
        )}

        {data && (
          <IonList lines="full">
            {data.top.map((player) => (
              <LeaderboardPlayerItem
                key={`${player.rank}-${player.nickname}`}
                player={player}
                isMe={savedUser?.label === player.nickname}
              />
            ))}
          </IonList>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// ── Main Page Component ───────────────────────────────────────

const CardsPage = () => {
  const [savedUser, setSavedUser] = useState<SavedParticipantInfo | null>(null);
  const [entryCode, setEntryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedInfo, setVerifiedInfo] = useState<EntryCodeInfo | null>(null);

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

  const handleVerify = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVerifiedInfo(null);
    try {
      const info = await verifyEntryCode(entryCode);
      setVerifiedInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "驗證失敗");
    } finally {
      setLoading(false);
    }
  }, [entryCode]);

  const handleSaveAndJoin = useCallback(() => {
    if (!verifiedInfo) return;
    saveParticipantInfo(verifiedInfo);
    setSavedUser(getSavedParticipantInfo());
    window.open(
      `${CARD_EVENT_CONFIG.baseUrl}/join/${verifiedInfo.entryCode}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [verifiedInfo]);

  const handleLogout = useCallback(() => {
    clearSavedParticipantInfo();
    setSavedUser(null);
    setVerifiedInfo(null);
    setEntryCode("");
  }, []);

  const handlePullRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>使用者中心</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
        <IonRefresher slot="fixed" onIonRefresh={handlePullRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {savedUser ? (
          <UserProfileCard savedUser={savedUser} onLogout={handleLogout} />
        ) : (
          <CheckInFormCard
            entryCode={entryCode}
            setEntryCode={setEntryCode}
            loading={loading}
            error={error}
            verifiedInfo={verifiedInfo}
            onVerify={handleVerify}
            onSaveAndJoin={handleSaveAndJoin}
          />
        )}

        <LeaderboardCard
          data={lbData}
          loading={lbLoading}
          error={lbError}
          savedUser={savedUser}
          onRefresh={loadLeaderboardData}
        />
      </IonContent>
    </IonPage>
  );
};

export default CardsPage;
