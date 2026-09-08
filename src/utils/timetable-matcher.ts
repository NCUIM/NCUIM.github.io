import {
  cleanCourseTitle,
  getCourseRoom,
  getRequiredTag,
  buildTimetableMapFromMasterCourses,
  type MasterCourseItem,
} from "../services/all-courses-api";
import type { CisCourse } from "../services/cis-course-api";
import {
  periods,
  type Course,
  type Period,
  type DayCourseSpan,
  type DesktopCourseSpan,
} from "../types/timetable";

export const getDefaultDayIndex = (): number => {
  const dayNum = new Date().getDay();
  return dayNum >= 1 && dayNum <= 5 ? dayNum - 1 : 0;
};

export const getPeriodTimeBounds = (timeStr: string): { start: number; end: number } => {
  const [startStr, endStr] = timeStr.split(/[-~]/).map((s) => s.trim());
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
export const getTimeIndicators = (
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

export const extractCourseCodeAndSection = (
  rawNo?: string,
): { base: string; section: string } => {
  if (!rawNo) return { base: "", section: "" };
  const clean = rawNo.replace(/[-*]/g, "").trim().toUpperCase();
  const baseMatch = /^[A-Z]+\d+/.exec(clean);
  if (baseMatch) {
    const base = baseMatch[0];
    const section = clean.slice(base.length);
    return { base, section };
  }
  return { base: clean, section: "" };
};

export const isSerialMatch = (masterSerial: number, cisSerial?: string): boolean =>
  Boolean(cisSerial && String(masterSerial) === String(cisSerial).trim());

export const isClassNoMatch = (masterNo: string, cisNo?: string): boolean => {
  if (!cisNo || !masterNo) return false;
  const m = extractCourseCodeAndSection(masterNo);
  const c = extractCourseCodeAndSection(cisNo);
  if (!m.base || !c.base || m.base !== c.base) return false;
  if (m.section && c.section && m.section !== c.section) {
    return false;
  }
  return true;
};

const checkClassNoMatch = (
  masterClassNo: string,
  cisClassNo: string,
  masterTeachers: readonly string[],
  cisTeacher?: string,
): boolean | null => {
  const m = extractCourseCodeAndSection(masterClassNo);
  const c = extractCourseCodeAndSection(cisClassNo);
  if (!m.base || !c.base || m.base !== c.base) {
    return null;
  }
  if (m.section && c.section && m.section !== c.section) {
    return false;
  }
  if (cisTeacher) {
    return isTeacherMatch(masterTeachers, cisTeacher);
  }
  return true;
};

const isTitleCourseMatch = (
  masterTitle: string,
  cisName: string | undefined,
  masterTeachers: readonly string[],
  cisTeacher?: string,
): boolean => {
  const cisTitle = cleanCourseTitle(cisName || "");
  const mTitle = cleanCourseTitle(masterTitle || "");
  if (!cisTitle || cisTitle !== mTitle) return false;
  return !cisTeacher || isTeacherMatch(masterTeachers, cisTeacher);
};

// skipcq: JS-R1005
export const isSingleMasterCourseMatch = (
  master: MasterCourseItem,
  cis: Partial<CisCourse>,
): boolean => {
  const cisSerial = cis.serialNo?.trim();
  if (cisSerial && /^\d+$/.test(cisSerial)) {
    return isSerialMatch(master.serialNo, cisSerial);
  }

  if (cis.classNo && master.classNo) {
    const classMatch = checkClassNoMatch(
      master.classNo,
      cis.classNo,
      master.teachers,
      cis.teacher,
    );
    if (classMatch !== null) {
      return classMatch;
    }
  }

  return isTitleCourseMatch(master.title, cis.name, master.teachers, cis.teacher);
};

// skipcq: JS-R1005
export const isCourseMatch = (master: MasterCourseItem, cis: Partial<CisCourse>): boolean => {
  if (master.mergedSections && master.mergedSections.length > 0) {
    return master.mergedSections.some((sec) =>
      isSingleMasterCourseMatch(
        {
          ...master,
          serialNo: sec.serialNo,
          classNo: sec.classNo,
          teachers: sec.teachers,
          room: sec.room,
        },
        cis,
      ),
    );
  }
  return isSingleMasterCourseMatch(master, cis);
};

export const matchCisCourse = (
  master: MasterCourseItem,
  myCourses: readonly CisCourse[],
): { isMine: boolean; room?: string; matchedTeacher?: string; matchedRoom?: string } => {
  if (master.mergedSections && master.mergedSections.length > 0) {
    for (const sec of master.mergedSections) {
      const secMaster: MasterCourseItem = {
        ...master,
        serialNo: sec.serialNo,
        classNo: sec.classNo,
        teachers: sec.teachers,
        room: sec.room,
      };
      const matched = myCourses.find((courseItem) =>
        isSingleMasterCourseMatch(secMaster, courseItem),
      );
      if (matched) {
        const secRoom = sec.room || master.room;
        const secTeacher = sec.teachers[0] || matched.teacher;
        return {
          isMine: true,
          room: secRoom,
          matchedTeacher: secTeacher,
          matchedRoom: secRoom || (matched.classNo ? getCourseRoom(matched.classNo) : undefined),
        };
      }
    }
  }

  const matched = myCourses.find((courseItem) => isSingleMasterCourseMatch(master, courseItem));
  return {
    isMine: Boolean(matched),
    room: matched?.room || master.room,
    matchedTeacher: matched?.teacher || (matched ? master.teachers[0] : undefined),
    matchedRoom: matched?.room || (matched?.classNo ? getCourseRoom(matched.classNo) : master.room),
  };
};

export const mapMasterCourseToCourse = (
  c: MasterCourseItem,
  myCourses: readonly CisCourse[],
): Course => {
  const { isMine, room, matchedTeacher, matchedRoom } = matchCisCourse(c, myCourses);
  const reqTag = c.requiredTag ?? getRequiredTag(c.classNo);
  return {
    id: String(c.serialNo),
    classNo: c.classNo,
    name: c.title,
    teacher: c.teachers.join(" / "),
    room: room || c.room,
    myEnrolledTeacher: matchedTeacher,
    myEnrolledRoom: matchedRoom,
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

const mergeTeacherWithRoom = (
  existing: Course,
  incoming: Course,
): { teacher: string; room: string | undefined } => {
  if (existing.room && incoming.room && existing.room !== incoming.room) {
    const label1 = existing.teacher.includes("(") ? existing.teacher : `${existing.teacher} (${existing.room})`;
    const label2 = incoming.teacher.includes("(") ? incoming.teacher : `${incoming.teacher} (${incoming.room})`;
    return { teacher: `${label1} / ${label2}`, room: undefined };
  }
  const split = (t: string) => t.split(/[/,、]\s*/).map((s) => s.trim()).filter(Boolean);
  const merged = Array.from(new Set([...split(existing.teacher), ...split(incoming.teacher)]));
  return { teacher: merged.join(" / "), room: existing.room || incoming.room };
};

const addCisCourseToMap = (
  result: Record<string, Course[]>,
  c: Course,
  dayIdx: number,
  periodChars: string,
): void => {
  for (const rawCh of periodChars) {
    const ch = rawCh === "N" ? "Z" : rawCh;
    const periodItem = periods.find((p) => p.id === ch);
    if (!periodItem) continue;
    const key = `${periodItem.id}-${dayIdx}`;
    if (!result[key]) result[key] = [];
    const existing = result[key].find((x) => x.name.trim() === c.name.trim());
    if (!existing) {
      result[key].push(c);
      continue;
    }
    const merged = mergeTeacherWithRoom(existing, c);
    const idx = result[key].indexOf(existing);
    result[key][idx] = { ...existing, ...merged, isMyCourse: existing.isMyCourse || c.isMyCourse };
  }
};

const enrichCisCourse = (
  c: CisCourse,
  masterCourses: readonly MasterCourseItem[],
): { enrichedCourse: Course; effectiveTimes: readonly string[] } => {
  const matchedMaster = masterCourses.find((m) => isCourseMatch(m, c));
  const effectiveTimes = (c.classTimes && c.classTimes.length > 0)
    ? c.classTimes
    : (matchedMaster?.classTimes || []);

  const effectiveRoom =
    c.room ||
    matchedMaster?.room ||
    getCourseRoom(matchedMaster?.classNo || c.classNo);
  const effectiveTeacher =
    c.teacher ||
    matchedMaster?.teachers.join(" / ") ||
    "";
  const effectiveClassNo =
    !c.classNo?.includes("-") && matchedMaster?.classNo
      ? matchedMaster.classNo
      : (c.classNo ?? matchedMaster?.classNo);
  const reqTag = matchedMaster?.requiredTag ?? getRequiredTag(effectiveClassNo);

  const enrichedCourse: Course = {
    id: c.serialNo || (matchedMaster ? String(matchedMaster.serialNo) : undefined),
    classNo: effectiveClassNo,
    name: cleanCourseTitle(c.name || matchedMaster?.title || ""),
    teacher: effectiveTeacher,
    room: effectiveRoom,
    courseType: (reqTag || matchedMaster?.courseType === "REQUIRED") ? "REQUIRED" : "ELECTIVE",
    requiredTag: reqTag,
    credit: c.credit ?? matchedMaster?.credit,
    isMyCourse: true,
  };

  return { enrichedCourse, effectiveTimes };
};

export const buildTimetableFromCisCourses = (
  courses: readonly CisCourse[],
  masterCourses: readonly MasterCourseItem[] = [],
): Record<string, Course[]> => {
  const DAY_MAP: Record<string, number> = {
    "一": 0, "二": 1, "三": 2, "四": 3, "五": 4,
    "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4,
  };
  const result: Record<string, Course[]> = {};

  for (const c of courses) {
    const { enrichedCourse, effectiveTimes } = enrichCisCourse(c, masterCourses);
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
export const collectDayCourseSpans = (
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
export const getDayFixedTracks = (
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
export const getDesktopCourseSpans = (
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

export const mergeCisCoursesIntoResult = (
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
export const computeMergedTimetableData = (
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
