import type { TrackType } from "../data/im-curriculum";
import type { CisCourse } from "./cis-course-api";

export const STORAGE_KEY_TRACK = "ncu_credit_track";
export const STORAGE_KEY_SELECTED_COURSES = "ncu_selected_credit_courses";
export const STORAGE_KEY_PREREQS = "ncu_selected_prereqs";
export const STORAGE_KEY_GATES = "ncu_selected_gates";
export const STORAGE_KEY_CIS_COURSES = "ncu_my_cis_courses";

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota or blocked storage errors
  }
}

function safeStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function isValidCisCourse(course: unknown): course is CisCourse {
  if (!course || typeof course !== "object") return false;
  const c = course as Partial<CisCourse>;
  return (
    typeof c.serialNo === "string" &&
    typeof c.name === "string" &&
    typeof c.classNo === "string" &&
    Array.isArray(c.classTimes) &&
    c.classTimes.every((t) => typeof t === "string")
  );
}

export function getStoredTrack(): TrackType {
  const saved = safeStorageGet(STORAGE_KEY_TRACK);
  return saved === "sys" ? "sys" : "mgmt";
}

export function setStoredTrack(track: TrackType): void {
  safeStorageSet(STORAGE_KEY_TRACK, track);
}

export function getStoredSelectedCourses(): string[] {
  const raw = safeStorageGet(STORAGE_KEY_SELECTED_COURSES);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

export function setStoredSelectedCourses(courses: readonly string[]): void {
  safeStorageSet(STORAGE_KEY_SELECTED_COURSES, JSON.stringify(courses));
}

export function getStoredPrereqs(): string[] {
  const raw = safeStorageGet(STORAGE_KEY_PREREQS);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

export function setStoredPrereqs(prereqs: readonly string[]): void {
  safeStorageSet(STORAGE_KEY_PREREQS, JSON.stringify(prereqs));
}

export function getStoredGates(): string[] {
  const raw = safeStorageGet(STORAGE_KEY_GATES);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

export function setStoredGates(gates: readonly string[]): void {
  safeStorageSet(STORAGE_KEY_GATES, JSON.stringify(gates));
}

export function getStoredCisCourses(): CisCourse[] {
  const raw = safeStorageGet(STORAGE_KEY_CIS_COURSES);
  const parsed = safeJsonParse<unknown>(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidCisCourse);
}

export function setStoredCisCourses(courses: readonly CisCourse[]): void {
  const validCourses = courses.filter(isValidCisCourse);
  safeStorageSet(STORAGE_KEY_CIS_COURSES, JSON.stringify(validCourses));
}

export function clearCreditStorage(): void {
  safeStorageRemove(STORAGE_KEY_SELECTED_COURSES);
  safeStorageRemove(STORAGE_KEY_PREREQS);
  safeStorageRemove(STORAGE_KEY_GATES);
}

export function clearCisCoursesStorage(): void {
  safeStorageRemove(STORAGE_KEY_CIS_COURSES);
}
