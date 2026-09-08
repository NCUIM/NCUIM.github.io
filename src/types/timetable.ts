import type { RequiredTagLabel } from "../data/im-curriculum";

export interface Course {
  readonly id?: string;
  readonly classNo?: string;
  readonly name: string;
  readonly teacher: string;
  readonly room?: string;
  readonly myEnrolledTeacher?: string;
  readonly myEnrolledRoom?: string;
  readonly courseType?: "REQUIRED" | "ELECTIVE";
  readonly requiredTag?: RequiredTagLabel | null;
  readonly credit?: number;
  readonly isMyCourse?: boolean;
}

export interface Period {
  readonly id: string;
  readonly time: string;
}

export interface DayCourseSpan {
  course: Course;
  startIdx: number;
  endIdx: number;
  trackIndex: number;
}

export interface DesktopCourseSpan {
  course: Course;
  startIdx: number;
  endIdx: number;
  colIndex: number;
  totalCols: number;
}

export const days: readonly string[] = ["一", "二", "三", "四", "五"];

export const NCU_PERIODS: readonly Period[] = [
  { id: "1", time: "08:00-08:50" },
  { id: "2", time: "09:00-09:50" },
  { id: "3", time: "10:00-10:50" },
  { id: "4", time: "11:00-11:50" },
  { id: "Z", time: "12:00-12:50" },
  { id: "5", time: "13:00-13:50" },
  { id: "6", time: "14:00-14:50" },
  { id: "7", time: "15:00-15:50" },
  { id: "8", time: "16:00-16:50" },
  { id: "9", time: "17:00-17:50" },
  { id: "A", time: "18:00-18:50" },
  { id: "B", time: "19:00-19:50" },
  { id: "C", time: "20:00-20:50" },
  { id: "D", time: "21:00-21:50" },
  { id: "E", time: "22:00-22:50" },
  { id: "F", time: "23:00-23:50" },
];

export const periods: readonly Period[] = NCU_PERIODS;
