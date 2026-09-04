/**
 * NCU IM Master's Degree (115 碩士班) Curriculum & Graduation Requirements
 * 
 * Rules:
 * - Common Required: 12 credits (Software Engineering 3, MIS 3, Research Methods 3, Mgmt Comm 2, Seminar 1)
 * - Management Track: 33 credits
 *   - Prereq (0 cr): Econ 3, Acct 3, Stat 3 (choose 2)
 *   - Track Required (12 cr): Multivariate 3 + Choose 3 from 6 (Strategy, Network, Prod, Mkt, Fin, HR) = 9 cr
 *   - Track Elective (9 cr): Choose 3 from 12 (SNA, Health, Game, SPM, Econ Intro, Innov, Brand, Biz, CRM, Intel Biz, Qual, Intern)
 * - IS Track: 30 credits
 *   - Prereq (0 cr): Prog Lang 6, Data Struct 3
 *   - Track Required (6 cr): Computer Network (3 cr) + Choose 1 from 4 (Prod, Mkt, Fin, HR) = 3 cr
 *   - Track Elective (9 cr): Choose 3 from 9 (BI, Multimedia, Blockchain, CyberSec, Crypto, EC, Mobile, Health, SWE Process)
 *   - Free Elective (3 cr): IM graduate course or MT internship (max 3 cr)
 */

import type { CisCourse } from "../services/cis-course-api";

export type TrackType = "mgmt" | "sys";

export interface CurriculumCourse {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly credits: number;
  readonly semester: "一上" | "一下" | "二上" | "二下" | "上" | "下" | "上/下";
  readonly schedule?: string;
  readonly note?: string;
}

export interface PrereqCourse {
  readonly id: string;
  readonly category: "所先修" | "組先修";
  readonly name: string;
  readonly note?: string;
}

export interface CurriculumSection {
  readonly id: string;
  readonly title: string;
  readonly requiredCredits: number;
  readonly description?: string;
  readonly courses: readonly CurriculumCourse[];
}

export interface TrackCurriculum {
  readonly track: TrackType;
  readonly trackName: string;
  readonly targetCredits: number;
  readonly prereqSummary: string;
  readonly sections: readonly CurriculumSection[];
  readonly prereqs: {
    readonly common: readonly PrereqCourse[];
    readonly track: readonly PrereqCourse[];
  };
}

// ── Compact Course Builder ────────────────────────────────────
// Reduces structural duplication in course data definitions.
// Format: [id, code, name, credits, semester, schedule?, note?]
type CourseTuple = readonly [
  id: string, code: string, name: string,
  credits: number, semester: CurriculumCourse["semester"],
  schedule?: string, note?: string,
];
const cc = (t: CourseTuple): CurriculumCourse => ({
  id: t[0], code: t[1], name: t[2], credits: t[3],
  semester: t[4], schedule: t[5], note: t[6],
});

// ── Common Courses (兩組共同) ──────────────────────────────────

export const COMMON_PREREQUISITES: readonly PrereqCourse[] = [
  {
    id: "pre-db",
    category: "所先修",
    name: "資料庫管理",
  },
  {
    id: "pre-sa",
    category: "所先修",
    name: "系統分析與設計",
    note: "擋修軟體工程",
  },
];

export const COMMON_REQUIRED_COURSES: readonly CurriculumCourse[] = [
  cc(["IM6003", "IM6003", "軟體工程", 3, "一上", "週三 6、7、8 節"]),
  cc(["IM6012", "IM6012", "管理資訊系統", 3, "一上", "週一 5、6、7 節"]),
  cc(["IM6016", "IM6016", "研究方法", 3, "一下", "週三 6、7、8 節"]),
  cc(["IM5019", "IM5019", "管理溝通", 2, "二上", "週四 2、3、4 節"]),
  cc(["IM5026", "IM5026", "書報研討", 1, "二下", "週二 A、B、C 節"]),
];

// ── Management Track (管理組 33 學分) ───────────────────────────

