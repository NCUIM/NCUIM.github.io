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
  readonly requirement: string;
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
    requirement: "3 學分",
  },
  {
    id: "pre-sa",
    category: "所先修",
    name: "系統分析與設計",
    requirement: "3 學分 (擋修軟體工程)",
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
    requirement: "3 學分",
  },
  {
    id: "pre-acct",
    category: "組先修",
    name: "會計學",
    requirement: "3 學分",
  },
  {
    id: "pre-stat",
    category: "組先修",
    name: "統計學",
    requirement: "3 學分",
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
    requirement: "6 學分",
  },
  {
    id: "pre-ds",
    category: "組先修",
    name: "資料結構相關課程",
    requirement: "3 學分",
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
// skipcq: JS-0067
export function isSystemTrackFreeElectiveCode(code: string): boolean {
  return /^IM[5-7]\d{3}[A-Z*]?$/.test(code) || /^MT601[1-9][A-Z*]?$/.test(code);
}

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

// skipcq: JS-0067
function countSelected(ids: readonly string[], options: readonly string[]): number {
  return options.filter((id) => ids.includes(id)).length;
}

// skipcq: JS-0067 JS-R1005
function calcMgmtTrackSections(selectedCourseIds: readonly string[]): Record<string, SectionCreditResult> {
  const hasMultivariate = selectedCourseIds.includes("IM6053");
  const selected6Count = countSelected(selectedCourseIds, [
    "IM6014", "IM7071", "IM6041", "IM6082", "IM6069", "IM7065",
  ]);
  const earned = (hasMultivariate ? 3 : 0) + Math.min(9, selected6Count * 3);
  const isMet = hasMultivariate && selected6Count >= 3;
  let hint: string | undefined;
  if (!isMet) {
    if (!hasMultivariate && selected6Count < 3) {
      hint = `缺「多變量分析」且六選三尚缺 ${3 - selected6Count} 門`;
    } else if (!hasMultivariate) {
      hint = "必修「多變量分析」尚未修習";
    } else {
      hint = `六選三尚缺 ${3 - selected6Count} 門`;
    }
  }
  const electCredits = MGMT_TRACK_ELECTIVES
    .filter((c) => selectedCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.credits, 0)
    + Math.max(0, (selected6Count - 3) * 3);
  const electIsMet = electCredits >= 9;
  return {
    "mgmt-req": { earned, target: 12, isMet, hint },
    "mgmt-elect": {
      earned: electCredits, target: 9, isMet: electIsMet,
      hint: electIsMet ? undefined : `尚缺 ${9 - electCredits} 學分`,
    },
  };
}

// skipcq: JS-0067 JS-R1005
function calcSysTrackSections(selectedCourseIds: readonly string[]): Record<string, SectionCreditResult> {
  const hasNetwork = selectedCourseIds.includes("IM7071-s");
  const selected4Count = countSelected(selectedCourseIds, [
    "IM6041-s", "IM6082-s", "IM6069-s", "IM7065-s",
  ]);
  const earned = (hasNetwork ? 3 : 0) + Math.min(3, selected4Count * 3);
  const isMet = hasNetwork && selected4Count >= 1;
  let hint: string | undefined;
  if (!isMet) {
    if (!hasNetwork && selected4Count === 0) {
      hint = "缺「企業電腦網路」且管理課程四選一尚未修習";
    } else if (!hasNetwork) {
      hint = "必修「企業電腦網路」尚未修習";
    } else {
      hint = "管理課程四選一尚未修習";
    }
  }
  const electCredits = SYS_TRACK_ELECTIVES
    .filter((c) => selectedCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.credits, 0);
  const electIsMet = electCredits >= 9;
  const sys4Overflow = Math.max(0, (selected4Count - 1) * 3);
  const electOverflow = Math.max(0, electCredits - 9);
  const freeCredits = SYS_TRACK_FREE_ELECTIVES
    .filter((c) => selectedCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.credits, 0) + sys4Overflow + electOverflow;
  const freeIsMet = freeCredits >= 3;
  return {
    "sys-req": { earned, target: 6, isMet, hint },
    "sys-elect": {
      earned: electCredits, target: 9, isMet: electIsMet,
      hint: electIsMet ? undefined : `尚缺 ${9 - electCredits} 學分`,
    },
    "sys-free": {
      earned: freeCredits, target: 3, isMet: freeIsMet,
      hint: freeIsMet ? undefined : `尚缺 ${3 - freeCredits} 學分`,
    },
  };
}

// skipcq: JS-0067 JS-R1005
export function calculateTrackCredits(
  track: TrackType,
  selectedCourseIds: readonly string[],
): CreditCalculationResult {
  const config = TRACK_CONFIGS[track];
  const sectionResults: Record<string, SectionCreditResult> = {};

  // 1. 共同必修檢核 (All 5 courses must be taken, 12 cr)
  const commonSelected = COMMON_REQUIRED_COURSES.filter((c) =>
    selectedCourseIds.includes(c.id),
  );
  const commonEarned = commonSelected.reduce((sum, c) => sum + c.credits, 0);
  const commonIsMet = commonSelected.length === COMMON_REQUIRED_COURSES.length;
  sectionResults["common-req"] = {
    earned: commonEarned,
    target: 12,
    isMet: commonIsMet,
    hint: commonIsMet
      ? undefined
      : `尚缺 ${COMMON_REQUIRED_COURSES.length - commonSelected.length} 門所必修`,
  };

  // 2. 組別專屬計算
  const trackSections = track === "mgmt"
    ? calcMgmtTrackSections(selectedCourseIds)
    : calcSysTrackSections(selectedCourseIds);
  for (const [id, result] of Object.entries(trackSections)) {
    sectionResults[id] = result;
  }

  // 3. 總學分與畢業資格計算
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
}
