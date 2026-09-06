import { IonItem, IonLabel, IonBadge, IonIcon } from "@ionic/react";
import { trophy, medal, ribbon } from "ionicons/icons";
import type { LeaderboardEntry } from "../../services/card-event-api";

export const RankBadge = ({ rank }: Readonly<{ rank: number }>) => {
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

export const LeaderboardPlayerItem = ({
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

export default LeaderboardPlayerItem;
