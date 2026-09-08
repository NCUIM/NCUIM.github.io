import { describe, it, expect } from "vitest";
import {
  extractCourseCodeAndSection,
  isSerialMatch,
  isClassNoMatch,
  isSingleMasterCourseMatch,
  isCourseMatch,
  matchCisCourse,
  buildTimetableFromCisCourses,
  NCU_PERIODS,
  getPeriodTimeBounds,
} from "../pages/TimetablePage";
import { buildTimetableMapFromMasterCourses, type MasterCourseItem } from "../services/all-courses-api";
import type { CisCourse } from "../services/cis-course-api";

describe("timetable-matching logic", () => {
  const master43025: MasterCourseItem = {
    serialNo: 43025,
    classNo: "IM5019-A",
    title: "管理溝通",
    credit: 2,
    teachers: ["黃子菱"],
    classTimes: ["4-2", "4-3", "4-4"],
    courseType: "REQUIRED",
    requiredTag: "碩二必修",
    room: "I1-002",
  };

  const master43026: MasterCourseItem = {
    serialNo: 43026,
    classNo: "IM5019-B",
    title: "管理溝通",
    credit: 2,
    teachers: ["何迪亞"],
    classTimes: ["4-2", "4-3", "4-4"],
    courseType: "REQUIRED",
    requiredTag: "碩二必修",
    room: "I1-404",
  };

  const masterCourses = [master43025, master43026];

  describe("extractCourseCodeAndSection", () => {
    it("parses code and section accurately", () => {
      expect(extractCourseCodeAndSection("IM5019-A")).toEqual({ base: "IM5019", section: "A" });
      expect(extractCourseCodeAndSection("IM5019-B")).toEqual({ base: "IM5019", section: "B" });
      expect(extractCourseCodeAndSection("IM5019-*")).toEqual({ base: "IM5019", section: "" });
      expect(extractCourseCodeAndSection("IM5019")).toEqual({ base: "IM5019", section: "" });
      expect(extractCourseCodeAndSection(undefined)).toEqual({ base: "", section: "" });
    });
  });

  describe("isClassNoMatch", () => {
    it("matches identical class numbers", () => {
      expect(isClassNoMatch("IM5019-A", "IM5019-A")).toBe(true);
      expect(isClassNoMatch("IM5019-B", "IM5019-B")).toBe(true);
    });

    it("rejects different section codes for the same course base", () => {
      expect(isClassNoMatch("IM5019-A", "IM5019-B")).toBe(false);
      expect(isClassNoMatch("IM5019-B", "IM5019-A")).toBe(false);
    });

    it("matches when one side does not specify a section", () => {
      expect(isClassNoMatch("IM5019-A", "IM5019")).toBe(true);
      expect(isClassNoMatch("IM5019-*", "IM5019")).toBe(true);
      expect(isClassNoMatch("IM5019", "IM5019-A")).toBe(true);
    });

    it("rejects different base course numbers", () => {
      expect(isClassNoMatch("IM5019-A", "IM5008-*")).toBe(false);
    });
  });

  describe("isSingleMasterCourseMatch", () => {
    it("matches by serial number and rejects conflicting serial numbers", () => {
      const cisHoDiYa: Partial<CisCourse> = {
        serialNo: "43026",
        classNo: "IM5019",
        name: "管理溝通",
      };

      // Serial 43026 must match master 43026
      expect(isSingleMasterCourseMatch(master43026, cisHoDiYa)).toBe(true);
      // Serial 43026 must NOT match master 43025 even though base classNo and title match!
      expect(isSingleMasterCourseMatch(master43025, cisHoDiYa)).toBe(false);
    });

    it("matches by section code when serial number is absent", () => {
      const cisNoSerialB: Partial<CisCourse> = {
        classNo: "IM5019-B",
        name: "管理溝通",
      };

      expect(isSingleMasterCourseMatch(master43026, cisNoSerialB)).toBe(true);
      expect(isSingleMasterCourseMatch(master43025, cisNoSerialB)).toBe(false);
    });

    it("matches by teacher when serial and section are absent", () => {
      const cisTeacherHo: Partial<CisCourse> = {
        classNo: "IM5019",
        name: "管理溝通",
        teacher: "何迪亞",
      };

      expect(isSingleMasterCourseMatch(master43026, cisTeacherHo)).toBe(true);
      expect(isSingleMasterCourseMatch(master43025, cisTeacherHo)).toBe(false);
    });
  });

  describe("buildTimetableFromCisCourses", () => {
    it("correctly maps student in 何迪亞班 to room I1-404 and teacher 何迪亞", () => {
      const myCisCourses: CisCourse[] = [
        {
          serialNo: "43026",
          classNo: "IM5019",
          name: "管理溝通",
          teacher: "",
          room: "",
          credit: 2,
          classTimes: [],
          classTimesAlt: "",
          status: "已選",
          admitCnt: 0,
          limitCnt: 0,
          waitCnt: 0,
        },
      ];

      const timetable = buildTimetableFromCisCourses(myCisCourses, masterCourses);

      // Thursday (day index 3) periods 2, 3, 4
      const p2 = timetable["2-3"];
      const p3 = timetable["3-3"];
      const p4 = timetable["4-3"];

      expect(p2).toBeDefined();
      expect(p2).toHaveLength(1);
      expect(p2[0].name).toBe("管理溝通");
      expect(p2[0].teacher).toBe("何迪亞");
      expect(p2[0].room).toBe("I1-404");
      expect(p2[0].classNo).toBe("IM5019-B");

      expect(p3[0].room).toBe("I1-404");
      expect(p4[0].room).toBe("I1-404");
    });

    it("correctly maps student in 黃子菱班 to room I1-002 and teacher 黃子菱", () => {
      const myCisCourses: CisCourse[] = [
        {
          serialNo: "43025",
          classNo: "IM5019",
          name: "管理溝通",
          teacher: "",
          room: "",
          credit: 2,
          classTimes: [],
          classTimesAlt: "",
          status: "已選",
          admitCnt: 0,
          limitCnt: 0,
          waitCnt: 0,
        },
      ];

      const timetable = buildTimetableFromCisCourses(myCisCourses, masterCourses);

      const p2 = timetable["2-3"];
      expect(p2).toBeDefined();
      expect(p2).toHaveLength(1);
      expect(p2[0].name).toBe("管理溝通");
      expect(p2[0].teacher).toBe("黃子菱");
      expect(p2[0].room).toBe("I1-002");
      expect(p2[0].classNo).toBe("IM5019-A");
    });
  });

  describe("matchCisCourse with merged master timetable cards", () => {
    it("correctly identifies enrolled section and room on merged master course cards", () => {
      const masterMap = buildTimetableMapFromMasterCourses(masterCourses);
      const mergedCard = masterMap["2-3"][0];

      expect(mergedCard.title).toBe("管理溝通");
      expect(mergedCard.mergedSections).toBeDefined();
      expect(mergedCard.mergedSections).toHaveLength(2);

      // Student enrolled in 何迪亞班 (43026)
      const myCisCourses: CisCourse[] = [
        {
          serialNo: "43026",
          classNo: "IM5019",
          name: "管理溝通",
          teacher: "",
          room: "",
          credit: 2,
          classTimes: [],
          classTimesAlt: "",
          status: "已選",
          admitCnt: 0,
          limitCnt: 0,
          waitCnt: 0,
        },
      ];

      const match = matchCisCourse(mergedCard, myCisCourses);
      expect(match.isMine).toBe(true);
      expect(match.matchedTeacher).toBe("何迪亞");
      expect(match.matchedRoom).toBe("I1-404");
      expect(match.room).toBe("I1-404");
    });
  });

  describe("NCU timetable official periods and time bounds", () => {
    it("defines 16 periods matching official NCU bell schedule", () => {
      expect(NCU_PERIODS).toHaveLength(16);
      expect(NCU_PERIODS.map((p) => p.id)).toEqual([
        "1", "2", "3", "4", "Z", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F",
      ]);
      expect(NCU_PERIODS[0]).toEqual({ id: "1", time: "08:00-08:50" });
      expect(NCU_PERIODS[4]).toEqual({ id: "Z", time: "12:00-12:50" });
      expect(NCU_PERIODS[10]).toEqual({ id: "A", time: "18:00-18:50" });
      expect(NCU_PERIODS[15]).toEqual({ id: "F", time: "23:00-23:50" });
    });

    it("calculates time bounds correctly for hyphen and tilde formats", () => {
      const p1 = getPeriodTimeBounds("08:00-08:50");
      expect(p1).toEqual({ start: 480, end: 530 });

      const pZ = getPeriodTimeBounds("12:00 ~ 12:50");
      expect(pZ).toEqual({ start: 720, end: 770 });

      const pA = getPeriodTimeBounds("18:00-18:50");
      expect(pA).toEqual({ start: 1080, end: 1130 });
    });

    it("maps noon period Z and evening period A correctly in timetable", () => {
      const mockCourses: CisCourse[] = [
        {
          serialNo: "99001",
          classNo: "IM9001",
          name: "中午研討課",
          teacher: "胡雅涵",
          room: "I1-002",
          credit: 1,
          classTimes: ["3-Z"],
          classTimesAlt: "",
          status: "已選",
          admitCnt: 0,
          limitCnt: 0,
          waitCnt: 0,
        },
        {
          serialNo: "99002",
          classNo: "IM9002",
          name: "夜間論壇",
          teacher: "何迪亞",
          room: "I1-404",
          credit: 2,
          classTimes: ["4-A", "4-B"],
          classTimesAlt: "",
          status: "已選",
          admitCnt: 0,
          limitCnt: 0,
          waitCnt: 0,
        },
        {
          serialNo: "99003",
          classNo: "IM9003",
          name: "相容舊版節次",
          teacher: "黃子菱",
          room: "I1-002",
          credit: 1,
          classTimes: ["2-N"],
          classTimesAlt: "",
          status: "已選",
          admitCnt: 0,
          limitCnt: 0,
          waitCnt: 0,
        },
      ];

      const timetable = buildTimetableFromCisCourses(mockCourses);
      expect(timetable["Z-2"]).toBeDefined();
      expect(timetable["Z-2"][0].name).toBe("中午研討課");

      expect(timetable["A-3"]).toBeDefined();
      expect(timetable["A-3"][0].name).toBe("夜間論壇");
      expect(timetable["B-3"]).toBeDefined();
      expect(timetable["B-3"][0].name).toBe("夜間論壇");

      // Legacy 'N' normalized to 'Z'
      expect(timetable["Z-1"]).toBeDefined();
      expect(timetable["Z-1"][0].name).toBe("相容舊版節次");
    });
  });
});