export const MGMT_PREREQUISITES: readonly PrereqCourse[] = [
  {
    id: "pre-econ",
    category: "組先修",
    name: "經濟學",
  },
  {
    id: "pre-acct",
    category: "組先修",
    name: "會計學",
  },
  {
    id: "pre-stat",
    category: "組先修",
    name: "統計學",
  },
];

export const MGMT_TRACK_REQUIRED: readonly CurriculumCourse[] = [
  cc(["IM6053", "IM6053", "多變量分析", 3, "上", "週三 2、3、4 節", "必修"]),
  cc(["IM6014", "IM6014", "企業策略", 3, "下", "週三 2、3、4 節", "六選三 (9學分)"]),
  cc(["IM7071", "IM7071", "企業電腦網路", 3, "上", "週二 6、7、8 節", "六選三 (9學分)"]),
  cc(["IM6041", "IM6041", "生產與作業管理", 3, "上", "週一 2、3、4 節", "六選三 (9學分)"]),
  cc(["IM6082", "IM6082", "行銷管理", 3, "一上", "週四 2、3、4 節", "六選三 (9學分)"]),
  cc(["IM6069", "IM6069", "財務管理", 3, "下", "週一 5、6、7 節", "六選三 (9學分)"]),
  cc(["IM7065", "IM7065", "人力資源管理", 3, "下", "週二 2、3、4 節", "六選三 (9學分)"]),
];

export const MGMT_TRACK_ELECTIVES: readonly CurriculumCourse[] = [
  cc(["IM5001", "IM5001", "社會網路分析", 3, "上", "週五 2、3、4 節"]),
  cc(["IM5021-m", "IM5021", "智慧醫療", 3, "上", "週一 6、7、8 節"]),
  cc(["IM6103", "IM6103", "網路經濟與賽局智慧", 3, "上", "週四 5、6、7 節"]),
  cc(["IM6002", "IM6002", "資訊系統專案管理", 3, "上", "週四 5、6、7 節"]),
  cc(["IM5009", "IM5009", "資訊經濟學導論", 3, "下", "週一 2、3、4 節"]),
  cc(["IM5020", "IM5020", "創新管理專題", 3, "下", "週四 5、6、7 節"]),
  cc(["IM5023", "IM5023", "數位品牌管理", 3, "下", "週一 2、3、4 節"]),
  cc(["IM5036", "IM5036", "智慧商務", 3, "下", "週一 5、6、7 節"]),
  cc(["IM6100", "IM6100", "顧客關係管理", 3, "下", "週四 2、3、4 節"]),
  cc(["IM6102", "IM6102", "產業組織與智慧企業", 3, "下", "週四 5、6、7 節"]),
  cc(["IM7036", "IM7036", "定性研究法", 3, "下", "週四 5、6、7 節"]),
  cc(["MT6011-m", "MT6011-MT6019", "企業實習", 3, "上/下", undefined, "管院實習最多認列 3 學分"]),
];

// ── IS Track (資訊系統組 30 學分) ───────────────────────────────
export const SYS_PREREQUISITES: readonly PrereqCourse[] = [
  {
    id: "pre-prog",
    category: "組先修",
    name: "程式語言設計相關課程",
  },
  {
    id: "pre-ds",
    category: "組先修",
    name: "資料結構相關課程",
  },
];

export const SYS_TRACK_REQUIRED: readonly CurriculumCourse[] = [
  cc(["IM7071-s", "IM7071", "企業電腦網路", 3, "上", "週二 6、7、8 節", "必修 (3學分)"]),
  cc(["IM6041-s", "IM6041", "生產與作業管理", 3, "上", "週一 2、3、4 節", "管理課程四選一 (3學分)"]),
  cc(["IM6082-s", "IM6082", "行銷管理", 3, "一上", "週四 2、3、4 節", "管理課程四選一 (3學分)"]),
  cc(["IM6069-s", "IM6069", "財務管理", 3, "下", "週一 5、6、7 節", "管理課程四選一 (3學分)"]),
  cc(["IM7065-s", "IM7065", "人力資源管理", 3, "下", "週二 2、3、4 節", "管理課程四選一 (3學分)"]),
];

