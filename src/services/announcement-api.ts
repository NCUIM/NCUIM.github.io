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

export const BUILTIN_ANNOUNCEMENTS: readonly AnnouncementItem[] = [];

const GITHUB_REPO_API =
  "https://api.github.com/repos/NCUIM/NCUIM.github.io/issues?labels=announcement&state=open&sort=created&direction=desc";
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

const KNOWN_SECTION_PATTERN =
  /\n###\s+(?:公告類別|Category|重要程度|Priority|發布單位與署名|Author|公告內文|Content|相關連結|Action\s*URL)/i;

/**
 * Extracts form field section value from GitHub Issue Form markdown body.
 */
export const extractFormField = (body: string, headerRegex: RegExp): string => {
  const match = headerRegex.exec(body);
  if (match?.index === undefined) return "";
  const afterHeader = body.slice(match.index + match[0].length);
  const nextSectionIndex = afterHeader.search(KNOWN_SECTION_PATTERN);
  const sectionContent =
    nextSectionIndex === -1 ? afterHeader : afterHeader.slice(0, nextSectionIndex);
  return sectionContent.trim();
};

const resolveCategory = (labels: string[], formCategory: string): AnnouncementCategory => {
  const match = (kw: string) => labels.some((l) => l.includes(kw)) || formCategory.includes(kw);
  if (match("course") || match("選課") || match("學分")) return "course";
  if (match("event") || match("迎新") || match("活動")) return "event";
  if (match("department") || match("系所") || match("行政")) return "department";
  if (match("career") || match("獎助") || match("職涯")) return "career";
  if (match("system") || match("系統") || match("維護")) return "system";
  return "general";
};

const resolvePriority = (labels: string[], formPriority: string): AnnouncementPriority => {
  const match = (kw: string) => labels.some((l) => l.includes(kw)) || formPriority.includes(kw);
  if (match("urgent") || match("緊急")) return "urgent";
  if (match("high") || match("重要")) return "high";
  if (match("low") || match("參考")) return "low";
  return "normal";
};

const resolveAuthorRole = (
  rawBody: string,
  defaultAuthor: string,
): { author: string; role: string } => {
  const parsed = extractFormField(
    rawBody,
    /###\s+(?:發布單位與署名|Author\s*&\s*Role)[^\n]*/i,
  );
  let author = defaultAuthor;
  let role = "系所公告";

  if (parsed) {
    let separator: string | null = null;
    if (parsed.includes("·")) {
      separator = "·";
    } else if (parsed.includes("/")) {
      separator = "/";
    }

    if (separator) {
      const parts = parsed.split(separator);
      role = parts[0]?.trim() || role;
      author = parts[1]?.trim() || author;
    } else {
      author = parsed;
    }
  }

  return { author, role };
};

const formatAnnouncementDate = (isoString: string): string => {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "近期";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${m}/${day}`;
};

/**
 * Parses raw GitHub issue object into typed AnnouncementItem.
 */
export const parseGitHubIssue = (issue: GitHubIssue): AnnouncementItem => {
  const rawBody = issue.body || "";
  const labelNames = issue.labels.map((l) => (typeof l === "string" ? l : l.name).toLowerCase());

  const formCategory = extractFormField(rawBody, /###\s+(?:公告類別|Category)[^\n]*/i).toLowerCase();
  const category = resolveCategory(labelNames, formCategory);

  const formPriority = extractFormField(rawBody, /###\s+(?:重要程度|Priority)[^\n]*/i).toLowerCase();
  const priority = resolvePriority(labelNames, formPriority);

  const { author, role } = resolveAuthorRole(rawBody, issue.user?.login || "資管通團隊");

  const parsedContent = extractFormField(rawBody, /###\s+(?:公告內文|Content)[^\n]*/i);
  const content = parsedContent || rawBody;

  const actionUrlRaw = extractFormField(rawBody, /###\s+(?:相關連結|Action\s*URL)[^\n]*/i);
  const actionUrl =
    actionUrlRaw && actionUrlRaw.startsWith("http") && actionUrlRaw !== "_No response_"
      ? actionUrlRaw
      : undefined;

  const dateStr = formatAnnouncementDate(issue.created_at);

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
      return pB - pA;
    }
    return b.date.localeCompare(a.date);
  });
};

const readCache = (): AnnouncementItem[] | null => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS && Array.isArray(cached.data)) {
      return sortAnnouncements(cached.data);
    }
  } catch {
    // Ignore cache read error
  }
  return null;
};

const writeCache = (data: AnnouncementItem[]): void => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch {
    // Ignore cache write error
  }
};

/**
 * Fetches announcements from GitHub API with localStorage cache fallback.
 */
export const fetchAnnouncements = async (
  options?: { forceRefresh?: boolean },
): Promise<AnnouncementItem[]> => {
  if (!options?.forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  try {
    const res = await fetch(GITHUB_REPO_API, {
      headers: { Accept: "application/vnd.github.v3+json" },
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
      writeCache(sorted);
      return sorted;
    }
  } catch {
    const cached = readCache();
    if (cached && cached.length > 0) return cached;
  }

  return sortAnnouncements(BUILTIN_ANNOUNCEMENTS);
};
