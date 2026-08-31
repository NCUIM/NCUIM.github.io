import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import { isCisLoggedIn, cisLogout } from "../services/cis-login";
import { fetchCisSelectedCourses, type CisCourse } from "../services/cis-course-api";
import {
  fetchImMasterCourses,
  buildTimetableMapFromMasterCourses,
  getRequiredTag,
  cleanCourseTitle,
  getCourseRoom,
  type MasterCourseItem,
} from "../services/all-courses-api";
import { star, swapHorizontalOutline, linkOutline } from "ionicons/icons";
import CisLoginModal from "../components/CisLoginModal";
import { TRACK_CONFIGS, type TrackType } from "../data/im-curriculum";
import { matchCisToCurriculum } from "./CreditPage";

const STORAGE_KEY_CIS_COURSES = "ncu_my_cis_courses";

// ── Types ─────────────────────────────────────────────────────

export interface Course {
  readonly id?: string;
  readonly classNo?: string;
  readonly name: string;
  readonly teacher: string;
  readonly room?: string;
  readonly courseType?: "REQUIRED" | "ELECTIVE";
  readonly requiredTag?: "碩一必修" | "碩二必修" | "必修" | null;
  readonly credit?: number;
  readonly isMyCourse?: boolean;
}

export interface Period {
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
const TITLE_FONT_SIZES = [18, 18, 16, 14.5];
const TEACHER_FONT_SIZES = [14.5, 14.5, 13.5, 12.5];

const handleCatchNoop = (err: unknown): void => {
  if (err) {
    // Handled in component state
  }
};

// ── Helpers ───────────────────────────────────────────────────

const getDefaultDayIndex = (): number => {
  const dayNum = new Date().getDay();
  return dayNum >= 1 && dayNum <= 5 ? dayNum - 1 : 0;
};

const getPeriodTimeBounds = (timeStr: string): { start: number; end: number } => {
  const [startStr, endStr] = timeStr.split("-");
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  return { start: sh * 60 + sm, end: eh * 60 + em };
};

const checkPeriodCurrent = (
  mins: number,
  bounds: { start: number; end: number },
  hasCourse: boolean,
): boolean => hasCourse && mins >= bounds.start && mins < bounds.end;

const checkPeriodNext = (
  mins: number,
  bounds: { start: number; end: number },
  hasCourse: boolean,
  next: number,
): boolean => hasCourse && next === -1 && mins < bounds.start;

// skipcq: JS-R1005
const getTimeIndicators = (
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): { current: number; next: number } => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  let current = -1;
  let next = -1;
  for (let i = 0; i < periods.length; i++) {
    const bounds = getPeriodTimeBounds(periods[i].time);
    const courses = timetableData[`${periods[i].id}-${dayIndex}`];
    const hasCourse = Boolean(courses && courses.length > 0);
    if (checkPeriodCurrent(mins, bounds, hasCourse)) {
      current = i;
    } else if (checkPeriodNext(mins, bounds, hasCourse, next)) {
      next = i;
    }
  }
  return { current, next };
};

const isTeacherMatch = (teachers: readonly string[] = [], target?: string): boolean => {
  if (!target) return false;
  const tTrim = target.trim();
  if (tTrim.length === 0) return false;
  return teachers.some((t) => {
    if (!t) return false;
    const item = t.trim();
    return item.length > 0 && (tTrim.includes(item) || item.includes(tTrim));
  });
};

const isSerialMatch = (masterSerial: number, cisSerial?: string): boolean =>
  Boolean(cisSerial && String(masterSerial) === String(cisSerial).trim());

const isClassNoMatch = (masterNo: string, cisNo?: string): boolean => {
  if (!cisNo || !masterNo) return false;
  const cClean = cisNo.replace(/[-*]/g, "").trim().toUpperCase();
  const mClean = masterNo.replace(/[-*]/g, "").trim().toUpperCase();
  return cClean.length >= 4 && (cClean === mClean || cClean.startsWith(mClean) || mClean.startsWith(cClean));
};

// skipcq: JS-R1005
const isCourseMatch = (master: MasterCourseItem, cis: Partial<CisCourse>): boolean => {
  if (isSerialMatch(master.serialNo, cis.serialNo)) return true;
  if (isClassNoMatch(master.classNo, cis.classNo)) return true;
  const cisTitle = cleanCourseTitle(cis.name || "");
  const masterTitle = cleanCourseTitle(master.title || "");
  const isSameTitle = cisTitle.length > 0 && cisTitle === masterTitle;
  if (isSameTitle) {
    if (!cis.teacher) return true;
    return isTeacherMatch(master.teachers, cis.teacher);
  }
  return false;
};

