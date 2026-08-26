import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonButton,
} from "@ionic/react";
import { trophy, medal, ribbon } from "ionicons/icons";
import { useState, useEffect, useCallback } from "react";

// Mock data — will be replaced with Firestore queries
const MOCK_RANKINGS = [
  { rank: 1, name: "阿明", score: 42, cards: 12, emoji: "🦊" },
  { rank: 2, name: "小花", score: 38, cards: 10, emoji: "🌸" },
  { rank: 3, name: "大雄", score: 35, cards: 9, emoji: "🦁" },
  { rank: 4, name: "小新", score: 30, cards: 8, emoji: "🐧" },
  { rank: 5, name: "妮妮", score: 28, cards: 7, emoji: "🐱" },
  { rank: 6, name: "風間", score: 25, cards: 7, emoji: "🐻" },
  { rank: 7, name: "正男", score: 22, cards: 6, emoji: "🐶" },
  { rank: 8, name: "阿呆", score: 18, cards: 5, emoji: "🐸" },
];

const MY_RANK = { rank: 15, name: "我", score: 12, cards: 4, emoji: "🐰" };

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1)
    return <IonIcon icon={trophy} style={{ fontSize: 24, color: "var(--ncu-star)" }} />;
  if (rank === 2)
    return <IonIcon icon={medal} style={{ fontSize: 22, color: "#aaa" }} />;
  if (rank === 3)
    return <IonIcon icon={ribbon} style={{ fontSize: 22, color: "#cd7f32" }} />;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--ncu-primary-light)",
        color: "var(--ncu-primary)",
        fontWeight: "var(--ncu-font-weight-bold)",
        fontSize: "var(--ncu-font-size-sm)",
      }}
    >
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState(MOCK_RANKINGS);
  const [myRank, setMyRank] = useState(MY_RANK);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback((e: CustomEvent) => {
    setTimeout(() => {
      setLastUpdated(new Date());
      (e.target as HTMLIonRefresherElement).complete();
    }, 800);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cards" />
          </IonButtons>
          <IonTitle>排行榜</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={false}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* My Rank Card — fixed at top */}
          <div style={{ padding: "var(--ncu-space-4)", paddingBottom: 0, flexShrink: 0 }}>
            <IonCard
              style={{
                margin: 0,
                border: "2px solid var(--ncu-primary)",
                background: "var(--ncu-primary-light)",
              }}
            >
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: "var(--ncu-font-size-sm)", color: "var(--ncu-muted)" }}>
                  我的排名 <IonBadge color="medium">Demo</IonBadge>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ncu-space-3)" }}>
                  <span style={{ fontSize: 36 }}>{myRank.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "var(--ncu-font-weight-bold)", fontSize: "var(--ncu-font-size-lg)" }}>
                      {myRank.name}
                    </div>
                    <div style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-sm)" }}>
                      {myRank.cards} 張卡片
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "var(--ncu-font-size-2xl)",
                        fontWeight: "var(--ncu-font-weight-bold)",
                        color: "var(--ncu-primary)",
                      }}
                    >
                      #{myRank.rank}
                    </div>
                    <div style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-sm)" }}>
                      {myRank.score} 分
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Rankings List — scrollable */}
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--ncu-space-4)" }}>
            <div style={{ height: 1, background: "var(--ncu-border)" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--ncu-space-3)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "var(--ncu-font-size-lg)",
                  fontWeight: "var(--ncu-font-weight-bold)",
                }}
              >
                排行榜 <IonBadge color="medium">Demo</IonBadge>
              </h3>
              <IonNote style={{ fontSize: "var(--ncu-font-size-xs)" }}>
                {lastUpdated.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })} 更新
              </IonNote>
            </div>

            <IonCard style={{ margin: 0, border: "1px solid var(--ncu-border)" }}>
              <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
                {rankings.map((player) => (
                  <IonItem key={player.rank} lines="full">
                    <div slot="start" style={{ marginRight: "var(--ncu-space-3)", minWidth: 32 }}>
                      <RankIcon rank={player.rank} />
                    </div>
                    <IonAvatar slot="start" style={{ marginRight: "var(--ncu-space-2)" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          background: "var(--ncu-canvas)",
                        }}
                      >
                        {player.emoji}
                      </div>
                    </IonAvatar>
                    <IonLabel>
                      <h2 style={{ fontWeight: "var(--ncu-font-weight-medium)" }}>{player.name}</h2>
                      <p style={{ fontSize: "var(--ncu-font-size-sm)", color: "var(--ncu-muted)" }}>
                        {player.cards} 張卡片
                      </p>
                    </IonLabel>
                    <IonBadge
                      color="primary"
                      slot="end"
                      style={{ fontSize: "var(--ncu-font-size-base)", padding: "4px 8px" }}
                    >
                      {player.score} 分
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            </IonCard>

            {/* Footer note */}
            <div
              style={{
                textAlign: "center",
                color: "var(--ncu-muted)",
                fontSize: "var(--ncu-font-size-xs)",
                marginTop: "var(--ncu-space-4)",
              }}
            >
              Demo 資料 · 只顯示前 8 名 · 工作人員不計入排名
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
