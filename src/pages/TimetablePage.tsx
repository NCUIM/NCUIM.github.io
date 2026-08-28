import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { isCisLoggedIn, cisLogout } from "../services/cis-login";
import { fetchCisSelectedCourses, type CisCourse } from "../services/cis-course-api";
import {
  fetchImMasterCourses,
  buildTimetableMapFromMasterCourses,
  type MasterCourseItem,
} from "../services/all-courses-api";
import { star, swapHorizontalOutline, linkOutline } from "ionicons/icons";
import CisLoginModal from "../components/CisLoginModal";

// ── Types ─────────────────────────────────────────────────────

export interface Course {
  readonly id?: string;
  readonly classNo?: string;
  readonly name: string;
  readonly teacher: string;
  readonly room?: string;
  readonly courseType?: "REQUIRED" | "ELECTIVE" | string;
  readonly credit?: number;
  readonly isMyCourse?: boolean;
}

interface Period {
  readonly id: string;
  readonly time: string;
}

interface DayCourseSpan {
  course: Course;
  startIdx: number;
  endIdx: number;
  trackIndex: number;
}

interface DesktopCourseSpan {
  course: Course;
  startIdx: number;
  endIdx: number;
  colIndex: number;
  totalCols: number;
}

// ── Constants ─────────────────────────────────────────────────

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

const DESKTOP_ROW_HEIGHT = 78;
const DESKTOP_EMPTY_ROW_HEIGHT = 38;

// ── Helpers ───────────────────────────────────────────────────

function getDefaultDayIndex(): number {
  const d = new Date().getDay();
  if (d >= 1 && d <= 5) return d - 1;
  return 0;
}

function getTimeIndicators(
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): { current: number; next: number } {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  let current = -1;
  let next = -1;
  for (let i = 0; i < periods.length; i++) {
    const [startStr, endStr] = periods[i].time.split("-");
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const courses = timetableData[`${periods[i].id}-${dayIndex}`];
    const hasCourse = Boolean(courses && courses.length > 0);
    if (mins >= start && mins < end && hasCourse) {
      current = i;
    } else if (next === -1 && mins < start && hasCourse) {
      next = i;
    }
  }
  return { current, next };
}

function matchCisCourse(master: MasterCourseItem, myCourses: readonly CisCourse[]): { isMine: boolean; room?: string } {
  const matched = myCourses.find((c) => {
    if (c.serialNo && String(master.serialNo) === String(c.serialNo)) {
      return true;
    }
    if (c.classNo && master.classNo && c.classNo === master.classNo) {
      return true;
    }
    const sameTitle = c.name.trim() === master.title.trim();
    const sameTeacher = master.teachers.some(
      (t) => t.trim() && (c.teacher.includes(t.trim()) || t.trim().includes(c.teacher.trim())),
    );
    return sameTitle && sameTeacher;
  });

  return {
    isMine: Boolean(matched),
    room: matched?.room || master.room,
  };
}

function mapMasterCourseToCourse(
  c: MasterCourseItem,
  myCourses: readonly CisCourse[],
): Course {
  const { isMine, room } = matchCisCourse(c, myCourses);
  return {
    id: String(c.serialNo),
    classNo: c.classNo,
    name: c.title,
    teacher: c.teachers.join(", "),
    room: room || c.room,
    courseType: c.courseType,
    credit: c.credit,
    isMyCourse: isMine,
  };
}

