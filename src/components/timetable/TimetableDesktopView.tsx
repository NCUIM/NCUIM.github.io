import React, { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import { star } from "ionicons/icons";
import {
  days,
  periods,
  type Period,
  type DesktopCourseSpan,
  type Course,
} from "../../types/timetable";
import { getDesktopCourseSpans } from "../../utils/timetable-matcher";
import { parseTeacherAndRoom } from "./TimetableMobileView";

export const DESKTOP_ROW_HEIGHT = 78;
export const DESKTOP_EMPTY_ROW_HEIGHT = 38;
export const TITLE_FONT_SIZES = [18, 18, 16, 14.5];
export const TEACHER_FONT_SIZES = [14.5, 14.5, 13.5, 12.5];

// skipcq: JS-R1005
export const DesktopRulerItem = ({
  period,
  rowHeight,
  isLast,
}: Readonly<{
  period: Period;
  rowHeight: number;
  isLast: boolean;
}>) => {
  const isSlim = rowHeight === DESKTOP_EMPTY_ROW_HEIGHT;
  const isNoon = period.id === "Z" || period.id === "N";
  const title = isNoon ? "午休" : `第 ${period.id} 節`;
  const bg = isNoon ? "rgba(0, 0, 0, 0.03)" : "var(--ncu-primary-light)";
  const borderBottomStyle = isLast ? "none" : "1px solid var(--ncu-border)";

  return (
    <div
      style={{
        height: rowHeight,
        borderBottom: borderBottomStyle,
        borderRight: "2px solid var(--ncu-ink)",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 2px",
        textAlign: "center",
        opacity: isSlim ? 0.75 : 1,
      }}
    >
      <strong style={{ fontSize: isSlim ? 13 : 15, color: "var(--ncu-ink)", fontWeight: 700 }}>
        {title}
      </strong>
      <span style={{ fontSize: isSlim ? 10.5 : 12, color: "var(--ncu-muted)", marginTop: isSlim ? 0 : 2 }}>
        {period.time}
      </span>
    </div>
  );
};

export const DesktopRulerColumn = ({
  periodHeights,
}: Readonly<{
  periodHeights: readonly number[];
}>) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    {periods.map((period, idx) => (
      <DesktopRulerItem
        key={period.id}
        period={period}
        rowHeight={periodHeights[idx]}
        isLast={idx === periods.length - 1}
      />
    ))}
  </div>
);

const getFontSize = (sizes: readonly number[], totalCols: number): number => {
  const idx = Math.max(0, Math.min(totalCols - 1, sizes.length - 1));
  return sizes[idx] || 13.5;
};