export const SYS_TRACK_ELECTIVES: readonly CurriculumCourse[] = [
  cc(["IM5008", "IM5008", "商業智慧", 3, "上", "週五 2、3、4 節"]),
  cc(["IM5022", "IM5022", "多媒體資料庫", 3, "上", "週四 6、7、8 節"]),
  cc(["IM5038", "IM5038", "進階區塊鏈應用與隱私防護", 3, "上", "週三 2、3、4 節"]),
  cc(["IM6055", "IM6055", "電腦網路安全", 3, "上", "週五 6、7、8 節"]),
  cc(["IM5041", "IM5041", "現代與後量子密碼學導論", 3, "上", "週五 2、3、4 節"]),
  cc(["IM5002", "IM5002", "電子商務技術", 3, "下", "週一 2、3、4 節"]),
  cc(["IM5012", "IM5012", "行動網路技術與應用", 3, "下", "週四 2、3、4 節"]),
  cc(["IM5021-s", "IM5021", "智慧醫療", 3, "下", "週四 6、7、8 節"]),
  cc(["IM5030", "IM5030", "軟體流程與專案管理", 3, "下", "週三 2、3、4 節"]),
];

export const SYS_TRACK_FREE_ELECTIVES: readonly CurriculumCourse[] = [
  cc(["IM_FREE", "IM5xxx-IM7xxx", "資管所其他選修課程", 3, "上/下", undefined, "IM 開頭之研究所課程 (需 3 學分)"]),
  cc(["MT6011-s", "MT6011-MT6019", "企業實習", 3, "上/下", undefined, "管院實習最多認列 3 學分"]),
];

/** IM graduate courses not already named in the system-track curriculum count here. */
export const isSystemTrackFreeElectiveCode = (code: string): boolean =>
  /^IM[5-7]\d{3}[A-Z*]?$/.test(code) || /^MT601[1-9][A-Z*]?$/.test(code);

// ── Required-Course Facts (必修事實表) ────────────────────────
// Single source of truth for which courses are required and when
// (common scope) or for which track (mgmt/sys). Derived from the
// curriculum arrays above so it can never drift from the source.

export type RequiredScope = "common" | "mgmt" | "sys";

export interface RequiredCourseFact {
  /** Curriculum course code, e.g. "IM6003". */
  readonly code: string;
  readonly scope: RequiredScope;
  /** 1 = 碩一, 2 = 碩二. Only set for common (所必修) courses. */
  readonly year?: 1 | 2;
}

/** Common-required entries carry an explicit 一上/一下/二上/二下 semester. */
const semesterToYear = (semester: CurriculumCourse["semester"]): 1 | 2 | undefined => {
  if (semester.startsWith("一")) return 1;
  if (semester.startsWith("二")) return 2;
  return undefined;
};

/**
 * True for the track-required course itself (note like "必修" / "必修 (3學分)"),
 * false for the 六選三 / 四選一 pools that share the same array.
 */
const isTrackRequiredCourse = (c: CurriculumCourse): boolean =>
  !!c.note && c.note.includes("必修") && !c.note.includes("選");

const toCommonFact = (c: CurriculumCourse): RequiredCourseFact => ({
  code: c.code,
  scope: "common",
  year: semesterToYear(c.semester),
});

const toTrackFact =
  (scope: "mgmt" | "sys") =>
  (c: CurriculumCourse): RequiredCourseFact => ({
    code: c.code,
    scope,
  });

/** Every 所必修 + 組必修 course, derived from the curriculum arrays. */
export const REQUIRED_COURSE_FACTS: readonly RequiredCourseFact[] = [
  ...COMMON_REQUIRED_COURSES.map(toCommonFact),
  ...MGMT_TRACK_REQUIRED.filter(isTrackRequiredCourse).map(toTrackFact("mgmt")),
  ...SYS_TRACK_REQUIRED.filter(isTrackRequiredCourse).map(toTrackFact("sys")),
];

