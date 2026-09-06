import {
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { TrackType } from "../../data/im-curriculum";

export interface TrackSelectorCardProps {
  readonly track: TrackType;
  readonly onSelectTrack: (track: TrackType) => void;
}

const CURRICULUM_PDF_URL =
  "https://im.mgt.ncu.edu.tw/download/newpost/115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E5%85%A5%E5%AD%B8%E9%81%A9%E7%94%A8-%E8%B3%87%E7%AE%A1%E7%B3%BB%E7%A2%A9%E5%A3%AB%E7%8F%AD%E5%BF%85%E4%BF%AE%E5%8F%8A%E9%81%B8%E4%BF%AE%E7%A7%91%E7%9B%AE%E8%A1%A8-v1150609.pdf";

const TrackSelectorContent = ({
  track,
  onSelectTrack,
}: Readonly<TrackSelectorCardProps>) => (
  <>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        flexWrap: "wrap",
        gap: 6,
      }}
    >
      <span style={{ fontWeight: 700, color: "var(--ncu-ink)", fontSize: 15 }}>
        選擇修讀組別
      </span>
      <a
        href={CURRICULUM_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 12.5,
          color: "var(--ncu-primary)",
          textDecoration: "none",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <span>115 必選修科目表 PDF ↗</span>
      </a>
    </div>
    <IonSegment
      value={track}
      onIonChange={(e) => onSelectTrack(e.detail.value as TrackType)}
    >
      <IonSegmentButton value="mgmt">
        <IonLabel style={{ fontWeight: 700 }}>管理組 (33 學分)</IonLabel>
      </IonSegmentButton>
      <IonSegmentButton value="sys">
        <IonLabel style={{ fontWeight: 700 }}>資訊系統組 (30 學分)</IonLabel>
      </IonSegmentButton>
    </IonSegment>
  </>
);

export const TrackSelectorCard = ({
  track,
  onSelectTrack,
}: Readonly<TrackSelectorCardProps>) => (
  <IonCard
    style={{
      margin: "0 0 16px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardContent style={{ padding: "12px 16px" }}>
      <TrackSelectorContent track={track} onSelectTrack={onSelectTrack} />
    </IonCardContent>
  </IonCard>
);

export default TrackSelectorCard;
