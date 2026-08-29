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
  {
    id: "IM6003",
    code: "IM6003",
    name: "軟體工程",
    credits: 3,
    semester: "一上",
    schedule: "週三 6、7、8 節",
  },
  {
    id: "IM6012",
    code: "IM6012",
    name: "管理資訊系統",
    credits: 3,
    semester: "一上",
    schedule: "週一 5、6、7 節",
  },
  {
    id: "IM6016",
    code: "IM6016",
    name: "研究方法",
    credits: 3,
    semester: "一下",
    schedule: "週三 6、7、8 節",
  },
  {
    id: "IM5019",
    code: "IM5019",
    name: "管理溝通",
    credits: 2,
    semester: "二上",
    schedule: "週四 2、3、4 節",
  },
  {
    id: "IM5026",
    code: "IM5026",
    name: "書報研討",
    credits: 1,
    semester: "二下",
    schedule: "週二 A、B、C 節",
  },
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
  {
    id: "IM6053",
    code: "IM6053",
    name: "多變量分析",
    credits: 3,
    semester: "上",
    schedule: "週三 2、3、4 節",
    note: "必修",
  },
  {
    id: "IM6014",
    code: "IM6014",
    name: "企業策略",
    credits: 3,
    semester: "下",
    schedule: "週三 2、3、4 節",
    note: "六選三 (9學分)",
  },
  {
    id: "IM7071",
    code: "IM7071",
    name: "企業電腦網路",
    credits: 3,
    semester: "上",
    schedule: "週二 6、7、8 節",
    note: "六選三 (9學分)",
  },
  {
    id: "IM6041",
    code: "IM6041",
    name: "生產與作業管理",
    credits: 3,
    semester: "上",
    schedule: "週一 2、3、4 節",
    note: "六選三 (9學分)",
  },
  {
    id: "IM6082",
    code: "IM6082",
    name: "行銷管理",
    credits: 3,
    semester: "一上",
    schedule: "週四 2、3、4 節",
    note: "六選三 (9學分)",
  },
  {
    id: "IM6069",
    code: "IM6069",
    name: "財務管理",
    credits: 3,
    semester: "下",
    schedule: "週一 5、6、7 節",
    note: "六選三 (9學分)",
  },
  {
    id: "IM7065",
    code: "IM7065",
    name: "人力資源管理",
    credits: 3,
    semester: "下",
    schedule: "週二 2、3、4 節",
    note: "六選三 (9學分)",
  },
];

export const MGMT_TRACK_ELECTIVES: readonly CurriculumCourse[] = [
  {
    id: "IM5001",
    code: "IM5001",
    name: "社會網路分析",
    credits: 3,
    semester: "上",
    schedule: "週五 2、3、4 節",
  },
  {
    id: "IM5021-m",
    code: "IM5021",
    name: "智慧醫療",
    credits: 3,
    semester: "上",
    schedule: "週一 6、7、8 節",
  },
  {
    id: "IM6103",
    code: "IM6103",
    name: "網路經濟與賽局智慧",
    credits: 3,
    semester: "上",
    schedule: "週四 5、6、7 節",
  },
  {
    id: "IM6002",
    code: "IM6002",
    name: "資訊系統專案管理",
    credits: 3,
    semester: "上",
    schedule: "週四 5、6、7 節",
  },
  {
    id: "IM5009",
    code: "IM5009",
    name: "資訊經濟學導論",
    credits: 3,
    semester: "下",
    schedule: "週一 2、3、4 節",
  },
  {
    id: "IM5020",
    code: "IM5020",
    name: "創新管理專題",
    credits: 3,
    semester: "下",
    schedule: "週四 5、6、7 節",
  },
  {
    id: "IM5023",
    code: "IM5023",
    name: "數位品牌管理",
    credits: 3,
    semester: "下",
    schedule: "週一 2、3、4 節",
  },
  {
    id: "IM5036",
    code: "IM5036",
    name: "智慧商務",
    credits: 3,
    semester: "下",
    schedule: "週一 5、6、7 節",
  },
  {
    id: "IM6100",
    code: "IM6100",
    name: "顧客關係管理",
    credits: 3,
    semester: "下",
    schedule: "週四 2、3、4 節",
  },
  {
    id: "IM6102",
    code: "IM6102",
    name: "產業組織與智慧企業",
    credits: 3,
    semester: "下",
    schedule: "週四 5、6、7 節",
  },
  {
    id: "IM7036",
    code: "IM7036",
    name: "定性研究法",
    credits: 3,
    semester: "下",
    schedule: "週四 5、6、7 節",
  },
  {
    id: "MT6011-m",
    code: "MT6011-MT6019",
    name: "企業實習",
    credits: 3,
    semester: "上/下",
    note: "管院實習最多認列 3 學分",
  },
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
  {
    id: "IM7071-s",
    code: "IM7071",
    name: "企業電腦網路",
    credits: 3,
    semester: "上",
    schedule: "週二 6、7、8 節",
    note: "必修 (3學分)",
  },
  {
    id: "IM6041-s",
    code: "IM6041",
    name: "生產與作業管理",
    credits: 3,
    semester: "上",
    schedule: "週一 2、3、4 節",
    note: "管理課程四選一 (3學分)",
  },
  {
    id: "IM6082-s",
    code: "IM6082",
    name: "行銷管理",
    credits: 3,
    semester: "一上",
    schedule: "週四 2、3、4 節",
    note: "管理課程四選一 (3學分)",
  },
  {
    id: "IM6069-s",
    code: "IM6069",
    name: "財務管理",
    credits: 3,
    semester: "下",
    schedule: "週一 5、6、7 節",
    note: "管理課程四選一 (3學分)",
  },
  {
    id: "IM7065-s",
    code: "IM7065",
    name: "人力資源管理",
    credits: 3,
    semester: "下",
    schedule: "週二 2、3、4 節",
    note: "管理課程四選一 (3學分)",
  },
];

