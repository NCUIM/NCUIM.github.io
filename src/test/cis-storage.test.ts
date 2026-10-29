import { describe, it, expect, beforeEach } from "vitest";
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