const matchCisCourse = (
  master: MasterCourseItem,
  myCourses: readonly CisCourse[],
): { isMine: boolean; room?: string } => {
  const matched = myCourses.find((courseItem) => isCourseMatch(master, courseItem));
  return {
    isMine: Boolean(matched),
    room: matched?.room || master.room,
  };
};

const mapMasterCourseToCourse = (
  c: MasterCourseItem,
  myCourses: readonly CisCourse[],
): Course => {
  const { isMine, room } = matchCisCourse(c, myCourses);
  const reqTag = c.requiredTag ?? getRequiredTag(c.classNo, c.title);
  return {
    id: String(c.serialNo),
    classNo: c.classNo,
    name: c.title,
    teacher: c.teachers.join(" / "),
    room: room || c.room,
    courseType: (reqTag || c.courseType === "REQUIRED") ? "REQUIRED" : "ELECTIVE",
    requiredTag: reqTag,
    credit: c.credit,
    isMyCourse: isMine,
  };
};

const areSameCourse = (a: Course, b: Course): boolean =>
  (Boolean(a.id) && Boolean(b.id) && a.id === b.id) ||
  a.name.trim() === b.name.trim();

const parseHyphenTime = (ct: string): { dayIdx: number; periodChars: string } | null => {
  if (!ct.includes("-")) return null;
  const parts = ct.split("-");
  const dNum = Number.parseInt(parts[0], 10);
  const dayIdx = dNum >= 1 && dNum <= 5 ? dNum - 1 : -1;
  return { dayIdx, periodChars: parts[1] || "" };
};

const parseDigitTime = (ct: string): { dayIdx: number; periodChars: string } | null => {
  const first = ct[0];
  if (ct.length >= 2 && first >= "1" && first <= "5") {
    return { dayIdx: Number.parseInt(first, 10) - 1, periodChars: ct.slice(1) };
  }
  return null;
};

const parseNamedDayTime = (
  ct: string,
  dayMap: Record<string, number>,
): { dayIdx: number; periodChars: string } => {
  const match = /^(Mon|Tue|Wed|Thu|Fri|[一二三四五])/u.exec(ct);
  if (match) {
    return { dayIdx: dayMap[match[1]] ?? -1, periodChars: ct.slice(match[0].length) };
  }
  return { dayIdx: -1, periodChars: "" };
};

// skipcq: JS-R1005
const parseClassTimeDayAndPeriods = (
  ct: string,
  dayMap: Record<string, number>,
): { dayIdx: number; periodChars: string } =>
  parseHyphenTime(ct) || parseDigitTime(ct) || parseNamedDayTime(ct, dayMap);

const addCisCourseToMap = (
  result: Record<string, Course[]>,
  c: Course,
  dayIdx: number,
  periodChars: string,
): void => {
  for (const ch of periodChars) {
    const periodItem = periods.find((p) => p.id === ch);
    if (!periodItem) continue;
    const key = `${periodItem.id}-${dayIdx}`;
    if (!result[key]) {
      result[key] = [];
    }
    const existing = result[key].find((x) => x.name.trim() === c.name.trim());
    if (existing) {
      let combinedTeacher: string;
      let combinedRoom: string | undefined;

      if (existing.room && c.room && existing.room !== c.room) {
        const t1 = existing.teacher;
        const t2 = c.teacher;
        const label1 = t1.includes("(") ? t1 : `${t1} (${existing.room})`;
        const label2 = t2.includes("(") ? t2 : `${t2} (${c.room})`;
        combinedTeacher = `${label1} / ${label2}`;
        combinedRoom = undefined;
      } else {
        const currentTeachers = existing.teacher.split(/[/,、]\s*/).map((t) => t.trim()).filter(Boolean);
        const newTeachers = c.teacher.split(/[/,、]\s*/).map((t) => t.trim()).filter(Boolean);
        combinedTeacher = Array.from(new Set([...currentTeachers, ...newTeachers])).join(" / ");
        combinedRoom = existing.room || c.room;
      }

      const idx = result[key].indexOf(existing);
      result[key][idx] = {
        ...existing,
        teacher: combinedTeacher,
        room: combinedRoom,
        isMyCourse: existing.isMyCourse || c.isMyCourse,
      };
    } else {
      result[key].push(c);
    }
  }
};