/**
 * Look up a course (by classNo like "IM6003-*" / "IM5019-A" or bare code
 * like "IM6053") in the required facts. Returns null for electives and
 * for codes the curriculum does not list as required.
 */
export const getRequiredFact = (classNoOrCode: string): RequiredCourseFact | null => {
  const m = /^(IM\d{4})/.exec(classNoOrCode);
  if (!m) return null;
  return REQUIRED_COURSE_FACTS.find((f) => f.code === m[1]) ?? null;
};

/** Badge label for a required fact: 碩一/碩二必修 for common, 管必/系必 for tracks. */
export type RequiredTagLabel = "碩一必修" | "碩二必修" | "管必" | "系必";

export const requiredFactLabel = (fact: RequiredCourseFact): RequiredTagLabel => {
  switch (fact.scope) {
    case "common":
      return fact.year === 2 ? "碩二必修" : "碩一必修";
    case "mgmt":
      return "管必";
    case "sys":
      return "系必";
  }
};

// ── Graduation Gates (畢業門檻) ────────────────────────────────

export interface GraduationGate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly link?: string;
}

export const GRADUATION_GATES: readonly GraduationGate[] = [
  {
    id: "gate-ethics",
    title: "學術研究倫理課程",
    description: "學位口試前需至臺灣學術倫理教育資源中心修習完成並取得 6 小時證明。",
  },
  {
    id: "gate-english",
    title: "英文能力畢業門檻（二選一）",
    description: "通過英檢門檻標準申請免修，或修畢 2 學期「進修英文」(MT4001、MT4002)。",
  },
  {
    id: "gate-thesis",
    title: "碩士論文口試 (IM7000)",
    description: "完成全部學分與畢業門檻後，方可申請學位口試。",
  },
];

// ── Track Configuration Definitions ───────────────────────────

export const TRACK_CONFIGS: Record<TrackType, TrackCurriculum> = {
  mgmt: {
    track: "mgmt",
    trackName: "管理組",
    targetCredits: 33,
    prereqSummary: "所先修（資管/系分）+ 組先修（經會統 3 選 2，0 學分）",
    sections: [
      {
        id: "common-req",
        title: "共同必修",
        requiredCredits: 12,
        description: "全所必修共 5 門課，合計 12 學分",
        courses: COMMON_REQUIRED_COURSES,
      },
      {
        id: "mgmt-req",
        title: "組必修",
        requiredCredits: 12,
        description: "多變量分析 (必修 3 學分) + 粗框管理課程六選三 (9 學分)，合計 12 學分",
        courses: MGMT_TRACK_REQUIRED,
      },
      {
        id: "mgmt-elect",
        title: "組應選修",
        requiredCredits: 9,
        description: "組專業課程十二選三，合計 9 學分 (管院實習最多認列 3 學分)",
        courses: MGMT_TRACK_ELECTIVES,
      },
    ],
    prereqs: {
      common: COMMON_PREREQUISITES,
      track: MGMT_PREREQUISITES,
    },
  },
  sys: {
    track: "sys",
    trackName: "資訊系統組",
    targetCredits: 30,
    prereqSummary: "所先修（資管/系分）+ 組先修（程式語言 6學分、資料結構 3學分，0 學分）",
    sections: [
      {
        id: "common-req",
        title: "共同必修",
        requiredCredits: 12,
        description: "全所必修共 5 門課，合計 12 學分",
        courses: COMMON_REQUIRED_COURSES,
      },
      {
        id: "sys-req",
        title: "組必修",
        requiredCredits: 6,
        description: "企業電腦網路 (必修 3 學分) + 粗框管理課程四選一 (3 學分)，合計 6 學分",
        courses: SYS_TRACK_REQUIRED,
      },
      {
        id: "sys-elect",
        title: "組應選修",
        requiredCredits: 9,
        description: "組專業技術課程九選三，合計 9 學分",
        courses: SYS_TRACK_ELECTIVES,
      },
      {
        id: "sys-free",
        title: "組選修",
        requiredCredits: 3,
        description: "IM 開頭之研究所課程或管院企業實習，需修習 3 學分",
        courses: SYS_TRACK_FREE_ELECTIVES,
      },
    ],
    prereqs: {
      common: COMMON_PREREQUISITES,
      track: SYS_PREREQUISITES,
    },
  },
};