function buildTimetableFromCisCourses(courses: readonly CisCourse[]): Record<string, Course[]> {
  const DAY_MAP: Record<string, number> = {
    "一": 0, "二": 1, "三": 2, "四": 3, "五": 4,
    "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4,
  };
  const result: Record<string, Course[]> = {};

  for (const c of courses) {
    for (const ct of c.classTimes) {
      let dayIdx = -1;
      let periodChars = "";

      if (ct.includes("-")) {
        const [d, p] = ct.split("-");
        const dNum = parseInt(d, 10);
        if (dNum >= 1 && dNum <= 5) {
          dayIdx = dNum - 1;
          periodChars = p;
        }
      } else if (ct.length >= 2 && ct[0] >= "1" && ct[0] <= "5") {
        dayIdx = parseInt(ct[0], 10) - 1;
        periodChars = ct.slice(1);
      } else {
        const dayMatch = ct.match(/^(Mon|Tue|Wed|Thu|Fri|[一二三四五])/);
        if (dayMatch) {
          dayIdx = DAY_MAP[dayMatch[1]] ?? -1;
          periodChars = ct.slice(dayMatch[0].length);
        }
      }

      if (dayIdx < 0) continue;
      for (const ch of periodChars) {
        const period = periods.find((p) => p.id === ch);
        if (!period) continue;
        const key = `${period.id}-${dayIdx}`;
        if (!result[key]) {
          result[key] = [];
        }
        if (!result[key].some((x) => x.name === c.name && x.teacher === c.teacher)) {
          result[key].push({
            id: c.serialNo,
            classNo: c.classNo,
            name: c.name,
            teacher: c.teacher,
            room: c.room,
            credit: c.credit,
            isMyCourse: true,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Mobile view fixed track layout
 */
function getDayFixedTracks(
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): {
  maxTracks: number;
  rows: { period: Period; tracks: (Course | null)[]; idx: number }[];
} {
  const spans: DayCourseSpan[] = [];
  const processedCourses = new Set<string>();

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const courses = timetableData[`${p.id}-${dayIndex}`] || [];

    for (const c of courses) {
      const courseIdKey = `${c.id || c.name}-${c.teacher}`;
      if (processedCourses.has(courseIdKey)) continue;

      let end = i;
      while (end + 1 < periods.length) {
        const nextP = periods[end + 1];
        const nextCourses = timetableData[`${nextP.id}-${dayIndex}`] || [];
        const isMatch = nextCourses.some(
          (nc) =>
            (nc.id && c.id && nc.id === c.id) ||
            (nc.name.trim() === c.name.trim() &&
              nc.teacher.trim() === c.teacher.trim()),
        );
        if (isMatch) {
          end++;
        } else {
          break;
        }
      }

      processedCourses.add(courseIdKey);
      spans.push({
        course: c,
        startIdx: i,
        endIdx: end,
        trackIndex: 0,
      });
    }
  }

  spans.sort((a, b) => a.startIdx - b.startIdx);

  for (let i = 0; i < spans.length; i++) {
    const usedTracks = new Set<number>();
    for (let j = 0; j < i; j++) {
      const overlaps =
        Math.max(spans[i].startIdx, spans[j].startIdx) <=
        Math.min(spans[i].endIdx, spans[j].endIdx);
      if (overlaps) {
        usedTracks.add(spans[j].trackIndex);
      }
    }
    let track = 0;
    while (usedTracks.has(track)) {
      track++;
    }
    spans[i].trackIndex = track;
  }

  const maxTracks = Math.max(1, ...spans.map((s) => s.trackIndex + 1));

  const rows = periods.map((period, i) => {
    const tracks: (Course | null)[] = Array(maxTracks).fill(null);
    for (const span of spans) {
      if (i >= span.startIdx && i <= span.endIdx) {
        tracks[span.trackIndex] = span.course;
      }
    }
    return {
      period,
      tracks,
      idx: i,
    };
  });

  return { maxTracks, rows };
}

/**
 * Desktop view cluster-based course spanning layout
 * Automatically calculates dynamic column divisions so morning 2-course cluster takes 50% each,
 * rather than being squished by afternoon 4-course clusters.
 */
function getDesktopCourseSpans(
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): DesktopCourseSpan[] {
  const spans: { course: Course; startIdx: number; endIdx: number }[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const courses = timetableData[`${p.id}-${dayIndex}`] || [];

    for (const c of courses) {
      const key = `${c.id || c.name}-${c.teacher}`;
      if (processed.has(key)) continue;

      let end = i;
      while (end + 1 < periods.length) {
        const nextP = periods[end + 1];
        const nextCourses = timetableData[`${nextP.id}-${dayIndex}`] || [];
        if (
          nextCourses.some(
            (nc) =>
              (nc.id && c.id && nc.id === c.id) ||
              (nc.name.trim() === c.name.trim() &&
                nc.teacher.trim() === c.teacher.trim()),
          )
        ) {
          end++;
        } else {
          break;
        }
      }

      processed.add(key);
      spans.push({ course: c, startIdx: i, endIdx: end });
    }
  }

  const result: DesktopCourseSpan[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < spans.length; i++) {
    if (visited.has(i)) continue;

    const clusterIndices: number[] = [i];
    visited.add(i);

    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < spans.length; j++) {
        if (visited.has(j)) continue;
        const overlapsWithCluster = clusterIndices.some(
          (cIdx) =>
            Math.max(spans[cIdx].startIdx, spans[j].startIdx) <=
            Math.min(spans[cIdx].endIdx, spans[j].endIdx),
        );
        if (overlapsWithCluster) {
          clusterIndices.push(j);
          visited.add(j);
          changed = true;
        }
      }
    }

    const cluster = clusterIndices
      .map((idx) => spans[idx])
      .sort((a, b) => a.startIdx - b.startIdx);

    const assignedTracks: number[] = [];
    for (let cIdx = 0; cIdx < cluster.length; cIdx++) {
      const usedInCluster = new Set<number>();
      for (let prev = 0; prev < cIdx; prev++) {
        const overlaps =
          Math.max(cluster[cIdx].startIdx, cluster[prev].startIdx) <=
          Math.min(cluster[cIdx].endIdx, cluster[prev].endIdx);
        if (overlaps) {
          usedInCluster.add(assignedTracks[prev]);
        }
      }
      let track = 0;
      while (usedInCluster.has(track)) {
        track++;
      }
      assignedTracks.push(track);
    }

    const clusterTotalCols = Math.max(1, ...assignedTracks.map((t) => t + 1));

    for (let cIdx = 0; cIdx < cluster.length; cIdx++) {
      result.push({
        course: cluster[cIdx].course,
        startIdx: cluster[cIdx].startIdx,
        endIdx: cluster[cIdx].endIdx,
        colIndex: assignedTracks[cIdx],
        totalCols: clusterTotalCols,
      });
    }
  }

  return result;
}

// ── Mobile View ───────────────────────────────────────────────

const TimetableMobileView = ({
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
    if (!isToday || scrollToIndex < 0) return;
    const timer = setTimeout(() => {
      periodRefs.current[scrollToIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => clearTimeout(timer);
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
        {rows.map(({ period, tracks, idx }) => {
          const isCurrent = isToday && idx === currentPeriodIndex;
          const isNext =
            isToday && idx === nextPeriodIndex && idx !== currentPeriodIndex;
          const hasMyCourse = tracks.some((c) => c?.isMyCourse);
          const hasAnyCourse = tracks.some((c) => c !== null);
          const isSlim = !hasAnyCourse;

          return (
            <IonItem
              key={period.id}
              ref={(el) => {
                periodRefs.current[idx] = el;
              }}
              style={
                {
                  ...(hasMyCourse
                    ? { "--background": "var(--ncu-star-light)" }
                    : {}),
                  ...(isCurrent
                    ? {
                        borderLeft: "3px solid var(--ncu-primary)",
                        "--min-height": "48px",
                      }
                    : isNext
                      ? {
                          borderLeft: "4px solid #0d7a3e",
                          "--min-height": "48px",
                        }
                      : isSlim
                        ? {
                            "--min-height": "36px",
                            opacity: 0.7,
                          }
                        : {
                            "--min-height": "56px",
                          }),
                } as React.CSSProperties
              }
            >
              <IonLabel
                style={{
                  margin: isSlim ? "4px 0" : "10px 0",
                  flex: 1,
                }}
              >
                {!hasAnyCourse ? (
                  <h2
                    style={{
                      color: "var(--ncu-muted)",
                      fontWeight: 400,
                      fontSize: 13,
                      margin: 0,
                    }}
                  >
                    {period.id === "N" ? "午休時間" : "空堂"}
                  </h2>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${maxTracks}, minmax(0, 1fr))`,
                      gap: "8px",
                      width: "100%",
                      alignItems: "flex-start",
                    }}
                  >
                    {tracks.map((course, trackIdx) => {
                      if (!course) {
                        return <div key={`empty-track-${trackIdx}`} />;
                      }

                      return (
                        <div
                          key={`${course.name}-${course.teacher}-${trackIdx}`}
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <h2
                            style={{
                              fontSize: maxTracks >= 3 ? 15.5 : 16,
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
                            {course.courseType === "REQUIRED" && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--ncu-primary)",
                                  marginLeft: 4,
                                  fontWeight: 700,
                                }}
                              >
                                [必修]
                              </span>
                            )}
                          </h2>
                          <p
                            style={{
                              margin: "3px 0 0",
                              fontSize: maxTracks >= 3 ? 13.5 : 14,
                              color: "var(--ncu-muted)",
                              lineHeight: 1.3,
                              wordBreak: "break-word",
                            }}
                          >
                            {course.teacher}
                            {course.room ? ` · ${course.room}` : ""}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </IonLabel>
              <IonNote
                slot="end"
                style={{
                  alignSelf: "center",
                  margin: isSlim ? "auto 0 0 8px" : "auto 0 0 10px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 64,
                  flexShrink: 0,
                  fontSize: isSlim ? 11 : 12,
                }}
              >
                {isCurrent && (
                  <span
                    style={{
                      color: "var(--ncu-primary)",
                      fontWeight: 700,
                      fontSize: 11,
                      display: "block",
                      marginBottom: 1,
                    }}
                  >
                    ● NOW
                  </span>
                )}
                {isNext && (
                  <span
                    style={{
                      color: "#0d7a3e",
                      fontWeight: 700,
                      fontSize: 11,
                      display: "block",
                      marginBottom: 1,
                    }}
                  >
                    &#9654; NEXT
                  </span>
                )}
                {period.id === "N" ? "午休" : `第 ${period.id} 節`}
                <br />
                {period.time}
              </IonNote>
            </IonItem>
          );
        })}
      </IonList>
    </section>
  );
};

// ── Desktop View: 5-Day Weekly Grid with Spanning Continuous Cards ────

const TimetableDesktopView = ({
  timetableData,
  todayDayIndex,
}: Readonly<{
  timetableData: Record<string, Course[]>;
  todayDayIndex: number;
}>) => {
  const daySpans = useMemo(() => {
    return days.map((_, dayIdx) => getDesktopCourseSpans(timetableData, dayIdx));
  }, [timetableData]);

  // Calculate dynamic period heights (shrink rows that are completely empty across all 5 days)
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
        {/* Header row: 6 Columns */}
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
              borderRight: "1px solid rgba(255, 255, 255, 0.2)",
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
                  background: isTodayCol
                    ? "#1e3a8a"
                    : "var(--ncu-primary)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 17,
                  borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: isTodayCol
                    ? "inset 0 -3.5px 0 #fbbf24"
                    : "none",
                }}
              >
                週{day}
              </div>
            );
          })}
        </div>

        {/* 10 Period Grid Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px repeat(5, minmax(0, 1fr))",
            position: "relative",
          }}
        >
          {/* Column 1: Time Ruler */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {periods.map((period, idx) => {
              const h = periodHeights[idx];
              const isSlim = h === DESKTOP_EMPTY_ROW_HEIGHT;

              return (
                <div
                  key={period.id}
                  style={{
                    height: h,
                    borderBottom:
                      idx === periods.length - 1
                        ? "none"
                        : "1px solid var(--ncu-border)",
                    borderRight: "2px solid var(--ncu-ink)",
                    background:
                      period.id === "N"
                        ? "rgba(0, 0, 0, 0.03)"
                        : "var(--ncu-primary-light)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 2px",
                    textAlign: "center",
                    opacity: isSlim ? 0.75 : 1,
                  }}
                >
                  <strong
                    style={{
                      fontSize: isSlim ? 13 : 15,
                      color: "var(--ncu-ink)",
                      fontWeight: 700,
                    }}
                  >
                    {period.id === "N" ? "午休" : `第 ${period.id} 節`}
                  </strong>
                  <span
                    style={{
                      fontSize: isSlim ? 10.5 : 12,
                      color: "var(--ncu-muted)",
                      marginTop: isSlim ? 0 : 2,
                    }}
                  >
                    {period.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Columns 2-6: Day Columns with Spanning Cards (No horizontal slot borders inside!) */}
          {days.map((day, dayIdx) => {
            const spans = daySpans[dayIdx];
            const isTodayCol = dayIdx === todayDayIndex;

            return (
              <div
                key={day}
                style={{
                  position: "relative",
                  height: totalBodyHeight,
                  borderRight:
                    dayIdx === days.length - 1
                      ? "none"
                      : "1px solid var(--ncu-border)",
                  background: isTodayCol ? "rgba(49, 87, 200, 0.02)" : "var(--ncu-surface)",
                }}
              >
                {/* Spanning Course Cards */}
                {spans.map((span) => {
                  const isMine = span.course.isMyCourse ?? false;
                  const isRequired = span.course.courseType === "REQUIRED";
                  const startTop = periodTops[span.startIdx] + 3;
                  const spanHeight =
                    periodTops[span.endIdx + 1] -
                    periodTops[span.startIdx] -
                    6;

                  const titleFontSize =
                    span.totalCols === 1
                      ? 18
                      : span.totalCols === 2
                        ? 16
                        : span.totalCols === 3
                          ? 14.5
                          : 13.5;

                  const teacherFontSize =
                    span.totalCols === 1
                      ? 14.5
                      : span.totalCols === 2
                        ? 13.5
                        : 12.5;

                  const roomFontSize =
                    span.totalCols === 1
                      ? 13
                      : span.totalCols === 2
                        ? 12
                        : 11;

                  return (
                    <div
                      key={`${span.course.name}-${span.course.teacher}-${span.startIdx}`}
                      style={{
                        position: "absolute",
                        top: startTop,
                        height: spanHeight,
                        left: `calc(${(span.colIndex / span.totalCols) * 100}% + 3px)`,
                        width: `calc(${100 / span.totalCols}% - 6px)`,
                        background: isMine
                          ? "var(--ncu-star-light)"
                          : "#ffffff",
                        border: isMine
                          ? "2px solid var(--ncu-star)"
                          : "1px solid var(--ncu-border)",
                        borderRadius: "var(--ncu-radius-sm)",
                        padding: "8px 6px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: 4,
                        boxShadow: isMine
                          ? "0 2px 8px rgba(255, 212, 90, 0.4)"
                          : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        zIndex: isMine ? 3 : 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        {isMine && (
                          <IonIcon
                            icon={star}
                            style={{
                              color: "var(--ncu-star)",
                              fontSize: titleFontSize,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <strong
                          style={{
                            fontSize: titleFontSize,
                            fontWeight: 800,
                            lineHeight: 1.3,
                            color: "var(--ncu-ink)",
                          }}
                        >
                          {span.course.name}
                        </strong>
                        {isRequired && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--ncu-primary)",
                              fontWeight: 700,
                            }}
                          >
                            [必修]
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: teacherFontSize,
                          color: "var(--ncu-muted)",
                          lineHeight: 1.3,
                          fontWeight: 500,
                        }}
                      >
                        {span.course.teacher}
                      </span>
                      {span.course.room && (
                        <span
                          style={{
                            fontSize: roomFontSize,
                            color: "var(--ncu-primary)",
                            fontWeight: 700,
                            background: "rgba(49, 87, 200, 0.08)",
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}
                        >
                          {span.course.room}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Main Page ─────────────────────────────────────────────────

const TimetableHeader = ({
  cisAuthenticated,
  viewScope,
  enrolledCount,
  onToggleViewScope,
  onOpenCisModal,
  onLogout,
}: Readonly<{
  cisAuthenticated: boolean;
  viewScope: "all" | "mine";
  enrolledCount: number;
  onToggleViewScope: () => void;
  onOpenCisModal: () => void;
  onLogout: () => void;
}>) => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/" text="" />
      </IonButtons>
      <IonTitle>{viewScope === "mine" ? "我的課表" : "碩士班課表"}</IonTitle>
      <IonButtons slot="end">
        {cisAuthenticated ? (
          <>
            <IonButton
              fill={viewScope === "mine" ? "solid" : "outline"}
              size="small"
              onClick={onToggleViewScope}
              style={{ fontSize: 12 }}
            >
              <IonIcon slot="start" icon={swapHorizontalOutline} />
              {viewScope === "mine" ? `我的 (${enrolledCount})` : "全所開課"}
            </IonButton>
            <IonButton size="small" fill="clear" onClick={onOpenCisModal}>
              重新連結
            </IonButton>
            <IonButton size="small" fill="clear" onClick={onLogout} color="medium">
              登出
            </IonButton>
          </>
        ) : (
          <IonButton size="small" fill="outline" onClick={onOpenCisModal}>
            <IonIcon slot="start" icon={linkOutline} />
            連結課表
          </IonButton>
        )}
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const TimetablePage = () => {
  const defaultDay = getDefaultDayIndex();
  const [selectedDay, setSelectedDay] = useState(String(defaultDay));
  const [viewScope, setViewScope] = useState<"all" | "mine">(() =>
    isCisLoggedIn() ? "mine" : "all",
  );

  // Auto-tick every 30 seconds so NOW/NEXT indicators update dynamically without page reload
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // If tab stays open past midnight (00:00), automatically advance selectedDay to the new day
  const prevDayRef = useRef(getDefaultDayIndex());
  useEffect(() => {
    const newDay = getDefaultDayIndex();
    if (newDay !== prevDayRef.current) {
      prevDayRef.current = newDay;
      setSelectedDay(String(newDay));
    }
  }, [currentTimestamp]);

  const [masterCourses, setMasterCourses] = useState<MasterCourseItem[]>([]);
  const [myCisCourses, setMyCisCourses] = useState<CisCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cisAuthenticated, setCisAuthenticated] = useState(isCisLoggedIn());
  const [showCisLogin, setShowCisLogin] = useState(false);

  // Load default master courses (IM5000+ from S3 all.json)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const courses = await fetchImMasterCourses();
        if (!cancelled && courses.length > 0) {
          setMasterCourses(courses);
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            err instanceof Error ? err.message : "載入碩士班課程資料失敗",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch courses from CIS session when user links their session
  useEffect(() => {
    if (!cisAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const courses = await fetchCisSelectedCourses();
        if (!cancelled && courses.length > 0) {
          setMyCisCourses(courses);
        } else if (!cancelled) {
          cisLogout();
          setCisAuthenticated(false);
          setApiError("CIS Session 已過期，請重新連結");
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "CIS 載入失敗";
          setApiError(msg);
          cisLogout();
          setCisAuthenticated(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cisAuthenticated]);

  // Combine master courses with user selection & filter by viewScope
  const timetableData = useMemo(() => {
    // In "mine" mode, directly build grid from CIS enrolled courses
    if (viewScope === "mine" && myCisCourses.length > 0) {
      return buildTimetableFromCisCourses(myCisCourses);
    }

    const map = buildTimetableMapFromMasterCourses(masterCourses);
    const result: Record<string, Course[]> = {};

    for (const [key, list] of Object.entries(map)) {
      result[key] = list.map((c) => mapMasterCourseToCourse(c, myCisCourses));
    }

    // In "all" mode, also ensure any personal courses enrolled from CIS are in the grid with star
    if (myCisCourses.length > 0) {
      const cisMap = buildTimetableFromCisCourses(myCisCourses);
      for (const [key, cisList] of Object.entries(cisMap)) {
        if (!result[key]) {
          result[key] = [];
        }
        for (const cc of cisList) {
          if (!result[key].some((x) => x.name.trim() === cc.name.trim())) {
            result[key].push(cc);
          }
        }
      }
    }

    return result;
  }, [masterCourses, myCisCourses, viewScope]);

  const enrolledCount = useMemo(() => {
    return myCisCourses.length;
  }, [myCisCourses]);

  const dayIndex = Number(selectedDay);
  const { current: currentPeriodIndex, next: nextPeriodIndex } = useMemo(
    () => getTimeIndicators(timetableData, dayIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timetableData, dayIndex, currentTimestamp],
  );
  const isToday = useMemo(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 && Number(selectedDay) === d - 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, currentTimestamp]);

  const todayDayIndex = useMemo(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d - 1 : -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTimestamp]);

  const handleToggleViewScope = useCallback(() => {
    setViewScope((v) => (v === "mine" ? "all" : "mine"));
  }, []);

  const handleCisLoginSuccess = useCallback(() => {
    setApiError(null);
    setCisAuthenticated(true);
    setViewScope("mine");
  }, []);

  const handleOpenCisModal = useCallback(() => {
    setShowCisLogin(true);
  }, []);

  const handleLogout = useCallback(() => {
    cisLogout();
    setCisAuthenticated(false);
    setMyCisCourses([]);
    setViewScope("all");
    setApiError(null);
  }, []);

  return (
    <IonPage>
      <TimetableHeader
        cisAuthenticated={cisAuthenticated}
        viewScope={viewScope}
        enrolledCount={enrolledCount}
        onToggleViewScope={handleToggleViewScope}
        onOpenCisModal={handleOpenCisModal}
        onLogout={handleLogout}
      />
      <IonContent className="ion-padding timetable-content">
        <div style={{ maxWidth: 1380, width: "100%", margin: "0 auto" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <IonSpinner name="crescent" />
              <p style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
                載入課表資料中…
              </p>
            </div>
          )}
          {apiError && (
            <div
              style={{
                padding: "8px 12px",
                marginBottom: 8,
                borderRadius: "var(--ncu-radius-sm)",
                background: "var(--ncu-danger-light)",
                fontSize: 12,
                color: "var(--ncu-danger)",
              }}
            >
              ⚠ {apiError}
            </div>
          )}
          <TimetableMobileView
            timetableData={timetableData}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            currentPeriodIndex={currentPeriodIndex}
            nextPeriodIndex={nextPeriodIndex}
            isToday={isToday}
          />
          <TimetableDesktopView
            timetableData={timetableData}
            todayDayIndex={todayDayIndex}
          />
        </div>
      </IonContent>
      <CisLoginModal
        isOpen={showCisLogin}
        onDismiss={() => setShowCisLogin(false)}
        onSuccess={handleCisLoginSuccess}
      />
    </IonPage>
  );
};

export default TimetablePage;
