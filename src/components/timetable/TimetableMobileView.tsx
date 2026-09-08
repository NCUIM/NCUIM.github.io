import React, { useEffect, useMemo, useRef } from "react";
import {
  IonBadge,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonText,
} from "@ionic/react";
import { star } from "ionicons/icons";
import { days, type Course, type Period } from "../../types/timetable";
import { getDayFixedTracks } from "../../utils/timetable-matcher";

export const parseTeacherAndRoom = (
  rawTeacherItem: string,
  fallbackRoom?: string,
): { name: string; room?: string } => {
  const match = /^([^(]+)\(([^)]+)\)$/.exec(rawTeacherItem.trim());
  if (match) {
    return { name: match[1].trim(), room: match[2].trim() };
  }
  return { name: rawTeacherItem.trim(), room: fallbackRoom };
};

// skipcq: JS-R1005
export const MobileTrackCard = ({
  course,
  maxTracks,
}: Readonly<{
  course: Course;
  maxTracks: number;
}>) => {
  const titleSize = maxTracks >= 3 ? 15.5 : 16;
  const descSize = maxTracks >= 3 ? 13.5 : 14;
  const roomText = course.room && !course.teacher.includes("(") ? ` · ${course.room}` : "";

  return (
    <div style={{ minWidth: 0 }}>
      <h2
        style={{
          fontSize: titleSize,
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.3,
          wordBreak: "break-word",
        }}
      >
        {course.isMyCourse && (
          <IonIcon
            icon={star}
            style={{
              color: "var(--ncu-star)",
              marginRight: 3,
              fontSize: "0.95em",
              verticalAlign: "middle",
            }}
          />
        )}
        {course.name}
        {course.requiredTag && (
          <span style={{ fontSize: 11, color: "var(--ncu-primary)", marginLeft: 4, fontWeight: 700 }}>
            [{course.requiredTag}]
          </span>
        )}
      </h2>
      <p
        style={{
          margin: "3px 0 0",
          fontSize: descSize,
          color: "var(--ncu-muted)",
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}
      >
        {course.teacher.includes(" / ") ? (
          course.teacher.split(" / ").map((t, idx) => {
            const { name, room } = parseTeacherAndRoom(t);
            const isThisMySection = Boolean(
              course.isMyCourse &&
              ((course.myEnrolledTeacher && (name.includes(course.myEnrolledTeacher) || course.myEnrolledTeacher.includes(name))) ||
               (course.myEnrolledRoom && room && course.myEnrolledRoom === room))
            );
            return (
              <span key={t}>
                {idx > 0 && " / "}
                <span
                  style={{
                    textDecoration: isThisMySection ? "underline" : "none",
                    textDecorationColor: "var(--ncu-primary)",
                    textUnderlineOffset: "3px",
                    fontWeight: isThisMySection ? 700 : 400,
                    color: isThisMySection ? "var(--ncu-ink)" : "var(--ncu-muted)",
                  }}
                >
                  {name}{room ? ` (${room})` : ""}
                </span>
              </span>
            );
          })
        ) : (
          `${course.teacher}${roomText}`
        )}
      </p>
    </div>
  );
};

// skipcq: JS-R1005
export const PeriodTimeBadge = ({
  period,
  isCurrent,
  isNext,
}: Readonly<{
  period: Period;
  isCurrent: boolean;
  isNext: boolean;
}>) => {
  const badgeColor = isCurrent ? "primary" : "warning";
  const badgeText = isCurrent ? "NOW" : "NEXT";
  const textColor = isCurrent ? "var(--ncu-primary)" : "var(--ncu-ink)";
  const timeColor = isCurrent ? "var(--ncu-primary)" : "var(--ncu-muted)";
  const hasBadge = isCurrent || isNext;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "54px",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      <IonText style={{ fontSize: "18px", fontWeight: 800, color: textColor }}>
        {period.id}
      </IonText>
      <IonText style={{ fontSize: "11px", color: timeColor, fontWeight: isCurrent ? 700 : 400, lineHeight: 1.2 }}>
        {period.time}
      </IonText>
      {hasBadge && (
        <IonBadge color={badgeColor} style={{ fontSize: "9px", marginTop: "4px", padding: "1px 4px" }}>
          {badgeText}
        </IonBadge>
      )}
    </div>
  );
};