export interface SectionCreditResult {
  readonly earned: number;
  readonly target: number;
  readonly isMet: boolean;
  readonly hint?: string;
}

export interface CreditCalculationResult {
  readonly totalEarnedCredits: number;
  readonly targetCredits: number;
  readonly progressPercentage: number;
  readonly isGraduationEligible: boolean;
  readonly sectionResults: Record<string, SectionCreditResult>;
}

const countSelected = (ids: readonly string[], options: readonly string[]): number =>
  options.filter((id) => ids.includes(id)).length;

const sumCredits = (ids: readonly string[], courses: readonly CurriculumCourse[]): number =>
  courses.filter((c) => ids.includes(c.id)).reduce((s, c) => s + c.credits, 0);

const getMgmtReqHint = (hasMulti: boolean, cnt6: number): string | undefined => {
  if (hasMulti) {
    return cnt6 >= 3 ? undefined : `六選三尚缺 ${3 - cnt6} 門`;
  }
  return cnt6 < 3 ? `缺「多變量分析」且六選三尚缺 ${3 - cnt6} 門` : "必修「多變量分析」尚未修習";
};

const getSysReqHint = (hasNet: boolean, cnt4: number): string | undefined => {
  if (hasNet) {
    return cnt4 >= 1 ? undefined : "管理課程四選一尚未修習";
  }
  return cnt4 === 0 ? "缺「企業電腦網路」且管理課程四選一尚未修習" : "必修「企業電腦網路」尚未修習";
};

const getElectiveHint = (earned: number, target: number): string | undefined =>
  earned >= target ? undefined : `尚缺 ${target - earned} 學分`;

const calcMgmtTrackSections = (ids: readonly string[]): Record<string, SectionCreditResult> => {
  const hasMulti = ids.includes("IM6053");
  const cnt6 = countSelected(ids, ["IM6014", "IM7071", "IM6041", "IM6082", "IM6069", "IM7065"]);
  const reqMet = hasMulti && cnt6 >= 3;
  const electCr = sumCredits(ids, MGMT_TRACK_ELECTIVES) + Math.max(0, (cnt6 - 3) * 3);
  return {
    "mgmt-req": {
      earned: (hasMulti ? 3 : 0) + Math.min(9, cnt6 * 3),
      target: 12,
      isMet: reqMet,
      hint: getMgmtReqHint(hasMulti, cnt6),
    },
    "mgmt-elect": {
      earned: electCr,
      target: 9,
      isMet: electCr >= 9,
      hint: getElectiveHint(electCr, 9),
    },
  };
};

const calcSysTrackSections = (ids: readonly string[]): Record<string, SectionCreditResult> => {
  const hasNet = ids.includes("IM7071-s");
  const cnt4 = countSelected(ids, ["IM6041-s", "IM6082-s", "IM6069-s", "IM7065-s"]);
  const reqMet = hasNet && cnt4 >= 1;
  const electCr = sumCredits(ids, SYS_TRACK_ELECTIVES);
  const freeCr = sumCredits(ids, SYS_TRACK_FREE_ELECTIVES) + Math.max(0, (cnt4 - 1) * 3) + Math.max(0, electCr - 9);
  return {
    "sys-req": {
      earned: (hasNet ? 3 : 0) + Math.min(3, cnt4 * 3),
      target: 6,
      isMet: reqMet,
      hint: getSysReqHint(hasNet, cnt4),
    },
    "sys-elect": {
      earned: electCr,
      target: 9,
      isMet: electCr >= 9,
      hint: getElectiveHint(electCr, 9),
    },
    "sys-free": {
      earned: freeCr,
      target: 3,
      isMet: freeCr >= 3,
      hint: getElectiveHint(freeCr, 3),
    },
  };
};

