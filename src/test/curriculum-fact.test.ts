import { describe, it, expect } from "vitest";
import {
  REQUIRED_COURSE_FACTS,
  getRequiredFact,
  requiredFactLabel,
  COMMON_REQUIRED_COURSES,
  MGMT_TRACK_REQUIRED,
  SYS_TRACK_REQUIRED,
} from "../data/im-curriculum";

describe("Required-course facts (derived from curriculum arrays)", () => {
  it("derives exactly one common fact per common-required course with the right year", () => {
    expect(REQUIRED_COURSE_FACTS.filter((f) => f.scope === "common")).toHaveLength(
      COMMON_REQUIRED_COURSES.length,
    );
    // 一上/一下 → 碩一, 二上/二下 → 碩二
    expect(getRequiredFact("IM6003")).toEqual({ code: "IM6003", scope: "common", year: 1 }); // 軟體工程 一上
    expect(getRequiredFact("IM6016")).toEqual({ code: "IM6016", scope: "common", year: 1 }); // 研究方法 一下
    expect(getRequiredFact("IM5019")).toEqual({ code: "IM5019", scope: "common", year: 2 }); // 管理溝通 二上
    expect(getRequiredFact("IM5026")).toEqual({ code: "IM5026", scope: "common", year: 2 }); // 書報研討 二下
  });

  it("derives the mgmt/sys 組必修 with the right scope", () => {
    expect(getRequiredFact("IM6053")).toEqual({ code: "IM6053", scope: "mgmt" }); // 多變量分析
    expect(getRequiredFact("IM7071")).toEqual({ code: "IM7071", scope: "sys" }); // 企業電腦網路
  });

  it("only flags the unconditional 組必修, not the 六選三/四選一 pools", () => {
    const trackScoped = REQUIRED_COURSE_FACTS.filter((f) => f.scope !== "common");
    const mgmtRequired = trackScoped.filter((f) => f.scope === "mgmt").map((f) => f.code);
    const sysRequired = trackScoped.filter((f) => f.scope === "sys").map((f) => f.code);
    // 企業電腦網路 is sys-required but only a 六選三 option for mgmt
    expect(mgmtRequired).not.toContain("IM7071");
    expect(sysRequired).toContain("IM7071");
    expect(MGMT_TRACK_REQUIRED.some((c) => c.code === "IM6053")).toBe(true);
    expect(SYS_TRACK_REQUIRED.some((c) => c.code === "IM7071")).toBe(true);
  });

  it("matches CIS-style class numbers (section suffixes) by code prefix", () => {
    expect(getRequiredFact("IM6003-*")).toEqual({ code: "IM6003", scope: "common", year: 1 });
    expect(getRequiredFact("IM5019-A")).toEqual({ code: "IM5019", scope: "common", year: 2 });
    expect(getRequiredFact("IM5019-B")).toEqual({ code: "IM5019", scope: "common", year: 2 });
  });

  it("returns null for electives and for non-existent / doctoral codes", () => {
    expect(getRequiredFact("IM7082")).toBeNull(); // 智慧型資訊系統 (選修)
    expect(getRequiredFact("IM5001-*")).toBeNull(); // 社會網路分析 (選修)
    expect(getRequiredFact("IM7043-*")).toBeNull(); // 書報研討Ⅰ (博士班, not in master's curriculum)
    expect(getRequiredFact("IM5025")).toBeNull(); // 從不存在於 CIS 的假課號
    expect(getRequiredFact("")).toBeNull();
  });

  it("produces the badge labels (碩一/碩二必修, 管必, 系必)", () => {
    expect(requiredFactLabel(getRequiredFact("IM6003")!)).toBe("碩一必修");
    expect(requiredFactLabel(getRequiredFact("IM5019")!)).toBe("碩二必修");
    expect(requiredFactLabel(getRequiredFact("IM6053")!)).toBe("管必");
    expect(requiredFactLabel(getRequiredFact("IM7071")!)).toBe("系必");
  });

  it("keeps every common fact's year consistent with its semester field", () => {
    for (const course of COMMON_REQUIRED_COURSES) {
      const fact = getRequiredFact(course.code);
      expect(fact).not.toBeNull();
      const expectedYear = course.semester.startsWith("二") ? 2 : 1;
      expect(fact!.year).toBe(expectedYear);
    }
  });
});
