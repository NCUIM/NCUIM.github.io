/**
 * NCUIM Announcements Service
 * Fetches and parses announcements published via GitHub Issues (with SWR caching and fallback).
 */

export type AnnouncementCategory =
  | "all"
  | "course"
  | "event"
  | "department"
  | "career"
  | "system"
  | "general";

export type AnnouncementPriority = "urgent" | "high" | "normal" | "low";

export interface AnnouncementItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly role: string;
  readonly date: string;
  readonly category: AnnouncementCategory;
  readonly priority: AnnouncementPriority;
  readonly actionUrl?: string;
  readonly milestone?: {
    readonly title: string;
    readonly dueOn?: string;
  };
  readonly htmlUrl?: string;
  readonly badge?: string;
  readonly isStatic?: boolean;
}

export const CATEGORY_LABELS: Record<AnnouncementCategory, { label: string; icon: string }> = {
  all: { label: "全部", icon: "✨" },
  course: { label: "選課學分", icon: "📚" },
  event: { label: "迎新活動", icon: "🎪" },
  department: { label: "系所行政", icon: "🏛️" },
  career: { label: "獎助職涯", icon: "💼" },
  system: { label: "系統通知", icon: "🛠️" },
  general: { label: "一般公告", icon: "📢" },
};

export const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  { label: string; badgeColor: string; icon: string; order: number }
> = {
  urgent: { label: "緊急置頂", badgeColor: "#ef4444", icon: "🚨", order: 4 },
  high: { label: "重要提醒", badgeColor: "#f97316", icon: "🔴", order: 3 },
  normal: { label: "一般通知", badgeColor: "#3b82f6", icon: "🟡", order: 2 },
  low: { label: "參考資訊", badgeColor: "#64748b", icon: "🟢", order: 1 },
};

export const BUILTIN_ANNOUNCEMENTS: readonly AnnouncementItem[] = [
  {
    id: "rep-welcome-2026",
    title: "所代阿駿對新生們的期盼",
    author: "阿駿",
    role: "資管所所代",
    date: "2026/09/01",
    category: "general",
    priority: "normal",
    badge: "所代的話",
    content:
      "歡迎各位加入中央資管大家庭！研究所這兩年不僅是專業知識與研究能力的深化，更是探索熱情、結識一生摯友與夥伴的寶貴旅程。期許大家勇於發問、主動跨出舒適圈，在遇到學業與研究挑戰時彼此扶持、共同成長。願大家在中央資管發光發熱，收穫最充實而難忘的碩士生涯！",
    isStatic: true,
  },
];

const GITHUB_REPO_API =
  "https://api.github.com/repos/ncuim-github-io/NCUIM2026-Fresher/issues?labels=announcement&state=open&sort=created&direction=desc";
const CACHE_STORAGE_KEY = "ncuim_announcements_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface GitHubLabel {
  name: string;
}

interface GitHubMilestone {
  title: string;
  due_on?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: (string | GitHubLabel)[];
  milestone?: GitHubMilestone | null;
  user?: {
    login: string;
  } | null;
}

/**
 * Extracts form field section value from GitHub Issue Form markdown body.
 */
