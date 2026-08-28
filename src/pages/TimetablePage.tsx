import React, { useState } from "react";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

interface Course {
  readonly name: string;
  readonly teacher: string;
  readonly room: string;
  readonly isMyCourse?: boolean;
}

interface Period {
  readonly id: string;
  readonly time: string;
}

const days: readonly string[] = ["一", "二", "三", "四", "五"];
const periods: readonly Period[] = [
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
];

const timetable: Readonly<Record<string, Course>> = {
  "1-0": { name: "計算機科學", teacher: "王志明", room: "313", isMyCourse: true },
  "1-2": { name: "計算機科學", teacher: "王志明", room: "313", isMyCourse: true },
  "3-1": { name: "資料庫系統", teacher: "李怡萱", room: "209" },
  "3-3": { name: "資料庫系統", teacher: "李怡萱", room: "209" },
  "5-0": { name: "機器學習", teacher: "陳俊廷", room: "919", isMyCourse: true },
  "5-2": { name: "機器學習", teacher: "陳俊廷", room: "919", isMyCourse: true },
  "7-1": { name: "演算法設計", teacher: "張文慧", room: "310" },
  "7-4": { name: "計算機網路", teacher: "林家豪", room: "313" },
  "9-3": { name: "軟體工程", teacher: "黃雅琪", room: "209" },
  "9-4": { name: "資訊安全", teacher: "劉承恩", room: "310" },
};

const cellBase: React.CSSProperties = {
  border: "1px solid var(--ncu-border)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 48,
  overflow: "hidden",
};

const CourseCell = ({ course }: Readonly<{ course?: Course }>) => {
  const isMine = course?.isMyCourse ?? false;
  return (
    <div
      style={{
        ...cellBase,
        alignItems: "center",
        padding: "3px 4px",
        textAlign: "center",
        background: isMine
          ? "var(--ncu-star-light)"
          : course
            ? "var(--ncu-primary-light)"
            : "var(--ncu-surface)",
        border: isMine ? "2px solid var(--ncu-star)" : "1px solid var(--ncu-border)",
      }}
    >
      {course && (
        <>
          <strong style={{ fontSize: 11, lineHeight: 1.2 }}>{course.name}</strong>
          <span style={{ fontSize: 9, color: "var(--ncu-muted)" }}>{course.teacher}</span>
          <span style={{ fontSize: 9, color: "var(--ncu-primary)", fontWeight: 700 }}>
            {course.room}
          </span>
        </>
      )}
    </div>
  );
};

const TimetableMobileView = ({
  selectedDay,
  onSelectDay,
}: Readonly<{
  selectedDay: string;
  onSelectDay: (day: string) => void;
}>) => {
  const dayIndex = Number(selectedDay);
  const dailyPeriods = periods.map((period) => ({
    period,
    course: timetable[`${period.id}-${dayIndex}`],
  }));

  return (
    <section className="timetable-mobile" aria-label="依日課表">
      <IonSegment
        value={selectedDay}
        onIonChange={(event) => onSelectDay(String(event.detail.value ?? "0"))}
        scrollable
      >
        {days.map((day, index) => (
          <IonSegmentButton key={day} value={String(index)}>
            <IonLabel>週{day}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
      <IonList className="timetable-course-list" inset>
        {dailyPeriods.map(({ period, course }) => (
          <IonItem
            key={period.id}
            style={course?.isMyCourse ? { "--background": "var(--ncu-star-light)" } as React.CSSProperties : undefined}
          >
            <IonLabel>
              {course ? (
                <>
                  <h2>
                    {course.isMyCourse && (
                      <span style={{ color: "var(--ncu-star)", marginRight: 4 }}>&#9733;</span>
                    )}
                    {course.name}
                  </h2>
                  <p>
                    {course.teacher} · 研究室 {course.room}
                  </p>
                </>
              ) : (
                <h2 style={{ color: "var(--ncu-muted)", fontWeight: 400 }}>空堂</h2>
              )}
            </IonLabel>
            <IonNote slot="end">
              第 {period.id} 節<br />
              {period.time}
            </IonNote>
          </IonItem>
        ))}
      </IonList>
    </section>
  );
};

const TimetableDesktopView = () => (
  <section className="timetable-desktop" aria-label="全週課表">
    <div
      style={{
        border: "2px solid var(--ncu-ink)",
        borderRadius: "var(--ncu-radius-md)",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "72px repeat(5, minmax(0, 1fr))",
      }}
    >
      <div
        style={{
          ...cellBase,
          alignItems: "center",
          background: "var(--ncu-ink)",
          color: "#fff",
          fontWeight: 700,
        }}
      >
        節次
      </div>
      {days.map((day) => (
        <div
          key={day}
          style={{
            ...cellBase,
            alignItems: "center",
            background: "var(--ncu-primary)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          週{day}
        </div>
      ))}
      {periods.map((period) => (
        <React.Fragment key={period.id}>
          <div
            style={{
              ...cellBase,
              alignItems: "center",
              background: "var(--ncu-primary-light)",
              fontSize: 13,
            }}
          >
            <strong>第 {period.id} 節</strong>
            <span>{period.time}</span>
          </div>
          {days.map((day, index) => (
            <CourseCell
              key={`${period.id}-${day}`}
              course={timetable[`${period.id}-${index}`]}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  </section>
);

const TimetableHeader = () => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/" text="" />
      </IonButtons>
      <IonTitle>碩士班課表</IonTitle>
    </IonToolbar>
  </IonHeader>
);

const TimetableBody = ({
  selectedDay,
  onSelectDay,
}: Readonly<{
  selectedDay: string;
  onSelectDay: (day: string) => void;
}>) => (
  <IonContent className="ion-padding timetable-content">
    <TimetableMobileView selectedDay={selectedDay} onSelectDay={onSelectDay} />
    <TimetableDesktopView />
  </IonContent>
);

const TimetablePage = () => {
  const [selectedDay, setSelectedDay] = useState("0");

  return (
    <IonPage>
      <TimetableHeader />
      <TimetableBody selectedDay={selectedDay} onSelectDay={setSelectedDay} />
    </IonPage>
  );
};

export default TimetablePage;
