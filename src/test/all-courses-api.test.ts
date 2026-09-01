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

  it("buildTimetableMapFromMasterCourses merges same-name courses in the same slot", () => {
    const mockCourses: MasterCourseItem[] = [
      {
        serialNo: 43025,
        classNo: "IM5025-A",
        title: "研究方法",
        credit: 3,
        teachers: ["劉子源"],
        classTimes: ["5-2", "5-3"],
        courseType: "REQUIRED",
        requiredTag: "碩一必修",
        room: "I1-405-1",
      },
      {
        serialNo: 43026,
        classNo: "IM5025-B",
        title: "研究方法",
        credit: 3,
        teachers: ["許智誠"],
        classTimes: ["5-2", "5-3"],
        courseType: "REQUIRED",
        requiredTag: "碩一必修",
        room: "I1-404",
      },
    ];

    const map = buildTimetableMapFromMasterCourses(mockCourses);

    // Friday (day 5 -> index 4) period 2 should have 1 merged card with paired teachers & classrooms
    expect(map["2-4"]).toBeDefined();
    expect(map["2-4"]).toHaveLength(1);
    expect(map["2-4"][0].title).toBe("研究方法");
    expect(map["2-4"][0].teachers).toEqual(["劉子源 (I1-405-1)", "許智誠 (I1-404)"]);
    expect(map["2-4"][0].requiredTag).toBe("碩一必修");
  });

  it("fetchImMasterCourses falls back to bundled JSON when network request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network offline"));
    const courses = await fetchImMasterCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.some((c) => c.title === "商業智慧")).toBe(true);
  });

  it("fetchImMasterCourses successfully filters IM master courses and marks requiredTag", async () => {
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
          serialNo: 43026,
          classNo: "IM7000-*",
          title: "碩士論文",
          credit: 0,
          teachers: ["指導教授"],
          classTimes: [],
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
    expect(courses).toHaveLength(2);
    expect(courses.map((c) => c.title)).toContain("商業智慧");
    expect(courses.map((c) => c.title)).toContain("管理溝通");
    const mComm = courses.find((c) => c.title === "管理溝通");
    expect(mComm?.requiredTag).toBe("碩二必修");
  });
});