const calcCommonReqSection = (selectedCourseIds: readonly string[]): SectionCreditResult => {
  const commonSelected = COMMON_REQUIRED_COURSES.filter((c) =>
    selectedCourseIds.includes(c.id),
  );
  const commonEarned = commonSelected.reduce((sum, c) => sum + c.credits, 0);
  const commonIsMet = commonSelected.length === COMMON_REQUIRED_COURSES.length;
  return {
    earned: commonEarned,
    target: 12,
    isMet: commonIsMet,
    hint: commonIsMet
      ? undefined
      : `尚缺 ${COMMON_REQUIRED_COURSES.length - commonSelected.length} 門所必修`,
  };
};

export const calculateTrackCredits = (
  track: TrackType,
  selectedCourseIds: readonly string[],
): CreditCalculationResult => {
  const config = TRACK_CONFIGS[track];
  const sectionResults: Record<string, SectionCreditResult> = {
    "common-req": calcCommonReqSection(selectedCourseIds),
    ...(track === "mgmt"
      ? calcMgmtTrackSections(selectedCourseIds)
      : calcSysTrackSections(selectedCourseIds)),
  };

  let totalEarned = 0;
  for (const res of Object.values(sectionResults)) {
    totalEarned += res.earned;
  }

  const progressPercentage = Math.min(
    100,
    Math.round((totalEarned / config.targetCredits) * 100),
  );

  const isGraduationEligible =
    totalEarned >= config.targetCredits &&
    Object.values(sectionResults).every((v) => v.isMet);

  return {
    totalEarnedCredits: totalEarned,
    targetCredits: config.targetCredits,
    progressPercentage,
    isGraduationEligible,
    sectionResults,
  };
};

// ── CIS ↔ Curriculum Matching ──────────────────────────────────
// Shared by CreditPage (auto-check synced history courses) and TimetablePage
// (decide whether a synced course belongs to the active track).

const NORM_RE = /[\s\-_()（）]/gu;
const norm = (s: string) => s.replace(NORM_RE, "");

const matchesCode = (cisCode?: string, courseCode?: string): boolean => {
  if (!cisCode || !courseCode) return false;
  return cisCode.includes(courseCode) || courseCode.includes(cisCode);
};

const matchesName = (cisName: string, courseName: string): boolean => {
  const [a, b] = [norm(cisName), norm(courseName)];
  return a.length >= 2 && b.length >= 2 && (a.includes(b) || b.includes(a));
};

const matchesCurriculumCourse = (cis: CisCourse, course: CurriculumCourse): boolean =>
  matchesCode(cis.classNo, course.code) || matchesName(cis.name, course.name);

const hasUnmatchedSysFreeElective = (
  cisCourses: readonly CisCourse[],
  config: (typeof TRACK_CONFIGS)[TrackType],
): boolean =>
  cisCourses.some(
    (cis) =>
      isSystemTrackFreeElectiveCode(cis.classNo) &&
      !config.sections.some((s) =>
        s.courses.some((course) => matchesCurriculumCourse(cis, course)),
      ),
  );

/**
 * Match synced CIS courses against a track's curriculum and return the ids of
 * every curriculum course the student has taken. For the sys track, a synced
 * IM course that matches no named curriculum course contributes IM_FREE.
 */
export const matchCisToCurriculum = (
  cisCourses: readonly CisCourse[],
  config: (typeof TRACK_CONFIGS)[TrackType],
  track: TrackType,
): string[] => {
  const allCourses = config.sections.flatMap((s) => s.courses);
  const ids = allCourses
    .filter((c) => cisCourses.some((cis) => matchesCurriculumCourse(cis, c)))
    .map((c) => c.id);

  if (track === "sys" && hasUnmatchedSysFreeElective(cisCourses, config)) {
    ids.push("IM_FREE");
  }
  return ids;
};