// skipcq: JS-R1005
export const DesktopCourseCard = ({
  span,
  periodTops,
}: Readonly<{
  span: DesktopCourseSpan;
  periodTops: readonly number[];
}>) => {
  const isMine = Boolean(span.course.isMyCourse);
  const startTop = periodTops[span.startIdx];
  const spanHeight = periodTops[span.endIdx + 1] - periodTops[span.startIdx];
  const leftPct = (span.colIndex / span.totalCols) * 100;
  const widthPct = 100 / span.totalCols;

  const titleFontSize = getFontSize(TITLE_FONT_SIZES, span.totalCols);
  const teacherFontSize = getFontSize(TEACHER_FONT_SIZES, span.totalCols);
  const cardBg = isMine ? "var(--ncu-star-light)" : "#ffffff";
  const cardBoxShadow = isMine ? "inset 0 0 0 2px var(--ncu-star)" : "none";
  const cardZIndex = isMine ? 3 : 2;

  return (
    <div
      style={{
        position: "absolute",
        top: startTop,
        height: spanHeight,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        background: cardBg,
        border: "1px solid var(--ncu-border)",
        padding: "8px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 4,
        boxShadow: cardBoxShadow,
        zIndex: cardZIndex,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
        {isMine && (
          <IonIcon icon={star} style={{ color: "var(--ncu-star)", fontSize: titleFontSize, flexShrink: 0 }} />
        )}
        <strong style={{ fontSize: titleFontSize, fontWeight: 800, lineHeight: 1.3, color: "var(--ncu-ink)" }}>
          {span.course.name}
        </strong>
        {span.course.requiredTag && (
          <span style={{ fontSize: 11, color: "var(--ncu-primary)", fontWeight: 700 }}>
            [{span.course.requiredTag}]
          </span>
        )}
      </div>
      {(() => {
        const singleParsed = parseTeacherAndRoom(span.course.teacher);
        const singleName = singleParsed.name;
        const singleRoom = span.course.room || singleParsed.room;
        const singleMy = Boolean(
          span.course.isMyCourse &&
          ((span.course.myEnrolledTeacher && (singleName.includes(span.course.myEnrolledTeacher) || span.course.myEnrolledTeacher.includes(singleName))) ||
           (span.course.myEnrolledRoom && singleRoom && span.course.myEnrolledRoom === singleRoom))
        );
        return span.course.teacher.includes(" / ") ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            {span.course.teacher.split(" / ").map((t) => {
              const { name, room } = parseTeacherAndRoom(t);
              const isThisMySection = Boolean(
                span.course.isMyCourse &&
                ((span.course.myEnrolledTeacher && (name.includes(span.course.myEnrolledTeacher) || span.course.myEnrolledTeacher.includes(name))) ||
                 (span.course.myEnrolledRoom && room && span.course.myEnrolledRoom === room))
              );
              return (
                <div
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: teacherFontSize,
                      color: isThisMySection ? "var(--ncu-ink)" : "var(--ncu-muted)",
                      lineHeight: 1.25,
                      fontWeight: isThisMySection ? 700 : 500,
                      textDecoration: isThisMySection ? "underline" : "none",
                      textDecorationColor: "var(--ncu-primary)",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    {name}
                  </span>
                  {room && (
                    <span
                      style={{
                        fontSize: span.totalCols <= 2 ? 11 : 10,
                        color: "var(--ncu-primary)",
                        fontWeight: 700,
                        background: "rgba(49, 87, 200, 0.08)",
                        padding: "1px 6px",
                        borderRadius: 4,
                        textDecoration: isThisMySection ? "underline" : "none",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      {room}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <span style={{
              fontSize: teacherFontSize,
              color: singleMy ? "var(--ncu-ink)" : "var(--ncu-muted)",
              lineHeight: 1.25,
              fontWeight: singleMy ? 700 : 500,
              textDecoration: singleMy ? "underline" : "none",
              textDecorationColor: "var(--ncu-primary)",
              textUnderlineOffset: "3px",
            }}>
              {singleName}
            </span>
            {singleRoom && (
              <span
                style={{
                  fontSize: span.totalCols <= 2 ? 12 : 11,
                  color: "var(--ncu-primary)",
                  fontWeight: 700,
                  background: "rgba(49, 87, 200, 0.08)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  textDecoration: singleMy ? "underline" : "none",
                  textUnderlineOffset: "2px",
                }}
              >
                {singleRoom}
              </span>
            )}
          </>
        );
      })()}
    </div>
  );
};

export const TimetableDesktopView = ({
  timetableData,
  todayDayIndex,
}: Readonly<{
  timetableData: Record<string, Course[]>;
  todayDayIndex: number;
}>) => {
  const daySpans = useMemo(() => {
    return days.map((_, dayIdx) => getDesktopCourseSpans(timetableData, dayIdx));
  }, [timetableData]);

  const periodHeights = useMemo(() => {
    return periods.map((p) => {
      const hasCourse = days.some((_, dayIdx) => {
        const list = timetableData[`${p.id}-${dayIdx}`];
        return list && list.length > 0;
      });
      return hasCourse ? DESKTOP_ROW_HEIGHT : DESKTOP_EMPTY_ROW_HEIGHT;
    });
  }, [timetableData]);

  const periodTops = useMemo(() => {
    const tops = [0];
    for (let i = 0; i < periodHeights.length; i++) {
      tops.push(tops[i] + periodHeights[i]);
    }
    return tops;
  }, [periodHeights]);

  const totalBodyHeight = periodTops[periods.length];

  return (
    <section
      className="timetable-desktop"
      aria-label="全週課表"
      style={{ maxWidth: 1380, width: "100%", margin: "0 auto", padding: "8px 0 32px" }}
    >
      <div
        style={{
          border: "2px solid var(--ncu-ink)",
          borderRadius: "var(--ncu-radius-md)",
          overflow: "hidden",
          background: "var(--ncu-surface)",
          boxShadow: "var(--ncu-shadow-hard)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px repeat(5, minmax(0, 1fr))",
            borderBottom: "2px solid var(--ncu-ink)",
          }}
        >
          <div
            style={{
              padding: "12px 4px",
              textAlign: "center",
              background: "var(--ncu-ink)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              borderRight: "2px solid var(--ncu-ink)",
            }}
          >
            節次
          </div>
          {days.map((day, dayIdx) => {
            const isTodayCol = dayIdx === todayDayIndex;
            return (
              <div
                key={day}
                style={{
                  padding: "12px 4px",
                  textAlign: "center",
                  background: isTodayCol ? "#1e3a8a" : "var(--ncu-primary)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 17,
                  borderRight: dayIdx === days.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.2)",
                  boxShadow: isTodayCol ? "inset 0 -3.5px 0 #fbbf24" : "none",
                }}
              >
                週{day}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px repeat(5, minmax(0, 1fr))",
            position: "relative",
          }}
        >
          <DesktopRulerColumn periodHeights={periodHeights} />
          {days.map((day, dayIdx) => {
            const spans = daySpans[dayIdx];
            const isTodayCol = dayIdx === todayDayIndex;
            const spanSlots = spans.map((span, sIdx) => ({
              span,
              spanKey: `desktop-span-${day}-${sIdx}`,
            }));

            return (
              <div
                key={day}
                style={{
                  position: "relative",
                  height: totalBodyHeight,
                  borderRight: dayIdx === days.length - 1 ? "none" : "1px solid var(--ncu-border)",
                  background: isTodayCol ? "rgba(49, 87, 200, 0.02)" : "var(--ncu-surface)",
                }}
              >
                {spanSlots.map(({ span, spanKey }) => (
                  <DesktopCourseCard key={spanKey} span={span} periodTops={periodTops} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
