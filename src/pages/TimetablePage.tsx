import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonContent,
} from "@ionic/react";

interface Course {
  name: string;
  teacher: string;
  room: string;
}

const days = ["一", "二", "三", "四", "五"];

const allPeriods = [
  { id: "1", time: "08:10-09:00" },
  { id: "2", time: "09:10-10:00" },
  { id: "3", time: "10:10-11:00" },
  { id: "4", time: "11:10-12:00" },
  { id: "N", time: "12:10-13:00" },
  { id: "5", time: "13:10-14:00" },
  { id: "6", time: "14:10-15:00" },
  { id: "7", time: "15:10-16:00" },
  { id: "8", time: "16:10-17:00" },
  { id: "9", time: "17:10-18:00" },
  { id: "A", time: "18:10-19:00" },
  { id: "B", time: "19:10-20:00" },
  { id: "C", time: "20:10-21:00" },
  { id: "D", time: "21:10-22:00" },
  { id: "E", time: "22:10-23:00" },
];

// Mock graduate-level timetable data
// Key: "periodId-dayIndex" (dayIndex 0=一,4=五)
const timetable: Record<string, Course> = {
  "1-0": { name: "計算機科學", teacher: "王志明", room: "313" },
  "1-2": { name: "計算機科學", teacher: "王志明", room: "313" },
  "3-1": { name: "資料庫系統", teacher: "李怡萱", room: "209" },
  "3-3": { name: "資料庫系統", teacher: "李怡萱", room: "209" },
  "5-0": { name: "機器學習", teacher: "陳俊廷", room: "919" },
  "5-2": { name: "機器學習", teacher: "陳俊廷", room: "919" },
  "7-1": { name: "演算法設計", teacher: "張文慧", room: "310" },
  "7-4": { name: "計算機網路", teacher: "林家豪", room: "313" },
  "9-3": { name: "軟體工程", teacher: "黃雅琪", room: "209" },
  "9-4": { name: "資訊安全", teacher: "劉承恩", room: "310" },
};

// Show all daytime periods (1–9 + N), drop evening (A–E)
const periods = allPeriods.filter((p) => p.id !== "A" && p.id !== "B" && p.id !== "C" && p.id !== "D" && p.id !== "E");

function CourseCell({ course }: { course: Course | undefined }) {
  if (!course)
    return (
      <div
        style={{
          ...cellBase,
          background: "var(--ncu-surface)",
        }}
      />
    );
  return (
    <div
      style={{
        ...cellBase,
        background: "var(--ncu-primary-light)",
        padding: "2px 3px",
        gap: 0,
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {course.name}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--ncu-muted)",
          lineHeight: 1.2,
        }}
      >
        {course.teacher.slice(0, 1)}{course.room}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--ncu-primary)",
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {course.room}
      </div>
    </div>
  );
}

const cellBase: React.CSSProperties = {
  border: "1px solid var(--ncu-border)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  overflow: "hidden",
};

export default function TimetablePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>碩士班課表</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--padding-start": "8px", "--padding-end": "8px" } as any}>
        <div
          style={{
            overflow: "auto",
            border: "2px solid var(--ncu-ink)",
            borderRadius: "var(--ncu-radius-md)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px repeat(5, 1fr)",
              gridTemplateRows: `40px repeat(${periods.length}, 1fr)`,
              height: "calc(100vh - 160px)",
            }}
          >
            {/* Header row */}
            <div
              style={{
                ...cellBase,
                minHeight: 40,
                background: "var(--ncu-ink)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              節
            </div>
            {days.map((d) => (
              <div
                key={d}
                style={{
                  ...cellBase,
                  minHeight: 40,
                  background: "var(--ncu-primary)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                週{d}
              </div>
            ))}

            {/* Data rows — only periods with courses */}
            {periods.map((p) => (
              <>
                <div
                  key={`label-${p.id}`}
                  style={{
                    ...cellBase,
                    background: "var(--ncu-primary-light)",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{p.id}</div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 10, color: "var(--ncu-muted)", lineHeight: 1.1 }}>
                      <span>{p.time.split("-")[0]}</span>
                      <span>-</span>
                      <span>{p.time.split("-")[1]}</span>
                    </div>
                  </div>
                </div>
                {days.map((d, di) => {
                  const key = `${p.id}-${di}`;
                  return (
                    <CourseCell key={`${p.id}-${d}`} course={timetable[key]} />
                  );
                })}
              </>
            ))}
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
}
