import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  STORAGE_KEY_TRACK,
  STORAGE_KEY_SELECTED_COURSES,
  STORAGE_KEY_PREREQS,
  STORAGE_KEY_GATES,
  STORAGE_KEY_CIS_COURSES,
  getStoredTrack,
  setStoredTrack,
  getStoredSelectedCourses,
  setStoredSelectedCourses,
  getStoredPrereqs,
  setStoredPrereqs,
  getStoredGates,
  setStoredGates,
  getStoredCisCourses,
  setStoredCisCourses,
  clearCreditStorage,
  clearCisCoursesStorage,
  isValidCisCourse,
} from "../services/cis-storage";
import type { CisCourse } from "../services/cis-course-api";

describe("cis-storage service", () => {
  const sampleCourse: CisCourse = {
    serialNo: "1001",
    classNo: "IM5019",
    name: "管理資訊系統",
    teacher: "陳彥良",
    room: "I1-404",
    credit: 3,
    classTimes: ["2-2", "2-3", "2-4"],
    classTimesAlt: "2-2,3,4",
    status: "passed",
    admitCnt: 30,
    limitCnt: 30,
    waitCnt: 0,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isValidCisCourse", () => {
    it("returns true for well-formed CisCourse object", () => {
      expect(isValidCisCourse(sampleCourse)).toBe(true);
    });

    it("returns false for non-object or null values", () => {
      expect(isValidCisCourse(null)).toBe(false);
      expect(isValidCisCourse(undefined)).toBe(false);
      expect(isValidCisCourse("course")).toBe(false);
      expect(isValidCisCourse(123)).toBe(false);
    });

    it("returns false when required string fields are missing", () => {
      expect(isValidCisCourse({ ...sampleCourse, serialNo: undefined })).toBe(false);
      expect(isValidCisCourse({ ...sampleCourse, name: 123 })).toBe(false);
      expect(isValidCisCourse({ ...sampleCourse, classNo: null })).toBe(false);
    });

    it("returns false when classTimes is not an array of strings", () => {
      expect(isValidCisCourse({ ...sampleCourse, classTimes: "1-2" })).toBe(false);
      expect(isValidCisCourse({ ...sampleCourse, classTimes: [{}] })).toBe(false);
      expect(isValidCisCourse({ ...sampleCourse, classTimes: [123] })).toBe(false);
    });
  });

  describe("track storage", () => {
    it("defaults to 'mgmt' when unset", () => {
      expect(getStoredTrack()).toBe("mgmt");
    });

    it("returns 'sys' when set to 'sys'", () => {
      setStoredTrack("sys");
      expect(getStoredTrack()).toBe("sys");
      expect(localStorage.getItem(STORAGE_KEY_TRACK)).toBe("sys");
    });

    it("falls back to 'mgmt' when stored value is invalid", () => {
      localStorage.setItem(STORAGE_KEY_TRACK, "invalid_track");
      expect(getStoredTrack()).toBe("mgmt");
    });

    it("gracefully catches localStorage errors (blocked storage)", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: Access denied");
      });
      expect(getStoredTrack()).toBe("mgmt");
    });
  });

  describe("selected courses storage", () => {
    it("returns empty array when unset", () => {
      expect(getStoredSelectedCourses()).toEqual([]);
    });

    it("serializes and deserializes selected course ids correctly", () => {
      const courses = ["IM5019", "IM5020", "IM5021"];
      setStoredSelectedCourses(courses);
      expect(getStoredSelectedCourses()).toEqual(courses);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY_SELECTED_COURSES)!)).toEqual(courses);
    });

    it("safely handles corrupted json data", () => {
      localStorage.setItem(STORAGE_KEY_SELECTED_COURSES, "not_valid_json{");
      expect(getStoredSelectedCourses()).toEqual([]);
    });

    it("filters out non-string items if json is malformed", () => {
      localStorage.setItem(STORAGE_KEY_SELECTED_COURSES, JSON.stringify(["IM5019", 123, null, "IM5020"]));
      expect(getStoredSelectedCourses()).toEqual(["IM5019", "IM5020"]);
    });

    it("handles blocked storage without throwing", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(getStoredSelectedCourses()).toEqual([]);
    });
  });

  describe("prereqs and gates storage", () => {
    it("stores and retrieves prereqs", () => {
      const prereqs = ["prereq_calc", "prereq_stat"];
      setStoredPrereqs(prereqs);
      expect(getStoredPrereqs()).toEqual(prereqs);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY_PREREQS)!)).toEqual(prereqs);
    });

    it("safely handles corrupted prereqs", () => {
      localStorage.setItem(STORAGE_KEY_PREREQS, "{corrupted");
      expect(getStoredPrereqs()).toEqual([]);
    });

    it("stores and retrieves graduation gates", () => {
      const gates = ["gate_english", "gate_ethics"];
      setStoredGates(gates);
      expect(getStoredGates()).toEqual(gates);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY_GATES)!)).toEqual(gates);
    });

    it("safely handles corrupted gates", () => {
      localStorage.setItem(STORAGE_KEY_GATES, "{corrupted");
      expect(getStoredGates()).toEqual([]);
    });
  });

  describe("cis courses storage", () => {
    it("stores and retrieves cis courses", () => {
      setStoredCisCourses([sampleCourse]);
      expect(getStoredCisCourses()).toEqual([sampleCourse]);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY_CIS_COURSES)!)).toEqual([sampleCourse]);
    });

    it("safely handles corrupted cis courses json", () => {
      localStorage.setItem(STORAGE_KEY_CIS_COURSES, "invalid_json");
      expect(getStoredCisCourses()).toEqual([]);
    });

    it("discards malformed course entries from stored json", () => {
      const malformedList = [
        sampleCourse,
        null,
        { serialNo: "123" }, // missing classTimes, name, etc.
        { ...sampleCourse, classTimes: [{}] }, // non-string classTimes
        "not an object",
      ];
      localStorage.setItem(STORAGE_KEY_CIS_COURSES, JSON.stringify(malformedList));
      expect(getStoredCisCourses()).toEqual([sampleCourse]);
    });

    it("discards invalid courses when calling setStoredCisCourses", () => {
      const invalid = { serialNo: 123 } as unknown as CisCourse;
      setStoredCisCourses([sampleCourse, invalid]);
      expect(getStoredCisCourses()).toEqual([sampleCourse]);
    });

    it("catches blocked storage exception on getItem and returns empty list", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: Access denied");
      });
      expect(getStoredCisCourses()).toEqual([]);
    });
  });

  describe("clearing storage", () => {
    it("clears credit storage without touching other keys", () => {
      setStoredSelectedCourses(["IM5019"]);
      setStoredPrereqs(["prereq_calc"]);
      setStoredGates(["gate_eng"]);
      setStoredTrack("sys");
      localStorage.setItem("other_key", "keep");

      clearCreditStorage();

      expect(getStoredSelectedCourses()).toEqual([]);
      expect(getStoredPrereqs()).toEqual([]);
      expect(getStoredGates()).toEqual([]);
      expect(getStoredTrack()).toBe("sys");
      expect(localStorage.getItem("other_key")).toBe("keep");
    });

    it("clears cis courses storage", () => {
      localStorage.setItem(STORAGE_KEY_CIS_COURSES, JSON.stringify([sampleCourse]));
      clearCisCoursesStorage();
      expect(localStorage.getItem(STORAGE_KEY_CIS_COURSES)).toBeNull();
    });
  });
});
