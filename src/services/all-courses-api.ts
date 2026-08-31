/**
 * Service to fetch and parse all NCUIM master's courses from all.json
 */

import fallbackMasterCourses from "../data/im-master-courses.json";

export interface MasterCourseItem {
  readonly serialNo: number;
  readonly classNo: string;
  readonly title: string;
  readonly credit: number;
  readonly teachers: readonly string[];
  readonly classTimes: readonly string[];
  readonly courseType: "REQUIRED" | "ELECTIVE";
  readonly requiredTag?: "碩一必修" | "碩二必修" | "必修" | null;
  readonly passwordCard?: string;
  readonly limitCnt?: number | null;
  readonly admitCnt?: number | null;
  readonly room?: string;
  readonly isMyCourse?: boolean;
}

export const ALL_COURSES_API_URL =
  "https://ncucf-data.s3.amazonaws.com/data/dynamic/all.json";

/**
 * Excluded courses (個別指導之碩士論文，無固定排課時段)
 */
export const EXCLUDED_CLASS_NOS: readonly string[] = [
  "IM7000", // 碩士論文
];

export const EXCLUDED_MASTER_KEYWORDS: readonly string[] = [
  "論文",
];

/**
 * Known classroom mapping for NCU IM Master's courses
 */
export const IM_CLASSROOM_MAP: Record<string, string> = {
  "IM5001-*": "I1-405-1", // 社會網路分析
  "IM5007-*": "I1-405-1", // 資訊檢索
  "IM5008-*": "I1-404", // 商業智慧
  "IM5019-A": "I1-404", // 管理溝通 (黃子菱)
  "IM5019-B": "I1-405-1", // 管理溝通 (何迪亞)
  "IM5019-*": "I1-404", // 管理溝通
  "IM5022-*": "I1-405-1", // 多媒體資料庫
  "IM5025-A": "I1-405-1", // 研究方法 (劉子源)
  "IM5025-B": "I1-404", // 研究方法 (許智誠)
  "IM5025-*": "I1-405-1", // 研究方法
  "IM5032-*": "I1-405-1", // 物聯網實務應用
  "IM5038-*": "I1-404", // 進階區塊鏈應用與隱私防護
  "IM5041-*": "I1-405-1", // 現代與後量子密碼學導論
  "IM6002-*": "I1-404", // 資訊系統專案管理
  "IM6003-*": "I1-404", // 軟體工程Ⅰ
  "IM6012-*": "I1-404", // 管理資訊系統
  "IM6041-*": "I1-404", // 生產與作業管理
  "IM6053-*": "I1-404", // 多變量分析
  "IM6055-*": "I1-405-1", // 電腦網路安全
  "IM6082-*": "I1-404", // 行銷管理
  "IM6103-*": "I1-405-1", // 網路經濟與賽局智慧
  "IM7043-*": "I1-404", // 書報研討Ⅰ
  "IM7044-*": "I1-404", // 書報研討Ⅱ
  "IM7071-*": "I1-405-1", // 企業電腦網路
  "IM7082-*": "I1-404", // 智慧型資訊系統
};

export const getCourseRoom = (classNo?: string): string => {
  if (!classNo) return "I1-404";
  if (IM_CLASSROOM_MAP[classNo]) return IM_CLASSROOM_MAP[classNo];
  const prefix = classNo.split("-")[0];
  if (IM_CLASSROOM_MAP[`${prefix}-*`]) return IM_CLASSROOM_MAP[`${prefix}-*`];
  return "I1-404";
};

interface RawCourse {
  serialNo: number;
  classNo: string;
  title: string;
  credit: number;
  teachers?: string[];
  classTimes?: string[];
  courseType?: "REQUIRED" | "ELECTIVE";
  passwordCard?: string | null;
  limitCnt?: number | null;
  admitCnt?: number | null;
  departmentIds?: string[];
}

const isImCourse = (c: RawCourse): boolean =>
  (c.departmentIds?.includes("deptI1I4003I0") ?? false) ||
  (c.classNo?.startsWith("IM") ?? false);

const isExcludedMasterCourse = (c: RawCourse): boolean =>
  EXCLUDED_CLASS_NOS.some((no) => c.classNo?.startsWith(no)) ||
  EXCLUDED_MASTER_KEYWORDS.some((kw) => c.title?.includes(kw));

const isMasterLevelCourse = (c: RawCourse): boolean => {
  const match = /IM(\d{4})/.exec(c.classNo || "");
  if (!match) return false;
  const num = Number.parseInt(match[1], 10);
  return num >= 5000 && num < 8000;
};

const filterMasterCourses = (allCourses: RawCourse[]): RawCourse[] =>
  allCourses.filter(
    (c) => isImCourse(c) && !isExcludedMasterCourse(c) && isMasterLevelCourse(c),
  );

export const cleanCourseTitle = (rawTitle: string): string => {
  const match = /^([\u4e00-\u9fa5\dⅠⅡⅢⅣ·、\s\-]+?)([A-Z][a-zA-Z\s\d\-]+.*)$/.exec(rawTitle);
  if (match && /[\u4e00-\u9fa5]/.test(match[1])) {
    return match[1].trim();
  }
  return rawTitle.trim();
};