const buildTimetableFromCisCourses = (
  courses: readonly CisCourse[],
  masterCourses: readonly MasterCourseItem[] = [],
): Record<string, Course[]> => {
  const DAY_MAP: Record<string, number> = {
    "一": 0, "二": 1, "三": 2, "四": 3, "五": 4,
    "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4,
  };
  const result: Record<string, Course[]> = {};

  for (const c of courses) {
    const matchedMaster = masterCourses.find((m) => isCourseMatch(m, c));
    const effectiveTimes: readonly string[] = (c.classTimes && c.classTimes.length > 0)
      ? c.classTimes
      : (matchedMaster?.classTimes || []);

    const effectiveRoom = c.room || matchedMaster?.room || getCourseRoom(c.classNo || matchedMaster?.classNo);
    const effectiveTeacher = c.teacher || matchedMaster?.teachers.join(" / ") || "";
    const reqTag = matchedMaster?.requiredTag ?? getRequiredTag(c.classNo, c.name);

    const enrichedCourse: Course = {
      id: c.serialNo || (matchedMaster ? String(matchedMaster.serialNo) : undefined),
      classNo: c.classNo || matchedMaster?.classNo,
      name: cleanCourseTitle(c.name || matchedMaster?.title || ""),
      teacher: effectiveTeacher,
      room: effectiveRoom,
      courseType: (reqTag || matchedMaster?.courseType === "REQUIRED") ? "REQUIRED" : "ELECTIVE",
      requiredTag: reqTag,
      credit: c.credit ?? matchedMaster?.credit,
      isMyCourse: true,
    };

    for (const ct of effectiveTimes) {
      const { dayIdx, periodChars } = parseClassTimeDayAndPeriods(ct, DAY_MAP);
      if (dayIdx >= 0) {
        addCisCourseToMap(result, enrichedCourse, dayIdx, periodChars);
      }
    }
  }

  return result;
};

const findSpanEndIndex = (
  start: number,
  courseItem: Course,
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): number => {
  let end = start;
  while (end + 1 < periods.length) {
    const nextP = periods[end + 1];
    const nextCourses = timetableData[`${nextP.id}-${dayIndex}`] || [];
    const isMatch = nextCourses.some((nc) => areSameCourse(nc, courseItem));
    if (isMatch) {
      end++;
    } else {
      break;
    }
  }
  return end;
};

const extractSpansForPeriod = (
  periodItem: Period,
  dayIndex: number,
  periodIdx: number,
  timetableData: Record<string, Course[]>,
  processed: Set<string>,
): { course: Course; startIdx: number; endIdx: number }[] => {
  const courses = timetableData[`${periodItem.id}-${dayIndex}`] || [];
  const periodSpans: { course: Course; startIdx: number; endIdx: number }[] = [];
  for (const courseItem of courses) {
    const key = `${courseItem.id || courseItem.name}-${courseItem.teacher}`;
    if (!processed.has(key)) {
      const end = findSpanEndIndex(periodIdx, courseItem, timetableData, dayIndex);
      processed.add(key);
      periodSpans.push({ course: courseItem, startIdx: periodIdx, endIdx: end });
    }
  }
  return periodSpans;
};

// skipcq: JS-R1005
const collectDayCourseSpans = (
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): { course: Course; startIdx: number; endIdx: number }[] => {
  const spans: { course: Course; startIdx: number; endIdx: number }[] = [];
  const processed = new Set<string>();
  for (let i = 0; i < periods.length; i++) {
    const found = extractSpansForPeriod(periods[i], dayIndex, i, timetableData, processed);
    spans.push(...found);
  }
  return spans;
};

// skipcq: JS-R1005
const getDayFixedTracks = (
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): {
  maxTracks: number;
  rows: { period: Period; tracks: (Course | null)[]; idx: number }[];
} => {
  const rawSpans = collectDayCourseSpans(timetableData, dayIndex);
  const spans: DayCourseSpan[] = rawSpans.map((s) => ({ ...s, trackIndex: 0 }));

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
    let trackNum = 0;
    while (usedTracks.has(trackNum)) {
      trackNum++;
    }
    spans[i].trackIndex = trackNum;
  }

  const maxTracks = Math.max(1, ...spans.map((s) => s.trackIndex + 1));
  const rows = periods.map((period, idx) => {
    const activeSpans = spans.filter((s) => s.startIdx <= idx && idx <= s.endIdx);
    const tracks: (Course | null)[] = new Array(maxTracks).fill(null);
    for (const s of activeSpans) {
      tracks[s.trackIndex] = s.course;
    }
    return { period, tracks, idx };
  });

  return { maxTracks, rows };
};

