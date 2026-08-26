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
  IonCheckbox,
  IonNote,
} from "@ionic/react";
import { useState } from "react";

interface Course {
  readonly id: string;
  readonly name: string;
  readonly credits: number;
  readonly category: "required" | "elective";
}

const courses: readonly Course[] = [
  { id: "1", name: "計算機科學", credits: 3, category: "required" },
  { id: "2", name: "資料庫系統", credits: 3, category: "required" },
  { id: "3", name: "機器學習", credits: 3, category: "elective" },
  { id: "4", name: "演算法設計", credits: 3, category: "required" },
  { id: "5", name: "計算機網路", credits: 3, category: "elective" },
];

const StatBlock = ({
  value,
  label,
  color,
}: Readonly<{
  value: number;
  label: string;
  color: string;
}>) => (
  <div>
    <div
      style={{
        fontSize: "var(--ncu-font-size-2xl)",
        fontWeight: "var(--ncu-font-weight-bold)",
        color,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: "var(--ncu-font-size-sm)", color: "var(--ncu-muted)" }}>
      {label}
    </div>
  </div>
);

const StatsGrid = ({
  requiredCredits,
  electiveCredits,
}: Readonly<{
  requiredCredits: number;
  electiveCredits: number;
}>) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "var(--ncu-space-3)",
      textAlign: "center",
    }}
  >
    <StatBlock value={requiredCredits} label="必修" color="var(--ncu-primary)" />
    <StatBlock value={electiveCredits} label="選修" color="var(--ncu-success)" />
    <StatBlock
      value={requiredCredits + electiveCredits}
      label="總學分"
      color="var(--ncu-muted)"
    />
  </div>
);

const CreditSummaryCard = ({
  requiredCredits,
  electiveCredits,
}: Readonly<{
  requiredCredits: number;
  electiveCredits: number;
}>) => (
  <IonCard
    style={{
      margin: "0 0 var(--ncu-space-4)",
      border: "2px solid var(--ncu-ink)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader>
      <IonCardTitle>畢業學分概覽</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <StatsGrid
        requiredCredits={requiredCredits}
        electiveCredits={electiveCredits}
      />
    </IonCardContent>
  </IonCard>
);

const CourseItemRow = ({
  course,
  isChecked,
  onToggle,
}: Readonly<{
  course: Course;
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}>) => (
  <IonItem>
    <IonCheckbox
      slot="start"
      checked={isChecked}
      onIonChange={(event) => onToggle(event.detail.checked)}
    />
    <IonLabel>
      <h2>{course.name}</h2>
      <p>{course.category === "required" ? "必修" : "選修"} · {course.credits} 學分</p>
    </IonLabel>
    <IonNote slot="end">{course.credits} 學分</IonNote>
  </IonItem>
);

const CourseList = ({
  selectedCourseIds,
  onToggleCourse,
}: Readonly<{
  selectedCourseIds: readonly string[];
  onToggleCourse: (courseId: string, checked: boolean) => void;
}>) => (
  <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
    {courses.map((course) => (
      <CourseItemRow
        key={course.id}
        course={course}
        isChecked={selectedCourseIds.includes(course.id)}
        onToggle={(checked) => onToggleCourse(course.id, checked)}
      />
    ))}
  </IonList>
);

const CreditPage = () => {
  const [selectedCourseIds, setSelectedCourseIds] = useState<readonly string[]>([]);
  const selectedCourses = courses.filter((course) => selectedCourseIds.includes(course.id));
  const requiredCredits = selectedCourses
    .filter((course) => course.category === "required")
    .reduce((total, course) => total + course.credits, 0);
  const electiveCredits = selectedCourses
    .filter((course) => course.category === "elective")
    .reduce((total, course) => total + course.credits, 0);

  const toggleCourse = (courseId: string, checked: boolean) =>
    setSelectedCourseIds((ids) =>
      checked ? [...ids, courseId] : ids.filter((id) => id !== courseId)
    );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>學分試算</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <CreditSummaryCard
          requiredCredits={requiredCredits}
          electiveCredits={electiveCredits}
        />
        <h3 style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: "var(--ncu-font-weight-bold)" }}>
          課程清單（Demo 資料）
        </h3>
        <CourseList
          selectedCourseIds={selectedCourseIds}
          onToggleCourse={toggleCourse}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreditPage;
