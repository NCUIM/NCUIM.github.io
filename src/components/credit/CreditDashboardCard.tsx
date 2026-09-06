import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonProgressBar,
} from "@ionic/react";
import { CreditCalculationResult } from "../../data/im-curriculum";

export interface CreditDashboardCardProps {
  readonly trackName: string;
  readonly creditStats: CreditCalculationResult;
}

const DashboardHeader = ({
  trackName,
  creditStats,
}: Readonly<CreditDashboardCardProps>) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
    }}
  >
    <div>
      <IonCardSubtitle style={{ color: "var(--ncu-primary)", fontWeight: 700 }}>
        {trackName} 畢業學分試算
      </IonCardSubtitle>
      <IonCardTitle
        style={{
          fontSize: "var(--ncu-font-size-2xl)",
          fontWeight: 800,
          color: "var(--ncu-ink)",
        }}
      >
        {creditStats.totalEarnedCredits} / {creditStats.targetCredits} 學分
      </IonCardTitle>
    </div>
    <div>
      {creditStats.isGraduationEligible ? (
        <IonBadge color="success" style={{ fontSize: 14, padding: "6px 12px", fontWeight: 700 }}>
          🎉 應修學分已達標
        </IonBadge>
      ) : (
        <IonBadge color="warning" style={{ fontSize: 14, padding: "6px 12px", fontWeight: 700 }}>
          尚缺 {Math.max(0, creditStats.targetCredits - creditStats.totalEarnedCredits)} 學分
        </IonBadge>
      )}
    </div>
  </div>
);

const DashboardBody = ({
  creditStats,
}: Readonly<{
  creditStats: CreditCalculationResult;
}>) => (
  <>
    <IonProgressBar
      value={creditStats.progressPercentage / 100}
      color={creditStats.isGraduationEligible ? "success" : "primary"}
      style={{ height: 10, borderRadius: 5, marginBottom: 12 }}
    />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ncu-muted)" }}>
      <span>達成進度：{creditStats.progressPercentage}%</span>
      <span>最低畢業門檻：{creditStats.targetCredits} 學分</span>
    </div>
  </>
);

export const CreditDashboardCard = ({
  trackName,
  creditStats,
}: Readonly<CreditDashboardCardProps>) => (
  <IonCard
    style={{
      margin: "0 0 20px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
      background: "var(--ncu-surface)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <DashboardHeader trackName={trackName} creditStats={creditStats} />
    </IonCardHeader>
    <IonCardContent>
      <DashboardBody creditStats={creditStats} />
    </IonCardContent>
  </IonCard>
);

export default CreditDashboardCard;
