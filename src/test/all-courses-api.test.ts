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
        classNo: "IM5019-A",
        title: "管理溝通",
        credit: 2,
        teachers: ["黃子菱"],
        classTimes: ["4-2", "4-3"],
        courseType: "REQUIRED",
        requiredTag: "碩二必修",
        room: "I1-002",
      },
      {
        serialNo: 43026,
        classNo: "IM5019-B",
        title: "管理溝通",
        credit: 2,
        teachers: ["何迪亞"],
        classTimes: ["4-2", "4-3"],
        courseType: "REQUIRED",
        requiredTag: "碩二必修",
        room: "I1-404",
      },
    ];

    const map = buildTimetableMapFromMasterCourses(mockCourses);

    // Thursday (day 4 -> index 3) period 2 should have 1 merged card with paired teachers & classrooms
    expect(map["2-3"]).toBeDefined();
    expect(map["2-3"]).toHaveLength(1);
    expect(map["2-3"][0].title).toBe("管理溝通");
    expect(map["2-3"][0].teachers).toEqual(["黃子菱 (I1-002)", "何迪亞 (I1-404)"]);
    expect(map["2-3"][0].requiredTag).toBe("碩二必修");
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

  it("tags 組必修 courses even though CIS marks them ELECTIVE (no courseType gate)", async () => {
    const mockApiResponse = {
      courses: [
        {
          serialNo: 43035,
          classNo: "IM6053-*",
          title: "多變量分析",
          credit: 3,
          teachers: ["某教授"],
          classTimes: ["3-2", "3-3", "3-4"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
        {
          serialNo: 43040,
          classNo: "IM7071-*",
          title: "企業電腦網路",
          credit: 3,
          teachers: ["某教授"],
          classTimes: ["2-6", "2-7", "2-8"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
        {
          serialNo: 43039,
          classNo: "IM7043-*",
          title: "書報研討Ⅰ",
          credit: 1,
          teachers: ["王存國"],
          classTimes: ["2-5", "2-6", "2-7"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const courses = await fetchImMasterCourses();
    const multi = courses.find((c) => c.classNo === "IM6053-*");
    const net = courses.find((c) => c.classNo === "IM7071-*");
    expect(multi?.requiredTag).toBe("管必");
    expect(net?.requiredTag).toBe("系必");
  });

  it("gates the master list by the snapshot allowMaster flag (doctoral IM7043 excluded)", async () => {
    const mockApiResponse = {
      courses: [
        {
          serialNo: 43039,
          classNo: "IM7043-*",
          title: "書報研討Ⅰ",
          credit: 1,
          teachers: ["王存國"],
          classTimes: ["2-5", "2-6", "2-7"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
        {
          serialNo: 43041,
          classNo: "IM7082-*",
          title: "智慧型資訊系統",
          credit: 3,
          teachers: ["某教授"],
          classTimes: ["3-6", "3-7", "3-8"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const courses = await fetchImMasterCourses();
    // IM7043 is in the 5xxx–7xxx numeric band but the snapshot (分發條件: 限博士班)
    // marks it allowMaster:false — it must not appear in the master's timetable.
    expect(courses.some((c) => c.classNo === "IM7043-*")).toBe(false);
    // IM7082 shares the same band and is genuinely master-selectable — it stays.
    expect(courses.some((c) => c.classNo === "IM7082-*")).toBe(true);
  });

  it("drops courses absent from the snapshot — no band fallback, so nothing leaks", async () => {
    const mockApiResponse = {
      courses: [
        {
          serialNo: 43041,
          classNo: "IM7082-*",
          title: "智慧型資訊系統",
          credit: 3,
          teachers: ["某教授"],
          classTimes: ["3-6", "3-7", "3-8"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
        {
          serialNo: 999999,
          classNo: "IM6500-*",
          title: "新開課程",
          credit: 3,
          teachers: ["某教授"],
          classTimes: ["1-2", "1-3", "1-4"],
          courseType: "ELECTIVE",
          departmentIds: ["deptI1I4003I0"],
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const courses = await fetchImMasterCourses();
    // The snapshot course stays…
    expect(courses.some((c) => c.classNo === "IM7082-*")).toBe(true);
    // …but IM6500 sits inside the old 5xxx–7xxx band yet has no snapshot entry
    // (分發條件 unknown) — the snapshot is the sole gate, so it must not leak in.
    expect(courses.some((c) => c.classNo === "IM6500-*")).toBe(false);
  });
});
