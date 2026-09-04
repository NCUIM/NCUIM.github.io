import { describe, expect, it } from "vitest";
import { TRACK_CONFIGS, matchCisToCurriculum } from "../data/im-curriculum";
import type { CisCourse } from "../services/cis-course-api";

const mkCis = (partial: Partial<CisCourse>): CisCourse => ({
  serialNo: "1",
  classNo: "IM0000",
  name: "某課程",
  teacher: "",
  room: "",
  credit: 3,
  classTimes: [],
  classTimesAlt: "",
  status: "已選上",
  admitCnt: 0,
  limitCnt: 0,
  waitCnt: 0,
  ...partial,
});

describe("matchCisToCurriculum", () => {
  it("matches a synced course by class-code prefix", () => {
    const cis = mkCis({ classNo: "IM6003-A", name: "軟體工程Ⅰ" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.mgmt, "mgmt");
    expect(ids).toContain("IM6003");
  });

  it("matches a synced course by normalized course name", () => {
    // 括號與空白在正規化後被移除，仍可配對到「管理資訊系統」
    const cis = mkCis({ classNo: "IM0000-X", name: "管理資訊系統（五）" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.mgmt, "mgmt");
    expect(ids).toContain("IM6012");
  });

  it("returns the curriculum ids of every matched course", () => {
    const cisCourses = [
      mkCis({ classNo: "IM6003-A", name: "軟體工程Ⅰ" }),
      mkCis({ classNo: "IM6053-B", name: "多變量分析" }),
    ];
    const ids = matchCisToCurriculum(cisCourses, TRACK_CONFIGS.mgmt, "mgmt");
    expect(ids).toEqual(expect.arrayContaining(["IM6003", "IM6053"]));
  });

  it("ignores courses that belong to the other track's sections", () => {
    // 智慧商務 (IM5036) 是管理組應選修，不在 sys 課表的任何 section
    const cis = mkCis({ classNo: "IM5036", name: "智慧商務" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.sys, "sys");
    expect(ids).not.toContain("IM5036");
  });

  it("pushes IM_FREE when a sys-track IM course matches no named curriculum course", () => {
    const cis = mkCis({ classNo: "IM5036", name: "智慧商務" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.sys, "sys");
    expect(ids).toContain("IM_FREE");
  });

  it("does not push IM_FREE for the mgmt track", () => {
    const cis = mkCis({ classNo: "IM5036", name: "智慧商務" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.mgmt, "mgmt");
    expect(ids).not.toContain("IM_FREE");
  });

  it("does not push IM_FREE for sys courses already named in the curriculum", () => {
    // 企業電腦網路 (IM7071) 是 sys 組必修 — 已配對就不該算自由選修
    const cis = mkCis({ classNo: "IM7071", name: "企業電腦網路" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.sys, "sys");
    expect(ids).toContain("IM7071-s");
    expect(ids).not.toContain("IM_FREE");
  });

  it("returns an empty list when nothing matches", () => {
    const cis = mkCis({ classNo: "LA1001", name: "大一國文" });
    const ids = matchCisToCurriculum([cis], TRACK_CONFIGS.sys, "sys");
    expect(ids).toEqual([]);
  });
});