const getOverlappingClusterTracks = (
  cIdx: number,
  clusterIndices: number[],
  spans: { course: Course; startIdx: number; endIdx: number }[],
  assignedTracks: Record<number, number>,
): Set<number> => {
  const used = new Set<number>();
  for (const otherIdx of clusterIndices) {
    if (otherIdx !== cIdx && assignedTracks[otherIdx] !== undefined) {
      const overlaps =
        Math.max(spans[cIdx].startIdx, spans[otherIdx].startIdx) <=
        Math.min(spans[cIdx].endIdx, spans[otherIdx].endIdx);
      if (overlaps) {
        used.add(assignedTracks[otherIdx]);
      }
    }
  }
  return used;
};

// skipcq: JS-R1005
const assignClusterTracks = (
  clusterIndices: number[],
  spans: { course: Course; startIdx: number; endIdx: number }[],
): Record<number, number> => {
  const assignedTracks: Record<number, number> = {};
  for (const cIdx of clusterIndices) {
    const used = getOverlappingClusterTracks(cIdx, clusterIndices, spans, assignedTracks);
    let trackNum = 0;
    while (used.has(trackNum)) trackNum++;
    assignedTracks[cIdx] = trackNum;
  }
  return assignedTracks;
};

const expandCluster = (
  initialIdx: number,
  spans: { course: Course; startIdx: number; endIdx: number }[],
  visited: Set<number>,
): number[] => {
  const clusterIndices = [initialIdx];
  visited.add(initialIdx);
  let changed = true;
  while (changed) {
    changed = false;
    for (let j = 0; j < spans.length; j++) {
      if (!visited.has(j)) {
        const overlaps = clusterIndices.some(
          (cIdx) =>
            Math.max(spans[cIdx].startIdx, spans[j].startIdx) <=
            Math.min(spans[cIdx].endIdx, spans[j].endIdx),
        );
        if (overlaps) {
          clusterIndices.push(j);
          visited.add(j);
          changed = true;
        }
      }
    }
  }
  return clusterIndices;
};

// skipcq: JS-R1005
const getDesktopCourseSpans = (
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): DesktopCourseSpan[] => {
  const spans = collectDayCourseSpans(timetableData, dayIndex);
  const result: DesktopCourseSpan[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < spans.length; i++) {
    if (visited.has(i)) continue;

    const clusterIndices = expandCluster(i, spans, visited);
    clusterIndices.sort((a, b) => spans[a].startIdx - spans[b].startIdx);
    const assignedTracks = assignClusterTracks(clusterIndices, spans);
    const clusterTotalCols = Math.max(
      1,
      ...clusterIndices.map((cIdx) => (assignedTracks[cIdx] ?? 0) + 1),
    );

    for (const cIdx of clusterIndices) {
      result.push({
        course: spans[cIdx].course,
        startIdx: spans[cIdx].startIdx,
        endIdx: spans[cIdx].endIdx,
        colIndex: assignedTracks[cIdx],
        totalCols: clusterTotalCols,
      });
    }
  }

  return result;
};

// ── Mobile View Components ─────────────────────────────────────

const parseTeacherAndRoom = (
  rawTeacherItem: string,
  fallbackRoom?: string,
): { name: string; room?: string } => {
  const match = /^(.*?)\s*\((.*?)\)$/.exec(rawTeacherItem.trim());
  if (match) {
    return { name: match[1].trim(), room: match[2].trim() };
  }
  return { name: rawTeacherItem.trim(), room: fallbackRoom };
};