export const SYS_TRACK_ELECTIVES: readonly CurriculumCourse[] = [
  {
    id: "IM5008",
    code: "IM5008",
    name: "商業智慧",
    credits: 3,
    semester: "上",
    schedule: "週五 2、3、4 節",
  },
  {
    id: "IM5022",
    code: "IM5022",
    name: "多媒體資料庫",
    credits: 3,
    semester: "上",
    schedule: "週四 6、7、8 節",
  },
  {
    id: "IM5038",
    code: "IM5038",
    name: "進階區塊鏈應用與隱私防護",
    credits: 3,
    semester: "上",
    schedule: "週三 2、3、4 節",
  },
  {
    id: "IM6055",
    code: "IM6055",
    name: "電腦網路安全",
    credits: 3,
    semester: "上",
    schedule: "週五 6、7、8 節",
  },
  {
    id: "IM5041",
    code: "IM5041",
    name: "現代與後量子密碼學導論",
    credits: 3,
    semester: "上",
    schedule: "週五 2、3、4 節",
  },
  {
    id: "IM5002",
    code: "IM5002",
    name: "電子商務技術",
    credits: 3,
    semester: "下",
    schedule: "週一 2、3、4 節",
  },
  {
    id: "IM5012",
    code: "IM5012",
    name: "行動網路技術與應用",
    credits: 3,
    semester: "下",
    schedule: "週四 2、3、4 節",
  },
  {
    id: "IM5021-s",
    code: "IM5021",
    name: "智慧醫療",
    credits: 3,
    semester: "下",
    schedule: "週四 6、7、8 節",
  },
  {
    id: "IM5030",
    code: "IM5030",
    name: "軟體流程與專案管理",
    credits: 3,
    semester: "下",
    schedule: "週三 2、3、4 節",
  },
];

export const SYS_TRACK_FREE_ELECTIVES: readonly CurriculumCourse[] = [
  {
    id: "IM_FREE",
    code: "IM5xxx-IM7xxx",
    name: "資管所其他選修課程",
    credits: 3,
    semester: "上/下",
    note: "IM 開頭之研究所課程 (需 3 學分)",
  },
  {
    id: "MT6011-s",
    code: "MT6011-MT6019",
    name: "企業實習",
    credits: 3,
    semester: "上/下",
    note: "管院實習最多認列 3 學分",
  },
];

