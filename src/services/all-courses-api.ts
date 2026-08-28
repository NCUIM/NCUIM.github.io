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
  readonly courseType: "REQUIRED" | "ELECTIVE" | string;
  readonly passwordCard?: string;
  readonly limitCnt?: number | null;
  readonly admitCnt?: number | null;
  readonly room?: string;
  readonly isMyCourse?: boolean;
}

export const ALL_COURSES_API_URL =
  "https://ncucf-data.s3.amazonaws.com/data/dynamic/all.json";

/**
 * Known classroom mapping for NCU IM Master's courses
 */
export const IM_CLASSROOM_MAP: Record<string, string> = {
  "IM5001-*": "I1-405-1", // 社會網路分析
  "IM5007-*": "I1-405-1", // 資訊檢索
  "IM5008-*": "I1-404", // 商業智慧
  "IM5019-A": "I1-404", // 管理溝通 (黃子菱)
  "IM5019-B": "I1-404", // 管理溝通 (何迪亞)
  "IM5022-*": "I1-405-1", // 多媒體資料庫
  "IM5032-*": "I1-405-1", // 物聯網實務應用
  "IM5038-*": "I1-404", // 進階區塊鏈應用與隱私防護
  "IM5041-*": "I1-405-1", // 現代與後量子密碼學導論
  "IM6002-*": "I1-404", // 資訊系統專案管理
  "IM6041-*": "I1-404", // 生產與作業管理
  "IM6053-*": "I1-404", // 多變量分析
  "IM6055-*": "I1-405-1", // 電腦網路安全
  "IM6082-*": "I1-404", // 行銷管理
  "IM6103-*": "I1-405-1", // 網路經濟與賽局智慧
  "IM7043-*": "I1-404", // 書報研討Ⅰ
  "IM7071-*": "I1-405-1", // 企業電腦網路
  "IM7082-*": "I1-404", // 智慧型資訊系統
};

/**
 * Fetch all NCU courses from S3 and filter for IM Fresher / Master 1st year relevant courses.
 * Excludes 碩二必修 (IM6003 軟體工程Ⅰ, IM6012 管理資訊系統) and doctoral courses (IM8xxx).
 * Falls back to bundled static json if network fails or offline.
 */
export async function fetchImMasterCourses(): Promise<MasterCourseItem[]> {
  try {
    const res = await fetch(ALL_COURSES_API_URL, { cache: "default" });
    if (!res.ok) {
      return fallbackMasterCourses as MasterCourseItem[];
    }
    const data = await res.json();
    const allCourses = (data.courses || []) as Array<{
      serialNo: number;
      classNo: string;
      title: string;
      credit: number;
      teachers: string[];
      classTimes: string[];
      courseType: string;
      passwordCard?: string;
      limitCnt?: number | null;
      admitCnt?: number | null;
      departmentIds?: string[];
    }>;

    const filtered = allCourses.filter((c) => {
      const isIm =
        c.departmentIds?.includes("deptI1I4003I0") ||
        (c.classNo && c.classNo.startsWith("IM"));
      if (!isIm) return false;

      // Exclude 碩二必修 (IM6003 軟體工程Ⅰ, IM6012 管理資訊系統)
      if (c.classNo?.startsWith("IM6003") || c.classNo?.startsWith("IM6012")) {
        return false;
      }

      // Master courses are numbered IM5xxx - IM7xxx (regular daytime graduate courses)
      const match = c.classNo?.match(/IM([0-9]{4})/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num >= 5000 && num < 8000;
      }
      return false;
    });

    if (filtered.length > 0) {
      return filtered.map((c) => ({
        serialNo: c.serialNo,
        classNo: c.classNo,
        title: c.title,
        credit: c.credit,
        teachers: c.teachers || [],
        classTimes: c.classTimes || [],
        courseType: c.courseType || "ELECTIVE",
        passwordCard: c.passwordCard,
        limitCnt: c.limitCnt,
        admitCnt: c.admitCnt,
        room: IM_CLASSROOM_MAP[c.classNo] || "I1-404",
      }));
    }

    return fallbackMasterCourses as MasterCourseItem[];
  } catch {
    return fallbackMasterCourses as MasterCourseItem[];
  }
}

/**
 * Convert master courses into timetable grid map: Key is `${periodId}-${dayIndex}` (e.g. "2-4")
 * Supporting multiple courses per time slot!
 */
export function buildTimetableMapFromMasterCourses(
  courses: MasterCourseItem[],
): Record<string, MasterCourseItem[]> {
  const result: Record<string, MasterCourseItem[]> = {};

  for (const c of courses) {
    for (const ct of c.classTimes) {
      // Format: "5-2" (day 5 = Friday, period 2)
      const parts = ct.split("-");
      if (parts.length !== 2) continue;
      const dayNum = parseInt(parts[0], 10);
      const periodId = parts[1];

      // Day 1..5 -> dayIndex 0..4 (Mon..Fri)
      if (dayNum >= 1 && dayNum <= 5) {
        const dayIdx = dayNum - 1;
        const key = `${periodId}-${dayIdx}`;
        if (!result[key]) {
          result[key] = [];
        }
        // Avoid duplicate additions
        if (!result[key].some((item) => item.classNo === c.classNo)) {
          result[key].push(c);
        }
      }
    }
  }

  return result;
}
