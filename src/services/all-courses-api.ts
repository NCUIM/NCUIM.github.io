/**
 * Service to fetch and parse all NCUIM master's courses from all.json
 */

import fallbackMasterCourses from "../data/im-master-courses.json";
import masterSnapshot from "../data/im-master-snapshot.json";
import { getRequiredFact, requiredFactLabel, type RequiredTagLabel } from "../data/im-curriculum";

export interface MasterCourseItem {
  readonly serialNo: number;
  readonly classNo: string;
  readonly title: string;
  readonly credit: number;
  readonly teachers: readonly string[];
  readonly classTimes: readonly string[];
  readonly courseType: "REQUIRED" | "ELECTIVE";
  readonly requiredTag?: RequiredTagLabel | null;
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
 * (rooms are regenerated from CIS by scripts/reconcile-curriculum.mjs;
 *  this map is a last-resort fallback for courses absent from the snapshot).
 */
export const IM_CLASSROOM_MAP: Record<string, string> = {
  "IM5001-*": "I1-002", // 社會網路分析
  "IM5007-*": "I1-002", // 資訊檢索
  "IM5008-*": "I1-404", // 商業智慧
  "IM5019-A": "I1-002", // 管理溝通 (黃子菱)
  "IM5019-B": "I1-404", // 管理溝通 (何迪亞)
  "IM5019-*": "I1-404", // 管理溝通
  "IM5022-*": "I1-404", // 多媒體資料庫
  "IM5032-*": "I1-405-1", // 物聯網實務應用
  "IM5038-*": "I1-114", // 進階區塊鏈應用與隱私防護
  "IM5041-*": "I1-107", // 現代與後量子密碼學導論
  "IM6002-*": "I-315", // 資訊系統專案管理
  "IM6003-*": "I1-404", // 軟體工程Ⅰ
  "IM6012-*": "I1-404", // 管理資訊系統
  "IM6041-*": "I1-404", // 生產與作業管理
  "IM6053-*": "I-315", // 多變量分析
  "IM6055-*": "I1-107", // 電腦網路安全
  "IM6082-*": "I1-114", // 行銷管理
  "IM6103-*": "I1-002", // 網路經濟與賽局智慧
  "IM7071-*": "I1-404", // 企業電腦網路
  "IM7082-*": "I1-002", // 智慧型資訊系統
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

/** One per-course entry of the committed CIS snapshot (see im-master-snapshot.json). */
interface SnapshotCourseMeta {
  classNo?: string;
  title?: string;
  room?: string;
  courseType?: string;
  allowMaster?: boolean;
}

/** The committed snapshot: CIS-derived facts keyed by serialNo (see scripts/reconcile-curriculum.mjs). */
const MASTER_SNAPSHOT: Record<string, SnapshotCourseMeta> =
  (masterSnapshot as { courses?: Record<string, SnapshotCourseMeta> }).courses ?? {};

/**
 * Look up a live course in the committed snapshot by serialNo first, then by
 * exact classNo (IM5019-A), then by its generic code section (IM5019-*).
 */
const findSnapshotMeta = (c: RawCourse): SnapshotCourseMeta | undefined => {
  const bySerial = MASTER_SNAPSHOT[String(c.serialNo)];
  if (bySerial) return bySerial;
  if (MASTER_SNAPSHOT[c.classNo]) return MASTER_SNAPSHOT[c.classNo];
  const prefix = c.classNo.split("-")[0];
  return MASTER_SNAPSHOT[`${prefix}-*`];
};

/**
 * A course belongs to the IM master's list only when the committed snapshot
 * marks it allowMaster — i.e. its CIS 分發條件 admits the regular master's
 * cohort. The snapshot is the sole gate: there is no numeric-band fallback,
 * because the old 5xxx–7xxx band let doctoral courses such as IM7043 書報研討
 * leak into the master's timetable. Courses CIS opened after the last
 * reconcile stay out until the snapshot is regenerated (the weekly drift
 * check reports them; see docs/engineering/curriculum-data.md).
 */
const isMasterLevelCourse = (c: RawCourse): boolean => {
  const meta = findSnapshotMeta(c);
  if (!meta) return false;
  return meta.allowMaster === true;
};

const filterMasterCourses = (allCourses: RawCourse[]): RawCourse[] =>
  allCourses.filter(
    (c) => isImCourse(c) && !isExcludedMasterCourse(c) && isMasterLevelCourse(c),
  );

export const cleanCourseTitle = (rawTitle: string): string => {
  const match = /^([\u4e00-\u9fa5\dⅠⅡⅢⅣ·、]+[\s-]*)([A-Z][\s\S]*)$/.exec(rawTitle);
  if (match && /[\u4e00-\u9fa5]/.test(match[1])) {
    return match[1].trim();
  }
  return rawTitle.trim();
};

/**
 * Required tag (碩一/碩二必修, 管必, 系必) from the curriculum facts.
 * The facts are the single source of truth — this no longer depends on the
 * CIS courseType (which labels 組必修 as ELECTIVE and would drop their tags).
 */
export const getRequiredTag = (classNo: string = ""): RequiredTagLabel | null => {
  const fact = getRequiredFact(classNo);
  return fact ? requiredFactLabel(fact) : null;
};

const getCourseType = (c: RawCourse): "REQUIRED" | "ELECTIVE" => {
  return c.courseType === "REQUIRED" ? "REQUIRED" : "ELECTIVE";
};

const mapRawCourse = (c: RawCourse): MasterCourseItem => {
  const reqTag = getRequiredTag(c.classNo);
  const meta = findSnapshotMeta(c);
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
    // CIS-verified room from the snapshot wins; legacy map is last resort.
    room: meta?.room ?? getCourseRoom(c.classNo),
  };
};

/**
 * Fetch all NCU courses from S3 and filter for IM Master courses.
 * Membership is gated by the committed CIS snapshot (allowMaster), which
 * excludes individual research (IM7000), doctoral courses and 在職專班 courses;
 * falls back to the bundled static list if the network fails or is offline.
 */
/**
 * Offline path: the bundled list was regenerated from the same CIS run as the
 * snapshot (scripts/reconcile-curriculum.mjs), so mapping it through the same
 * enrichment keeps 必修 tags and CIS rooms consistent with the online path.
 */
const mapFallbackCourses = (): MasterCourseItem[] =>
  (fallbackMasterCourses as RawCourse[]).map(mapRawCourse);

export const fetchImMasterCourses = async (): Promise<MasterCourseItem[]> => {
  try {
    const res = await fetch(ALL_COURSES_API_URL, { cache: "default" });
    if (!res.ok) {
      return mapFallbackCourses();
    }
    const data = await res.json();
    const allCourses = (data.courses || []) as RawCourse[];
    const filtered = filterMasterCourses(allCourses);

    if (filtered.length > 0) {
      return filtered.map(mapRawCourse);
    }

    return mapFallbackCourses();
  } catch {
    return mapFallbackCourses();
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
