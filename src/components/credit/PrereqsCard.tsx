import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonNote,
  IonIcon,
} from "@ionic/react";
import { schoolOutline } from "ionicons/icons";
import { TRACK_CONFIGS, TrackType, PrereqCourse } from "../../data/im-curriculum";

export interface PrereqsCardProps {
  readonly track: TrackType;
  readonly prereqs: (typeof TRACK_CONFIGS)[TrackType]["prereqs"];
  readonly selectedPrereqIds: readonly string[];
  readonly onTogglePrereq: (id: string, checked: boolean) => void;
}

const PrereqItemRow = ({
  course,
  isChecked,
  onToggle,
}: Readonly<{
  course: PrereqCourse;
  isChecked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}>) => (
  <IonItem
    button
    detail={false}
    onClick={() => onToggle(course.id, !isChecked)}
    style={{
      "--background": isChecked ? "var(--ncu-success-light)" : "var(--ncu-surface)",
      cursor: "pointer",
    }}
  >
    <IonCheckbox slot="start" checked={isChecked} style={{ pointerEvents: "none" }} />
    <IonLabel style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
          {course.name}
        </strong>
        {course.note && (
          <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>{course.note}</span>
        )}
      </div>
    </IonLabel>
    <IonNote
      slot="end"
      style={{
        fontWeight: 700,
        fontSize: 12,
        color: isChecked ? "#0d7a3e" : "var(--ncu-muted)",
      }}
    >
      {isChecked ? "✓ 已修" : "未修"}
    </IonNote>
  </IonItem>
);

const PrereqSubPanel = ({
  title,
  courses,
  selectedPrereqIds,
  onTogglePrereq,
}: Readonly<{
  title: string;
  courses: readonly PrereqCourse[];
  selectedPrereqIds: readonly string[];
  onTogglePrereq: (id: string, checked: boolean) => void;
}>) => (
  <div style={{ marginBottom: 14 }}>
    <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "var(--ncu-ink)" }}>
      {title}
    </h4>
    <IonList
      lines="full"
      style={{
        padding: 0,
        border: "1.5px solid var(--ncu-border)",
        borderRadius: "var(--ncu-radius-md)",
        overflow: "hidden",
      }}
    >
      {courses.map((p) => (
        <PrereqItemRow
          key={p.id}
          course={p}
          isChecked={selectedPrereqIds.includes(p.id)}
          onToggle={onTogglePrereq}
        />
      ))}
    </IonList>
  </div>
);

export const PrereqsCard = ({
  track,
  prereqs,
  selectedPrereqIds,
  onTogglePrereq,
}: Readonly<PrereqsCardProps>) => (
  <IonCard
    style={{
      margin: "0 0 16px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IonIcon icon={schoolOutline} style={{ fontSize: 20, color: "var(--ncu-primary)" }} />
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: 800 }}>
          入學先修課程檢核
        </IonCardTitle>
      </div>
      <IonCardSubtitle style={{ marginTop: 4, color: "var(--ncu-muted)", fontSize: 12 }}>
        大學非本科或入學未曾修習者需補修（補修學分不計入畢業學分）
      </IonCardSubtitle>
    </IonCardHeader>

    <IonCardContent style={{ paddingTop: 8 }}>
      <PrereqSubPanel
        title="全所共同先修科目"
        courses={prereqs.common}
        selectedPrereqIds={selectedPrereqIds}
        onTogglePrereq={onTogglePrereq}
      />
      <PrereqSubPanel
        title={track === "mgmt" ? "管理組先修科目" : "資訊系統組先修科目"}
        courses={prereqs.track}
        selectedPrereqIds={selectedPrereqIds}
        onTogglePrereq={onTogglePrereq}
      />
    </IonCardContent>
  </IonCard>
);

export default PrereqsCard;
