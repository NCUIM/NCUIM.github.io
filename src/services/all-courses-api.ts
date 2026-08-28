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

export const ALL_COURSES_API_URL = "https://ncucf-data.s3.amazonaws.com/data/dynamic/all.json";

/**
 * Fetch all NCU courses from S3 and filter for IM Graduate / Master courses (IM5000+).
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

      // Master courses are numbered IM5xxx - IM8xxx (regular daytime graduate courses)
      const match = c.classNo?.match(/IM([0-9]{4})/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num >= 5000;
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