export const extractFormField = (body: string, headerRegex: RegExp): string => {
  const match = body.match(headerRegex);
  if (!match || match.index === undefined) return "";
  const afterHeader = body.slice(match.index + match[0].length);
  const nextSectionIndex = afterHeader.search(/\n###\s+/);
  const sectionContent =
    nextSectionIndex === -1 ? afterHeader : afterHeader.slice(0, nextSectionIndex);
  return sectionContent.trim();
};

/**
 * Parses raw GitHub issue object into typed AnnouncementItem.
 */
export const parseGitHubIssue = (issue: GitHubIssue): AnnouncementItem => {
  const rawBody = issue.body || "";
  const labelNames = issue.labels.map((l) => (typeof l === "string" ? l : l.name).toLowerCase());

  // Category resolution
  let category: AnnouncementCategory = "general";
  if (labelNames.some((l) => l.includes("course") || l.includes("選課") || l.includes("學分"))) {
    category = "course";
  } else if (labelNames.some((l) => l.includes("event") || l.includes("迎新") || l.includes("活動"))) {
    category = "event";
  } else if (labelNames.some((l) => l.includes("department") || l.includes("系所") || l.includes("行政"))) {
    category = "department";
  } else if (labelNames.some((l) => l.includes("career") || l.includes("獎助") || l.includes("職涯"))) {
    category = "career";
  } else if (labelNames.some((l) => l.includes("system") || l.includes("系統") || l.includes("維護"))) {
    category = "system";
  }

  // Priority resolution
  let priority: AnnouncementPriority = "normal";
  if (labelNames.some((l) => l.includes("urgent") || l.includes("緊急"))) {
    priority = "urgent";
  } else if (labelNames.some((l) => l.includes("high") || l.includes("重要"))) {
    priority = "high";
  } else if (labelNames.some((l) => l.includes("low") || l.includes("參考"))) {
    priority = "low";
  }

  // Author & Role
  const parsedAuthorRole = extractFormField(
    rawBody,
    /###\s+(?:發布單位與署名|Author\s*&\s*Role)[^\n]*/i,
  );
  let author = issue.user?.login || "資管通團隊";
  let role = "系所公告";
  if (parsedAuthorRole) {
    if (parsedAuthorRole.includes("·")) {
      const parts = parsedAuthorRole.split("·");
      role = parts[0]?.trim() || role;
      author = parts[1]?.trim() || author;
    } else if (parsedAuthorRole.includes("/")) {
      const parts = parsedAuthorRole.split("/");
      role = parts[0]?.trim() || role;
      author = parts[1]?.trim() || author;
    } else {
      author = parsedAuthorRole;
    }
  }

  // Content
  const parsedContent = extractFormField(
    rawBody,
    /###\s+(?:公告內文|Content)[^\n]*/i,
  );
  const content = parsedContent || rawBody;

  // Action URL
  const actionUrlRaw = extractFormField(
    rawBody,
    /###\s+(?:相關連結|Action\s*URL)[^\n]*/i,
  );
  const actionUrl =
    actionUrlRaw && actionUrlRaw.startsWith("http") && actionUrlRaw !== "_No response_"
      ? actionUrlRaw
      : undefined;

  // Date formatting (YYYY/MM/DD)
  const d = new Date(issue.created_at);
  const dateStr = !isNaN(d.getTime())
    ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
    : "近期";

  // Clean title (strips [公告] or [Announcement] prefixes for crisp presentation)
  const cleanTitle = issue.title
    .replace(/^(?:[\u{1F300}-\u{1FAFF}]\s*)?\[(?:公告|Announcement)\]\s*/iu, "")
    .trim();

  return {
    id: `gh-issue-${issue.number}`,
    title: cleanTitle || issue.title,
    content,
    author,
    role,
    date: dateStr,
    category,
    priority,
    actionUrl,
    milestone: issue.milestone
      ? {
          title: issue.milestone.title,
          dueOn: issue.milestone.due_on
            ? issue.milestone.due_on.slice(0, 10).replace(/-/g, "/")
            : undefined,
        }
      : undefined,
    htmlUrl: issue.html_url,
    isStatic: false,
  };
};

/**
 * Sorts announcements primarily by Priority order (Urgent > High > Normal > Low), then by Date descending.
 */
export const sortAnnouncements = (items: readonly AnnouncementItem[]): AnnouncementItem[] => {
  return [...items].sort((a, b) => {
    const pA = PRIORITY_CONFIG[a.priority]?.order || 0;
    const pB = PRIORITY_CONFIG[b.priority]?.order || 0;
    if (pA !== pB) {
      return pB - pA; // Higher priority first
    }
    return b.date.localeCompare(a.date);
  });
};

/**
 * Fetches announcements from GitHub API with localStorage cache fallback.
 */
export const fetchAnnouncements = async (
  options?: { forceRefresh?: boolean },
): Promise<AnnouncementItem[]> => {
  // 1. Check local cache
  if (!options?.forceRefresh && typeof window !== "undefined" && window.localStorage) {
    try {
      const cachedRaw = window.localStorage.getItem(CACHE_STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS && Array.isArray(cached.data)) {
          return sortAnnouncements(cached.data);
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  // 2. Fetch from GitHub REST API
  try {
    const res = await fetch(GITHUB_REPO_API, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`);
    }

    const issues: GitHubIssue[] = await res.json();
    if (Array.isArray(issues)) {
      const parsed = issues
        .filter((issue) => !issue.title.includes("[TEMPLATE]") && issue.body !== null)
        .map(parseGitHubIssue);

      const all = [...parsed, ...BUILTIN_ANNOUNCEMENTS];
      const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());
      const sorted = sortAnnouncements(unique);

      // Cache result
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: sorted }),
          );
        } catch {
          // Ignore cache write errors
        }
      }

      return sorted;
    }
  } catch {
    // 3. Fallback on network/rate-limit error: Use cached data if available, else static builtin
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const cachedRaw = window.localStorage.getItem(CACHE_STORAGE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached.data) && cached.data.length > 0) {
            return sortAnnouncements(cached.data);
          }
        }
      } catch {
        // Fallback to builtin
      }
    }
  }

  return sortAnnouncements(BUILTIN_ANNOUNCEMENTS);
};
