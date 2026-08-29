import { describe, it, expect } from "vitest";
import {
  TRACK_CONFIGS,
  calculateTrackCredits,
  COMMON_REQUIRED_COURSES,
  MGMT_TRACK_REQUIRED,
  MGMT_TRACK_ELECTIVES,
  SYS_TRACK_REQUIRED,
  SYS_TRACK_ELECTIVES,
  isSystemTrackFreeElectiveCode,
} from "../data/im-curriculum";

describe("NCUIM 115 Master's Curriculum Rules", () => {
  it("should have correct target credits for Management Track (33) and IS Track (30)", () => {
    expect(TRACK_CONFIGS.mgmt.targetCredits).toBe(33);
    expect(TRACK_CONFIGS.sys.targetCredits).toBe(30);
  });

  it("should calculate 0 earned credits when no courses are selected", () => {
    const res = calculateTrackCredits("mgmt", []);
    expect(res.totalEarnedCredits).toBe(0);
    expect(res.targetCredits).toBe(33);
    expect(res.progressPercentage).toBe(0);
    expect(res.isGraduationEligible).toBe(false);
  });

  it("should accurately calculate Management Track full completion (12 common + 12 req + 9 elect = 33)", () => {
    const selectedIds = [
      // 5 Common Required (12 cr)
      ...COMMON_REQUIRED_COURSES.map((c) => c.id),
      // Multivariate (3 cr) + 3 from 6 (9 cr) = 12 cr
      MGMT_TRACK_REQUIRED[0].id,
      MGMT_TRACK_REQUIRED[1].id,
      MGMT_TRACK_REQUIRED[2].id,
      MGMT_TRACK_REQUIRED[3].id,
      // 3 Electives (9 cr)
      MGMT_TRACK_ELECTIVES[0].id,
      MGMT_TRACK_ELECTIVES[1].id,
      MGMT_TRACK_ELECTIVES[2].id,
    ];

    const res = calculateTrackCredits("mgmt", selectedIds);
    expect(res.totalEarnedCredits).toBe(33);
    expect(res.progressPercentage).toBe(100);
    expect(res.isGraduationEligible).toBe(true);
    expect(res.sectionResults["common-req"].isMet).toBe(true);
    expect(res.sectionResults["mgmt-req"].isMet).toBe(true);
    expect(res.sectionResults["mgmt-elect"].isMet).toBe(true);
  });

  it("should accurately calculate IS Track full completion (12 common + 6 req + 9 elect + 3 free = 30)", () => {
    const selectedIds = [
      // 5 Common Required (12 cr)
      ...COMMON_REQUIRED_COURSES.map((c) => c.id),
      // 2 Track Required (6 cr)
      SYS_TRACK_REQUIRED[0].id,
      SYS_TRACK_REQUIRED[1].id,
      // 3 Electives (9 cr)
      SYS_TRACK_ELECTIVES[0].id,
      SYS_TRACK_ELECTIVES[1].id,
      SYS_TRACK_ELECTIVES[2].id,
      // 1 Free Elective (3 cr)
      "IM_FREE",
    ];

    const res = calculateTrackCredits("sys", selectedIds);
    expect(res.totalEarnedCredits).toBe(30);
    expect(res.progressPercentage).toBe(100);
    expect(res.isGraduationEligible).toBe(true);
    expect(res.sectionResults["common-req"].isMet).toBe(true);
    expect(res.sectionResults["sys-req"].isMet).toBe(true);
    expect(res.sectionResults["sys-elect"].isMet).toBe(true);
    expect(res.sectionResults["sys-free"].isMet).toBe(true);
  });

  it("should not count prerequisite courses into graduation credit total", () => {
    const selectedIds = ["pre-db", "pre-sa", "pre-econ", "pre-acct"];
    const res = calculateTrackCredits("mgmt", selectedIds);
    expect(res.totalEarnedCredits).toBe(0);
  });

  it("should recognize unmatched IM graduate courses as system-track free electives", () => {
    expect(isSystemTrackFreeElectiveCode("IM5033")).toBe(true);
    expect(isSystemTrackFreeElectiveCode("IM6055")).toBe(true);
    expect(isSystemTrackFreeElectiveCode("CSIE5001")).toBe(false);
  });

  it("should mark Management Track as NOT graduation eligible if Multivariate Analysis is missing even with 50+ credits", () => {
    const selectedIds = [
      // 5 Common Required (12 cr)
      ...COMMON_REQUIRED_COURSES.map((c) => c.id),
      // All 6 other management courses (18 cr) BUT NO Multivariate (IM6053)!
      "IM6014",
      "IM7071",
      "IM6041",
      "IM6082",
      "IM6069",
      "IM7065",
      // All 12 Electives (36 cr)
      ...MGMT_TRACK_ELECTIVES.map((c) => c.id),
    ];

    const res = calculateTrackCredits("mgmt", selectedIds);
    expect(res.totalEarnedCredits).toBeGreaterThanOrEqual(33);
    // Because IM6053 is missing, mgmt-req isMet must be FALSE and cannot graduate!
    expect(res.sectionResults["mgmt-req"].isMet).toBe(false);
    expect(res.sectionResults["mgmt-req"].hint).toContain("多變量分析");
    expect(res.isGraduationEligible).toBe(false);
  });

  it("should mark IS Track as NOT graduation eligible if Enterprise Computer Network is missing even with 50+ credits", () => {
    const selectedIds = [
      // 5 Common Required (12 cr)
      ...COMMON_REQUIRED_COURSES.map((c) => c.id),
      // All 4 other management courses (12 cr) BUT NO Network (IM7071-s)!
      "IM6041-s",
      "IM6082-s",
      "IM6069-s",
      "IM7065-s",
      // All 9 Electives (27 cr)
      ...SYS_TRACK_ELECTIVES.map((c) => c.id),
    ];

    const res = calculateTrackCredits("sys", selectedIds);
    expect(res.totalEarnedCredits).toBeGreaterThanOrEqual(30);
    // Because IM7071-s is missing, sys-req isMet must be FALSE and cannot graduate!
    expect(res.sectionResults["sys-req"].isMet).toBe(false);
    expect(res.sectionResults["sys-req"].hint).toContain("企業電腦網路");
    expect(res.isGraduationEligible).toBe(false);
  });
});