export const getRequiredTag = (classNo?: string, title?: string): "碩一必修" | "碩二必修" | "必修" | null => {
  const no = classNo || "";
  const t = title || "";

  if (
    no.startsWith("IM5019") || t.includes("管理溝通") ||
    no.startsWith("IM7043") || no.startsWith("IM7044") || t.includes("書報研討")
  ) {
    return "碩二必修";
  }

  if (
    no.startsWith("IM5025") || t.includes("研究方法") ||
    no.startsWith("IM6012") || t.includes("管理資訊系統") ||
    no.startsWith("IM6053") || t.includes("多變量分析") ||
    no.startsWith("IM6003") || t.includes("軟體工程") ||
    no.startsWith("IM6055") || t.includes("電腦網路安全")
  ) {
    return "碩一必修";
  }

  return null;
};

const getCourseType = (c: RawCourse): "REQUIRED" | "ELECTIVE" => {
  if (getRequiredTag(c.classNo, c.title)) {
    return "REQUIRED";
  }
  return c.courseType === "REQUIRED" ? "REQUIRED" : "ELECTIVE";
};

const mapRawCourse = (c: RawCourse): MasterCourseItem => {
  const reqTag = getRequiredTag(c.classNo, c.title);
  return {
    serialNo: c.serialNo,
    classNo: c.classNo,
    title: cleanCourseTitle(c.title),
    credit: c.credit,
    teachers: c.teachers || [],
    classTimes: c.classTimes || [],
    courseType: getCourseType(c),
    requiredTag: reqTag,
    passwordCard: c.passwordCard || undefined,
    limitCnt: c.limitCnt,
    admitCnt: c.admitCnt,
    room: getCourseRoom(c.classNo),
  };
};

/**
 * Fetch all NCU courses from S3 and filter for IM Master courses.
 * Excludes individual research (IM7000 碩士論文) and doctoral courses (IM8xxx).
 * Falls back to bundled static json if network fails or offline.
 */
export const fetchImMasterCourses = async (): Promise<MasterCourseItem[]> => {
  try {
    const res = await fetch(ALL_COURSES_API_URL, { cache: "default" });
    if (!res.ok) {
      return fallbackMasterCourses as MasterCourseItem[];
    }
    const data = await res.json();
    const allCourses = (data.courses || []) as RawCourse[];
    const filtered = filterMasterCourses(allCourses);

    if (filtered.length > 0) {
      return filtered.map(mapRawCourse);
    }

    return fallbackMasterCourses as MasterCourseItem[];
  } catch {
    return fallbackMasterCourses as MasterCourseItem[];
  }
};

const parseDayAndPeriod = (ct: string): { dayIdx: number; periodId: string } | null => {
  const parts = ct.split("-");
  if (parts.length !== 2) return null;
  const dayNum = Number.parseInt(parts[0], 10);
  if (dayNum < 1 || dayNum > 5) return null;
  return { dayIdx: dayNum - 1, periodId: parts[1] };
};

const addCourseTimeToMap = (
  result: Record<string, MasterCourseItem[]>,
  c: MasterCourseItem,
  ct: string,
): void => {
  const parsed = parseDayAndPeriod(ct);
  if (!parsed) return;

  const key = `${parsed.periodId}-${parsed.dayIdx}`;
  if (!result[key]) {
    result[key] = [];
  }
  const existing = result[key].find((item) => cleanCourseTitle(item.title) === cleanCourseTitle(c.title));
  if (existing) {
    let combinedTeachers: string[];
    let combinedRoom: string | undefined;

    if (existing.room && c.room && existing.room !== c.room) {
      const t1 = existing.teachers.join(", ");
      const t2 = c.teachers.join(", ");
      const label1 = t1.includes("(") ? t1 : `${t1} (${existing.room})`;
      const label2 = t2.includes("(") ? t2 : `${t2} (${c.room})`;
      combinedTeachers = Array.from(new Set([label1, label2]));
      combinedRoom = undefined;
    } else {
      combinedTeachers = Array.from(new Set([...existing.teachers, ...c.teachers]));
      combinedRoom = existing.room || c.room;
    }

    const idx = result[key].indexOf(existing);
    result[key][idx] = {
      ...existing,
      teachers: combinedTeachers,
      room: combinedRoom,
    };
    return;
  }

  result[key].push(c);
};

/**
 * Convert master courses into timetable grid map: Key is `${periodId}-${dayIndex}` (e.g. "2-4")
 * Supporting multiple courses per time slot!
 */
export const buildTimetableMapFromMasterCourses = (
  courses: MasterCourseItem[],
): Record<string, MasterCourseItem[]> => {
  const result: Record<string, MasterCourseItem[]> = {};
  for (const c of courses) {
    for (const ct of c.classTimes) {
      addCourseTimeToMap(result, c, ct);
    }
  }
  return result;
};
