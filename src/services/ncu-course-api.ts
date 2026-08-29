/**
 * NCU Course API Service
 *
 * Fetches the student's selected courses from the NCU Course API.
 * Docs: https://github.com/NCU-CC/API-Documentation
 */

import { NCU_OAUTH, getAccessToken } from "./ncu-oauth";

// ── Types (based on NCU API response structure) ───────────────

/** A single selected course from the NCU API */
export interface NcuCourse {
  /** e.g. "CSIE5023" */
  serialNo: string;
  /** e.g. "計算機科學" */
  name: string;
  /** e.g. "CSIE" */
  departmentId: string;
  /** e.g. "資訊管理學系" */
  departmentName: string;
  /** e.g. "王志明" */
  teacher: string;
  /** e.g. "313" */
  room: string;
  /** e.g. "一 08:10-09:00" or "一 08:10-09:00; 三 08:10-09:00" */
  time: string;
  /** e.g. 3 */
  credit: number;
  /** e.g. "必修" or "選修" */
  type?: string;
  /** Target / class group */
  target?: string;
}

/** Student info from NCU Portal */
export interface NcuStudentInfo {
  identifier: string;
  "chinese-name"?: string;
  "student-id"?: string;
  "academy-records"?: string;
}

// ── API Calls ─────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${NCU_OAUTH.courseApiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": "zh-TW",
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch the current student's selected courses.
 * Requires OAuth2 token with student scope.
 */
export async function fetchSelectedCourses(): Promise<NcuCourse[]> {
  const data = await apiFetch<{ courses?: NcuCourse[] }>("/student/selected");
  return data.courses ?? [];
}

/**
 * Fetch student info from NCU Portal.
 */
export async function fetchStudentInfo(): Promise<NcuStudentInfo> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(NCU_OAUTH.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`User info error ${res.status}`);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Parse NCU time string into structured day/time arrays.
 * Input format: "一 08:10-09:00; 三 08:10-09:00"
 * Returns: [{ day: "一", start: "08:10", end: "09:00" }, ...]
 */
export interface ParsedTime {
  day: string;
  start: string;
  end: string;
  /** 0=Mon … 4=Fri */
  dayIndex: number;
}

const DAY_MAP: Record<string, number> = {
  "一": 0, "二": 1, "三": 2, "四": 3, "五": 4,
};

export function parseNcuTime(timeStr: string): ParsedTime[] {
  return timeStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((segment) => {
      const parts = segment.split(/\s+/);
      const dayChar = parts[0] ?? "";
      const timeRange = parts[1] ?? "";
      const [start = "", end = ""] = timeRange.split("-");
      return {
        day: dayChar,
        start,
        end,
        dayIndex: DAY_MAP[dayChar] ?? -1,
      };
    });
}