/** IM graduate courses not already named in the system-track curriculum count here. */
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
  if (track === "mgmt") {
    // ── 管理組 (33 學分) ──────────────────────────
    // 組必修：多變量分析 (必修 3) + 粗框六選三 (9) = 12
    const hasMultivariate = selectedCourseIds.includes("IM6053");
    const mgmt6Options = [
      "IM6014",
      "IM7071",
      "IM6041",
      "IM6082",
      "IM6069",
      "IM7065",
    ];
    const selected6Count = mgmt6Options.filter((id) =>
      selectedCourseIds.includes(id),
    ).length;

    const mgmtReqEarned =
      (hasMultivariate ? 3 : 0) + Math.min(9, selected6Count * 3);
    const mgmtReqIsMet = hasMultivariate && selected6Count >= 3;

    let mgmtReqHint: string | undefined;
    if (!mgmtReqIsMet) {
      if (!hasMultivariate && selected6Count < 3) {
        mgmtReqHint = `缺「多變量分析」且六選三尚缺 ${3 - selected6Count} 門`;
      } else if (!hasMultivariate) {
        mgmtReqHint = "必修「多變量分析」尚未修習";
      } else {
        mgmtReqHint = `六選三尚缺 ${3 - selected6Count} 門`;
      }
    }

    sectionResults["mgmt-req"] = {
      earned: mgmtReqEarned,
      target: 12,
      isMet: mgmtReqIsMet,
      hint: mgmtReqHint,
    };

    // 組應選修：十二選三 (9 學分) + 六選三溢出的學分
    const mgmtElectSelected = MGMT_TRACK_ELECTIVES.filter((c) =>
      selectedCourseIds.includes(c.id),
    );
    const mgmtElectDirect = mgmtElectSelected.reduce((sum, c) => sum + c.credits, 0);
    const mgmtOverflow = Math.max(0, (selected6Count - 3) * 3);
    const mgmtElectEarned = mgmtElectDirect + mgmtOverflow;
    const mgmtElectIsMet = mgmtElectEarned >= 9;

    sectionResults["mgmt-elect"] = {
      earned: mgmtElectEarned,
      target: 9,
      isMet: mgmtElectIsMet,
      hint: mgmtElectIsMet ? undefined : `尚缺 ${9 - mgmtElectEarned} 學分`,
    };
  } else {
    // ── 資訊系統組 (30 學分) ──────────────────────
    // 組必修：企業電腦網路 (必修 3) + 粗框四選一 (3) = 6
    const hasNetwork = selectedCourseIds.includes("IM7071-s");
    const sys4Options = [
      "IM6041-s",
      "IM6082-s",
      "IM6069-s",
      "IM7065-s",
    ];
    const selected4Count = sys4Options.filter((id) =>
      selectedCourseIds.includes(id),
    ).length;

    const sysReqEarned =
      (hasNetwork ? 3 : 0) + Math.min(3, selected4Count * 3);
    const sysReqIsMet = hasNetwork && selected4Count >= 1;

    let sysReqHint: string | undefined;
    if (!sysReqIsMet) {
      if (!hasNetwork && selected4Count === 0) {
        sysReqHint = "缺「企業電腦網路」且管理課程四選一尚未修習";
      } else if (!hasNetwork) {
        sysReqHint = "必修「企業電腦網路」尚未修習";
      } else {
        sysReqHint = "管理課程四選一尚未修習";
      }
    }

    sectionResults["sys-req"] = {
      earned: sysReqEarned,
      target: 6,
      isMet: sysReqIsMet,
      hint: sysReqHint,
    };

    // 組應選修：九選三 (9 學分)
    const sysElectSelected = SYS_TRACK_ELECTIVES.filter((c) =>
      selectedCourseIds.includes(c.id),
    );
    const sysElectEarned = sysElectSelected.reduce((sum, c) => sum + c.credits, 0);
    const sysElectIsMet = sysElectEarned >= 9;

    sectionResults["sys-elect"] = {
      earned: sysElectEarned,
      target: 9,
      isMet: sysElectIsMet,
      hint: sysElectIsMet ? undefined : `尚缺 ${9 - sysElectEarned} 學分`,
    };

    // 組選修：IM 研究所課程 / 實習 (3 學分) + 溢出學分
    const sysFreeSelected = SYS_TRACK_FREE_ELECTIVES.filter((c) =>
      selectedCourseIds.includes(c.id),
    );
    const sysFreeDirect = sysFreeSelected.reduce((sum, c) => sum + c.credits, 0);
    const sys4Overflow = Math.max(0, (selected4Count - 1) * 3);
    const sysElectOverflow = Math.max(0, sysElectEarned - 9);
    const sysFreeEarned = sysFreeDirect + sys4Overflow + sysElectOverflow;
    const sysFreeIsMet = sysFreeEarned >= 3;

    sectionResults["sys-free"] = {
      earned: sysFreeEarned,
      target: 3,
      isMet: sysFreeIsMet,
      hint: sysFreeIsMet ? undefined : `尚缺 ${3 - sysFreeEarned} 學分`,
    };
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