// skipcq: JS-R1005
const MobileTrackCard = ({
  course,
  maxTracks,
}: Readonly<{
  course: Course;
  maxTracks: number;
}>) => {
  const isRequired = course.courseType === "REQUIRED";
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
        {course.requiredTag ? (
          <span style={{ fontSize: 11, color: "var(--ncu-primary)", marginLeft: 4, fontWeight: 700 }}>
            [{course.requiredTag}]
          </span>
        ) : isRequired && (
          <span style={{ fontSize: 11, color: "var(--ncu-primary)", marginLeft: 4, fontWeight: 700 }}>
            [必修]
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
        {course.teacher}{roomText}
      </p>
    </div>
  );
};

// skipcq: JS-R1005
const PeriodTimeBadge = ({
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
        minWidth: "48px",
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
const MobileRowItem = ({
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

// ── Desktop View Components ────────────────────────────────────

// skipcq: JS-R1005
const DesktopRulerItem = ({
  period,
  rowHeight,
  isLast,
}: Readonly<{
  period: Period;
  rowHeight: number;
  isLast: boolean;
}>) => {
  const isSlim = rowHeight === DESKTOP_EMPTY_ROW_HEIGHT;
  const title = period.id === "N" ? "午休" : `第 ${period.id} 節`;
  const bg = period.id === "N" ? "rgba(0, 0, 0, 0.03)" : "var(--ncu-primary-light)";
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

const DesktopRulerColumn = ({
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
const DesktopCourseCard = ({
  span,
  periodTops,
}: Readonly<{
  span: DesktopCourseSpan;
  periodTops: readonly number[];
}>) => {
  const isMine = Boolean(span.course.isMyCourse);
  const isRequired = span.course.courseType === "REQUIRED";
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
        {span.course.requiredTag ? (
          <span style={{ fontSize: 11, color: "var(--ncu-primary)", fontWeight: 700 }}>
            [{span.course.requiredTag}]
          </span>
        ) : isRequired && (
          <span style={{ fontSize: 11, color: "var(--ncu-primary)", fontWeight: 700 }}>
            [必修]
          </span>
        )}
      </div>
      {span.course.teacher.includes(" / ") ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
          {span.course.teacher.split(" / ").map((t) => {
            const { name, room } = parseTeacherAndRoom(t);
            return (
              <div key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                <span style={{ fontSize: teacherFontSize, color: "var(--ncu-muted)", lineHeight: 1.25, fontWeight: 500 }}>
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
          <span style={{ fontSize: teacherFontSize, color: "var(--ncu-muted)", lineHeight: 1.25, fontWeight: 500 }}>
            {parseTeacherAndRoom(span.course.teacher).name}
          </span>
          {(span.course.room || parseTeacherAndRoom(span.course.teacher).room) && (
            <span
              style={{
                fontSize: span.totalCols <= 2 ? 12 : 11,
                color: "var(--ncu-primary)",
                fontWeight: 700,
                background: "rgba(49, 87, 200, 0.08)",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {span.course.room || parseTeacherAndRoom(span.course.teacher).room}
            </span>
          )}
        </>
      )}
    </div>
  );
};

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

const mergeCisCoursesIntoResult = (
  result: Record<string, Course[]>,
  myCisCourses: CisCourse[],
  masterCourses: readonly MasterCourseItem[] = [],
): void => {
  const cisMap = buildTimetableFromCisCourses(myCisCourses, masterCourses);
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
};

// skipcq: JS-R1005
const computeMergedTimetableData = (
  masterCourses: MasterCourseItem[],
  myCisCourses: CisCourse[],
  viewScope: "all" | "mine",
): Record<string, Course[]> => {
  if (viewScope === "mine" && myCisCourses.length > 0) {
    return buildTimetableFromCisCourses(myCisCourses, masterCourses);
  }

  const map = buildTimetableMapFromMasterCourses(masterCourses);
  const result: Record<string, Course[]> = {};
  for (const [key, list] of Object.entries(map)) {
    result[key] = list.map((c) => mapMasterCourseToCourse(c, myCisCourses));
  }

  if (myCisCourses.length > 0) {
    mergeCisCoursesIntoResult(result, myCisCourses, masterCourses);
  }

  return result;
};

const TimetablePage = () => {
  const [presentToast] = useIonToast();
  const defaultDay = getDefaultDayIndex();
  const [selectedDay, setSelectedDay] = useState(String(defaultDay));
  const [viewScope, setViewScope] = useState<"all" | "mine">(() =>
    isCisLoggedIn() ? "mine" : "all",
  );

  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const prevDayRef = useRef(getDefaultDayIndex());
  useEffect(() => {
    const newDay = getDefaultDayIndex();
    if (newDay !== prevDayRef.current) {
      prevDayRef.current = newDay;
      setSelectedDay(String(newDay));
    }
  }, [currentTimestamp]);

  const [masterCourses, setMasterCourses] = useState<MasterCourseItem[]>([]);
  const [myCisCourses, setMyCisCourses] = useState<CisCourse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CIS_COURSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cisAuthenticated, setCisAuthenticated] = useState(
    () => isCisLoggedIn() || Boolean(localStorage.getItem(STORAGE_KEY_CIS_COURSES)),
  );
  const [showCisLogin, setShowCisLogin] = useState(false);

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      if (!hash?.includes("cis_data=")) return;
      try {
        const rawParam = hash.replace(/^#.*?cis_data=/, "");
        const decoded = decodeURIComponent(rawParam);
        const parsed = JSON.parse(decoded);
        const currentCourses: CisCourse[] = Array.isArray(parsed)
          ? parsed
          : (parsed?.current || []);
        const historyCourses: CisCourse[] = Array.isArray(parsed)
          ? parsed
          : (parsed?.history || parsed?.current || []);

        if (currentCourses.length > 0) {
          setMyCisCourses(currentCourses);
          localStorage.setItem(STORAGE_KEY_CIS_COURSES, JSON.stringify(currentCourses));
          setCisAuthenticated(true);
          setViewScope("mine");
        }

        if (historyCourses.length > 0) {
          const track = (localStorage.getItem("ncu_credit_track") as TrackType) || "mgmt";
          const config = TRACK_CONFIGS[track] || TRACK_CONFIGS.mgmt;
          const matchedIds = matchCisToCurriculum(historyCourses, config, track);
          let prevSelected: string[] = [];
          try {
            const saved = localStorage.getItem("ncu_selected_credit_courses");
            if (saved) prevSelected = JSON.parse(saved);
          } catch {
            // ignore
          }
          const merged = Array.from(new Set([...prevSelected, ...matchedIds]));
          localStorage.setItem("ncu_selected_credit_courses", JSON.stringify(merged));
        }

        presentToast({
          message: `🎉 成功同步！已匯入 ${currentCourses.length} 門本學期課表與 ${historyCourses.length} 門歷年學分紀錄！`,
          duration: 4000,
          color: "success",
          position: "top",
        });
      } catch {
        presentToast({
          message: "課務資料解析失敗，請重新嘗試同步",
          duration: 3000,
          color: "danger",
          position: "top",
        });
      } finally {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    handleHashSync();
    window.addEventListener("hashchange", handleHashSync);
    return () => window.removeEventListener("hashchange", handleHashSync);
  }, [presentToast]);

  const syncDefaultCourses = useCallback(async () => {
    setLoading(true);
    try {
      const courses = await fetchImMasterCourses();
      if (courses.length > 0) {
        setMasterCourses(courses);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "載入碩士班課程資料失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncDefaultCourses().catch(handleCatchNoop);
  }, [syncDefaultCourses]);

  const syncCisCourses = useCallback(async () => {
    if (localStorage.getItem(STORAGE_KEY_CIS_COURSES)) {
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const courses = await fetchCisSelectedCourses();
      if (courses.length > 0) {
        setMyCisCourses(courses);
      } else {
        cisLogout();
        setCisAuthenticated(false);
        setApiError("CIS Session 已過期，請重新連結");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "CIS 載入失敗";
      setApiError(msg);
      cisLogout();
      setCisAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cisAuthenticated) return;
    syncCisCourses().catch(handleCatchNoop);
  }, [cisAuthenticated, syncCisCourses]);

  const timetableData = useMemo(
    () => computeMergedTimetableData(masterCourses, myCisCourses, viewScope),
    [masterCourses, myCisCourses, viewScope],
  );

  const enrolledCount = useMemo(() => myCisCourses.length, [myCisCourses]);
  const dayIndex = Number(selectedDay);
  const { current: currentPeriodIndex, next: nextPeriodIndex } = useMemo(
    () => getTimeIndicators(timetableData, dayIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timetableData, dayIndex, currentTimestamp],
  );
  const isToday = useMemo(() => {
    const dayNum = new Date().getDay();
    return dayNum >= 1 && dayNum <= 5 && Number(selectedDay) === dayNum - 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, currentTimestamp]);

  const todayDayIndex = useMemo(() => {
    const dayNum = new Date().getDay();
    return dayNum >= 1 && dayNum <= 5 ? dayNum - 1 : -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTimestamp]);

  const handleToggleViewScope = useCallback(() => {
    setViewScope((v) => (v === "mine" ? "all" : "mine"));
  }, []);

  const handleOpenCisModal = useCallback(() => {
    setShowCisLogin(true);
  }, []);

  const handleLogout = useCallback(() => {
    cisLogout();
    localStorage.removeItem(STORAGE_KEY_CIS_COURSES);
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
      />
    </IonPage>
  );
};

export default TimetablePage;
