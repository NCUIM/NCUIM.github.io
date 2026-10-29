import type { TrackType } from "../data/im-curriculum";
import type { CisCourse } from "./cis-course-api";

export const STORAGE_KEY_TRACK = "ncu_credit_track";
export const STORAGE_KEY_SELECTED_COURSES = "ncu_selected_credit_courses";
export const STORAGE_KEY_PREREQS = "ncu_selected_prereqs";
export const STORAGE_KEY_GATES = "ncu_selected_gates";
export const STORAGE_KEY_CIS_COURSES = "ncu_my_cis_courses";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getStoredTrack(): TrackType {
  const saved = localStorage.getItem(STORAGE_KEY_TRACK);
  return saved === "sys" ? "sys" : "mgmt";
}

export function setStoredTrack(track: TrackType): void {
  localStorage.setItem(STORAGE_KEY_TRACK, track);
}

export function getStoredSelectedCourses(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY_SELECTED_COURSES);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed.filter((item): item is string => typeof item === "string")) : [];
}

export function setStoredSelectedCourses(courses: readonly string[]): void {
  localStorage.setItem(STORAGE_KEY_SELECTED_COURSES, JSON.stringify(courses));
}

export function getStoredPrereqs(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY_PREREQS);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed.filter((item): item is string => typeof item === "string")) : [];
}

export function setStoredPrereqs(prereqs: readonly string[]): void {
  localStorage.setItem(STORAGE_KEY_PREREQS, JSON.stringify(prereqs));
}

export function getStoredGates(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY_GATES);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed.filter((item): item is string => typeof item === "string")) : [];
}

export function setStoredGates(gates: readonly string[]): void {
  localStorage.setItem(STORAGE_KEY_GATES, JSON.stringify(gates));
}

export function getStoredCisCourses(): CisCourse[] {
  const raw = localStorage.getItem(STORAGE_KEY_CIS_COURSES);
  const parsed = safeJsonParse<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed as CisCourse[]) : [];
}

export function setStoredCisCourses(courses: readonly CisCourse[]): void {
  localStorage.setItem(STORAGE_KEY_CIS_COURSES, JSON.stringify(courses));
}

export function clearCreditStorage(): void {
  localStorage.removeItem(STORAGE_KEY_SELECTED_COURSES);
  localStorage.removeItem(STORAGE_KEY_PREREQS);
  localStorage.removeItem(STORAGE_KEY_GATES);
}

export function clearCisCoursesStorage(): void {
  localStorage.removeItem(STORAGE_KEY_CIS_COURSES);
}
