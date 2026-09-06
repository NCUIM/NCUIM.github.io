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
  IonItem,
  IonInput,
  IonSpinner,
  IonList,
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
} from "@ionic/react";
import {
  scan,
  openOutline,
  checkmarkCircle,
  personOutline,
  logOutOutline,
  refreshOutline,
  logoGithub,
} from "ionicons/icons";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  verifyEntryCode,
  getSavedParticipantInfo,
  saveParticipantInfo,
  clearSavedParticipantInfo,
  fetchLiveLeaderboard,
  CARD_EVENT_CONFIG,
  type EntryCodeInfo,
  type SavedParticipantInfo,
  type LeaderboardResponse,
} from "../services/card-event-api";
import { LeaderboardPlayerItem } from "../components/leaderboard/LeaderboardPlayerItem";

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
      textAlign: "center",
      padding: "12px 16px 16px",
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 8,
        background: "var(--ncu-success-light)",
        color: "#0f766e",
        fontWeight: 800,
        fontSize: 15,
      }}
    >
      <IonIcon icon={checkmarkCircle} style={{ fontSize: 22 }} />
      <span style={{ whiteSpace: "nowrap" }}>
        報到成功 · 謝謝參加！🎉
      </span>
    </div>
    <p
      style={{
        margin: "10px 0 0",
        color: "var(--ncu-muted)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      你已成功登記活動身分，主辦單位將依照報到名單發放對應權益。
    </p>
    <IonButton
      fill="outline"
      color="success"
      onClick={onSaveAndJoin}
      style={{ marginTop: 10, fontWeight: 700 }}
    >
      前往活動頁面 ↗
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
  setEntryCode: (code: string) => void;
  loading: boolean;
  error: string | null;
  verifiedInfo: EntryCodeInfo | null;
  onVerify: () => void;
  onSaveAndJoin: () => void;
}>) => (
  <IonCard style={{ margin: "0 0 16px" }}>
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <IonCardTitle style={{ fontSize: "17px", fontWeight: 800 }}>
        活動身分報到
      </IonCardTitle>
    </IonCardHeader>
    <IonCardContent style={{ padding: "4px 16px 16px" }}>
      {verifiedInfo ? (
        <VerifiedEntryResult
          verifiedInfo={verifiedInfo}
          onSaveAndJoin={onSaveAndJoin}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <IonInput
              value={entryCode}
              onIonInput={(e) => setEntryCode((e.target as unknown as HTMLInputElement).value)}
              placeholder="輸入報到代碼"
              fill="outline"
              style={{ width: "100%", fontWeight: 600 }}
            />
          </div>
          {error && (
            <p style={{ margin: 0, color: "var(--ncu-danger)", fontSize: 13 }}>
              {error}
            </p>
          )}
          <IonButton
            expand="block"
            fill="outline"
            disabled={loading || !entryCode.trim()}
            onClick={onVerify}
            style={{ fontWeight: 700 }}
          >
            {loading && <IonSpinner name="crescent" style={{ marginRight: 8 }} />}
            核對報到代碼
          </IonButton>
        </div>
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
  <IonCard style={{ margin: "0 0 16px" }}>
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <IonCardTitle style={{ fontSize: "17px", fontWeight: 800 }}>
        目前身分
      </IonCardTitle>
    </IonCardHeader>
    <IonCardContent style={{ padding: "4px 16px 16px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "8px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--ncu-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ncu-primary)",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {savedUser.label.charAt(0)}
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {savedUser.label}
            </span>
          </div>
          <IonBadge color="primary" style={{ fontWeight: 800, padding: "4px 8px" }}>
            已報到
          </IonBadge>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
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
  onScrollToCheckin,
}: Readonly<{
  data: LeaderboardResponse | null;
  loading: boolean;
  error: string | null;
  savedUser: SavedParticipantInfo | null;
  onRefresh: () => void;
  onScrollToCheckin?: () => void;
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

// 跨域問題修復前暫時隱藏活動身分報到區塊，保留所有完整元件與邏輯
const SHOW_CARD_CHECKIN = false;

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

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollToTop(350);
  }, []);

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

        {SHOW_CARD_CHECKIN && (
          savedUser ? (
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
          )
        )}

        <LeaderboardCard
          data={lbData}
          loading={lbLoading}
          error={lbError}
          savedUser={savedUser}
          onRefresh={loadLeaderboardData}
          onScrollToCheckin={scrollToTop}
        />

        <UserPageFooter />
      </IonContent>
    </IonPage>
  );
};

export default CardsPage;
