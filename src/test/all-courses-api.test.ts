import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchImMasterCourses,
  buildTimetableMapFromMasterCourses,
  type MasterCourseItem,
} from "../services/all-courses-api";

describe("all-courses-api service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("buildTimetableMapFromMasterCourses correctly maps multiple courses to the same slot", () => {
    const mockCourses: MasterCourseItem[] = [
      {
        serialNo: 43022,
        classNo: "IM5001-*",
        title: "社會網路分析",
        credit: 3,
        teachers: ["曾筱珽"],
        classTimes: ["5-2", "5-3"],
        courseType: "ELECTIVE",
      },
      {
        serialNo: 43024,
        classNo: "IM5008-*",
        title: "商業智慧",
        credit: 3,
        teachers: ["陳彥良"],
        classTimes: ["5-2", "5-3"],
        courseType: "ELECTIVE",
      },
    ];

    const map = buildTimetableMapFromMasterCourses(mockCourses);

    // Friday (day 5 -> index 4) period 2
    expect(map["2-4"]).toBeDefined();
    expect(map["2-4"].length).toBe(2);
    expect(map["2-4"].map((c) => c.title)).toContain("社會網路分析");
    expect(map["2-4"].map((c) => c.title)).toContain("商業智慧");

    // Friday period 3
    expect(map["3-4"].length).toBe(2);
  });

  it("fetchImMasterCourses falls back to bundled JSON when network request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network offline"));
    const courses = await fetchImMasterCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.some((c) => c.title === "商業智慧")).toBe(true);
    expect(courses.some((c) => c.title === "管理溝通")).toBe(false);
  });

  it("fetchImMasterCourses successfully filters IM master courses and excludes 碩二必修", async () => {
    const mockApiResponse = {
      courses: [
        {
          serialNo: 43024,
          classNo: "IM5008-*",
          title: "商業智慧",
          credit: 3,
          teachers: ["陳彥良"],
          classTimes: ["5-2", "5-3"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
        {
          serialNo: 43025,
          classNo: "IM5019-A",
          title: "管理溝通",
          credit: 2,
          teachers: ["黃子菱"],
          classTimes: ["4-2", "4-3"],
          courseType: "REQUIRED",
          departmentIds: ["deptI1I4003I0"],
        },
        {
          serialNo: 1001,
          classNo: "BA1001-*",
          title: "企業概論",
          credit: 3,
          teachers: ["張教授"],
          classTimes: ["1-2"],
          courseType: "REQUIRED",
          departmentIds: ["deptI1I4001I0"],
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const courses = await fetchImMasterCourses();
    expect(courses.length).toBe(1);
    expect(courses[0].title).toBe("商業智慧");
  });
});