// skipcq: JS-R1005
export const MobileRowItem = ({
  period,
  tracks,
  idx,
  isToday,
  currentPeriodIndex,
  nextPeriodIndex,
  maxTracks,
  periodRefs,
}: Readonly<{
  period: Period;
  tracks: (Course | null)[];
  idx: number;
  isToday: boolean;
  currentPeriodIndex: number;
  nextPeriodIndex: number;
  maxTracks: number;
  periodRefs: React.MutableRefObject<(HTMLIonItemElement | null)[]>;
}>) => {
  const isCurrent = isToday && idx === currentPeriodIndex;
  const isNext = isToday && idx === nextPeriodIndex && idx !== currentPeriodIndex;
  const trackSlots = tracks.map((course, slotIdx) => ({
    course,
    slotKey: `mobile-slot-${period.id}-${slotIdx}`,
  }));

  return (
    <IonItem
      key={period.id}
      ref={(el) => {
        periodRefs.current[idx] = el;
      }}
      style={{
        "--background": isCurrent ? "var(--ncu-primary-light)" : "var(--ncu-surface)",
        "--border-color": isCurrent ? "var(--ncu-primary)" : "var(--ncu-border)",
        "--border-width": isCurrent ? "2px" : "1px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "stretch",
          gap: "12px",
          padding: "10px 0",
        }}
      >
        <PeriodTimeBadge period={period} isCurrent={isCurrent} isNext={isNext} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${maxTracks}, minmax(0, 1fr))`,
              gap: "8px",
              width: "100%",
              alignItems: "flex-start",
            }}
          >
            {trackSlots.map(({ course, slotKey }) =>
              course ? (
                <MobileTrackCard key={slotKey} course={course} maxTracks={maxTracks} />
              ) : (
                <div key={slotKey} />
              ),
            )}
          </div>
        </div>
      </div>
    </IonItem>
  );
};

export const TimetableMobileView = ({
  timetableData,
  selectedDay,
  onSelectDay,
  currentPeriodIndex,
  nextPeriodIndex,
  isToday,
}: Readonly<{
  timetableData: Record<string, Course[]>;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  currentPeriodIndex: number;
  nextPeriodIndex: number;
  isToday: boolean;
}>) => {
  const dayIndex = Number(selectedDay);
  const periodRefs = useRef<(HTMLIonItemElement | null)[]>([]);

  const { maxTracks, rows } = useMemo(
    () => getDayFixedTracks(timetableData, dayIndex),
    [timetableData, dayIndex],
  );

  const scrollToIndex =
    currentPeriodIndex >= 0 ? currentPeriodIndex : nextPeriodIndex;

  useEffect(() => {
    if (!isToday || scrollToIndex < 0) return undefined;
    const timer = setTimeout(() => {
      periodRefs.current[scrollToIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => {
      clearTimeout(timer);
    };
  }, [isToday, scrollToIndex, selectedDay]);

  return (
    <section className="timetable-mobile" aria-label="依日課表">
      <IonSegment
        value={selectedDay}
        onIonChange={(event) => onSelectDay(String(event.detail.value ?? "0"))}
        scrollable
        style={{ marginBottom: 8 }}
      >
        {days.map((day, index) => (
          <IonSegmentButton key={day} value={String(index)}>
            <IonLabel>週{day}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
      <IonList className="timetable-course-list" inset>
        {rows.map(({ period, tracks, idx }) => (
          <MobileRowItem
            key={period.id}
            period={period}
            tracks={tracks}
            idx={idx}
            isToday={isToday}
            currentPeriodIndex={currentPeriodIndex}
            nextPeriodIndex={nextPeriodIndex}
            maxTracks={maxTracks}
            periodRefs={periodRefs}
          />
        ))}
      </IonList>
    </section>
  );
};
