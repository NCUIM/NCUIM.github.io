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
  IonBadge,
  IonIcon,
} from "@ionic/react";
import { checkmarkCircle, alertCircleOutline } from "ionicons/icons";
import {
  TRACK_CONFIGS,
  TrackType,
  CurriculumCourse,
  SectionCreditResult,
} from "../../data/im-curriculum";

export interface SectionCardProps {
  readonly section: (typeof TRACK_CONFIGS)[TrackType]["sections"][number];
  readonly result?: SectionCreditResult;
  readonly selectedCourseIds: readonly string[];
  readonly onToggleCourse: (id: string, checked: boolean) => void;
}

const CourseItemRow = ({
  course,
  isChecked,
  onToggle,
}: Readonly<{
  course: CurriculumCourse;
  isChecked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}>) => (
  <IonItem
    button
    detail={false}
    onClick={() => onToggle(course.id, !isChecked)}
    style={{
      "--background": isChecked ? "var(--ncu-primary-light)" : "var(--ncu-surface)",
      cursor: "pointer",
    }}
  >
    <IonCheckbox slot="start" checked={isChecked} style={{ pointerEvents: "none" }} />
    <IonLabel style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
          {course.name}
        </strong>
        {course.code && (
          <IonBadge color="light" style={{ fontSize: 11, border: "1px solid var(--ncu-border)" }}>
            {course.code}
          </IonBadge>
        )}
      </div>
    </IonLabel>
    <IonNote slot="end" style={{ fontWeight: 700, fontSize: 13, color: "var(--ncu-ink)" }}>
      {course.credits} 學分
    </IonNote>
  </IonItem>
);

const SectionHeaderContent = ({
  section,
  result,
}: Readonly<{
  section: (typeof TRACK_CONFIGS)[TrackType]["sections"][number];
  result?: SectionCreditResult;
}>) => (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: 800 }}>
          {section.title}
        </IonCardTitle>
        {result?.isMet ? (
          <IonBadge color="success">
            <IonIcon icon={checkmarkCircle} style={{ verticalAlign: "middle", marginRight: 2 }} />
            已達標 ({result.earned}/{result.target})
          </IonBadge>
        ) : (
          <IonBadge color="medium">
            需 {result?.target ?? section.requiredCredits} 學分 · 目前 {result?.earned ?? 0}
          </IonBadge>
        )}
      </div>
    </div>
    <IonCardSubtitle style={{ marginTop: 4, color: "var(--ncu-muted)", fontSize: 12 }}>
      {section.description}
    </IonCardSubtitle>
    {result?.hint && (
      <div style={{ marginTop: 6, fontSize: 12, color: "#d97706", display: "flex", alignItems: "center", gap: 4 }}>
        <IonIcon icon={alertCircleOutline} />
        <span>{result.hint}</span>
      </div>
    )}
  </>
);

export const SectionCard = ({
  section,
  result,
  selectedCourseIds,
  onToggleCourse,
}: Readonly<SectionCardProps>) => (
  <IonCard
    style={{
      margin: "0 0 16px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 6 }}>
      <SectionHeaderContent section={section} result={result} />
    </IonCardHeader>

    <IonCardContent style={{ padding: 0 }}>
      <IonList lines="full" style={{ padding: 0 }}>
        {section.courses.map((course) => (
          <CourseItemRow
            key={course.id}
            course={course}
            isChecked={selectedCourseIds.includes(course.id)}
            onToggle={onToggleCourse}
          />
        ))}
      </IonList>
    </IonCardContent>
  </IonCard>
);

export default SectionCard;
