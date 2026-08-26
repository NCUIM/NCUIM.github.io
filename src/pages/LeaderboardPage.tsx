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
  IonIcon,
  IonBadge,
} from "@ionic/react";
import { trophy, medal, ribbon } from "ionicons/icons";
import { useState } from "react";

interface Player {
  readonly rank: number;
  readonly name: string;
  readonly score: number;
  readonly cards: number;
  readonly emoji: string;
}

const mockLeaderboard: readonly Player[] = [
  { rank: 1, name: "王小明", score: 280, cards: 14, emoji: "🦊" },
  { rank: 2, name: "李小華", score: 240, cards: 12, emoji: "🐼" },
  { rank: 3, name: "張大同", score: 220, cards: 11, emoji: "🦁" },
  { rank: 4, name: "陳小美", score: 180, cards: 9, emoji: "🐨" },
  { rank: 5, name: "林志豪", score: 160, cards: 8, emoji: "🐯" },
  { rank: 6, name: "黃雅婷", score: 140, cards: 7, emoji: "🐰" },
  { rank: 7, name: "趙小雲", score: 120, cards: 6, emoji: "🦄" },
  { rank: 8, name: "孫悟空", score: 100, cards: 5, emoji: "🐵" },
];

const mockUserRank: Player = {
  rank: 12,
  name: "你（測試使用者）",
  score: 60,
  cards: 3,
  emoji: "🐱",
};

const RankIcon = ({ rank }: Readonly<{ rank: number }>) => {
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
};

const UserRankDetails = ({ userRank }: Readonly<{ userRank: Player }>) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontWeight: "var(--ncu-font-weight-bold)", fontSize: "var(--ncu-font-size-lg)" }}>
      {userRank.name}
    </div>
    <div style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-sm)" }}>
      {userRank.cards} 張卡片
    </div>
  </div>
);

const UserRankScore = ({ userRank }: Readonly<{ userRank: Player }>) => (
  <div style={{ textAlign: "right" }}>
    <div
      style={{
        fontSize: "var(--ncu-font-size-2xl)",
        fontWeight: "var(--ncu-font-weight-bold)",
        color: "var(--ncu-primary)",
      }}
    >
      #{userRank.rank}
    </div>
    <div style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-sm)" }}>
      {userRank.score} 分
    </div>
  </div>
);

const UserRankRow = ({ userRank }: Readonly<{ userRank: Player }>) => (
  <div style={{ display: "flex", alignItems: "center", gap: "var(--ncu-space-3)" }}>
    <span style={{ fontSize: 36 }}>{userRank.emoji}</span>
    <UserRankDetails userRank={userRank} />
    <UserRankScore userRank={userRank} />
  </div>
);

const MyRankCard = ({ userRank }: Readonly<{ userRank: Player }>) => (
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
        <UserRankRow userRank={userRank} />
      </IonCardContent>
    </IonCard>
  </div>
);

const PlayerScoreBadge = ({ score }: Readonly<{ score: number }>) => (
  <div slot="end" style={{ textAlign: "right" }}>
    <span
      style={{
        fontWeight: "var(--ncu-font-weight-bold)",
        color: "var(--ncu-primary)",
        fontSize: "var(--ncu-font-size-md)",
      }}
    >
      {score}
    </span>
    <span style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-xs)", marginLeft: 2 }}>
      分
    </span>
  </div>
);

const RankingItem = ({ player }: Readonly<{ player: Player }>) => (
  <IonItem lines="full">
    <div slot="start" style={{ marginRight: "var(--ncu-space-3)", minWidth: 32 }}>
      <RankIcon rank={player.rank} />
    </div>
    <span style={{ fontSize: 24, marginRight: "var(--ncu-space-3)" }}>
      {player.emoji}
    </span>
    <IonLabel>
      <div style={{ fontWeight: "var(--ncu-font-weight-bold)" }}>{player.name}</div>
      <div style={{ color: "var(--ncu-muted)", fontSize: "var(--ncu-font-size-xs)" }}>
        {player.cards} 張卡片
      </div>
    </IonLabel>
    <PlayerScoreBadge score={player.score} />
  </IonItem>
);

const LeaderboardList = ({ players }: Readonly<{ players: readonly Player[] }>) => (
  <IonList lines="full">
    {players.map((player) => (
      <RankingItem key={player.rank} player={player} />
    ))}
  </IonList>
);

const LeaderboardCard = ({ players }: Readonly<{ players: readonly Player[] }>) => (
  <div style={{ flex: 1, padding: "var(--ncu-space-4)", minHeight: 0 }}>
    <IonCard style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <IonCardHeader style={{ paddingBottom: "var(--ncu-space-2)", flexShrink: 0 }}>
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-md)" }}>
          全體排名
        </IonCardTitle>
      </IonCardHeader>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <LeaderboardList players={players} />
      </div>
    </IonCard>
  </div>
);

const LeaderboardPage = () => {
  const [players] = useState<readonly Player[]>(mockLeaderboard);
  const [userRank] = useState<Player>(mockUserRank);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cards" text="" />
          </IonButtons>
          <IonTitle>排行榜</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ncu-leaderboard-content" style={{ display: "flex", flexDirection: "column" }}>
        <MyRankCard userRank={userRank} />
        <LeaderboardCard players={players} />
      </IonContent>
    </IonPage>
  );
};

export default LeaderboardPage;
