/**
 * NCUIM Department Announcements API Service
 * Fetches real-time department news from the Cloudflare Worker proxy.
 */

export interface DepartmentNewsItem {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly tag: string;
  readonly category: string;
  readonly date?: string;
}

export interface DepartmentNewsResponse {
  readonly category: string;
  readonly page: number;
  readonly total: number;
  readonly items: readonly DepartmentNewsItem[];
}

export interface DepartmentNewsAttachment {
  readonly name: string;
  readonly url: string;
}

export interface DepartmentNewsDetail {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly contentHtml: string;
  readonly attachments: readonly DepartmentNewsAttachment[];
  readonly originalUrl: string;
}

export const DEPARTMENT_NEWS_CATEGORIES = [
  "實習與企業徵才",
  "演講訊息",
  "工讀與獎學金",
  "榮譽榜",
] as const;

export type DepartmentNewsCategory = (typeof DEPARTMENT_NEWS_CATEGORIES)[number];

export const DEPARTMENT_NEWS_CONFIG = {
  baseUrl: "https://ncuim-news-proxy.g1014308.workers.dev",
  listTtlMs: 10 * 60 * 1000, // 10 minutes
  detailTtlMs: 60 * 60 * 1000, // 60 minutes
  storagePrefix: "ncuim_news_v5_",
};

// Clean legacy caches from previous versions
try {
  if (typeof localStorage !== "undefined") {
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("ncuim_news_cache_") ||
        key.startsWith("ncuim_news_v2_") ||
        key.startsWith("ncuim_news_v3_") ||
        key.startsWith("ncuim_news_v4_")
      ) {
        localStorage.removeItem(key);
      }
    });
  }
} catch {
  // Ignore localStorage issues
}

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

function getFromCache<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(`${DEPARTMENT_NEWS_CONFIG.storagePrefix}${key}`);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - envelope.timestamp > ttl) {
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

function getStaleCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${DEPARTMENT_NEWS_CONFIG.storagePrefix}${key}`);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    return envelope.data;
  } catch {
    return null;
  }
}

function saveToCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(
      `${DEPARTMENT_NEWS_CONFIG.storagePrefix}${key}`,
      JSON.stringify(envelope)
    );
  } catch {
    // Ignore quota or private browsing issues
  }
}

export function getCachedNewsDate(id: string): string | null {
  const detail = getFromCache<DepartmentNewsDetail>(
    `detail_${id}`,
    DEPARTMENT_NEWS_CONFIG.detailTtlMs
  ) ?? getStaleCache<DepartmentNewsDetail>(`detail_${id}`);
  return detail?.date?.trim() || null;
}

export interface ParsedAnnouncementMeta {
  readonly isImportant: boolean;
  readonly topicTag: string;
  readonly cleanTitle: string;
}

const GENERIC_TAGS = new Set([
  "重要",
  "重要公告",
  "公告",
  "轉發",
  "宣傳",
  "其他",
  "一般",
]);

const NAMED_HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

/**
 * Decodes standard and numeric HTML entities into plain text in a single pass.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text.replace(
    /&(?:amp|quot|#39|apos|lt|gt|nbsp|#\d+|#x[0-9a-fA-F]+);/g,
    (match) => {
      const named = NAMED_HTML_ENTITIES[match];
      if (named !== undefined) {
        return named;
      }
      if (match.startsWith("&#x") || match.startsWith("&#X")) {
        const hex = match.slice(3, -1);
        const code = Number.parseInt(hex, 16);
        return !Number.isNaN(code) ? String.fromCodePoint(code) : match;
      }
      if (match.startsWith("&#")) {
        const dec = match.slice(2, -1);
        const code = Number.parseInt(dec, 10);
        return !Number.isNaN(code) ? String.fromCodePoint(code) : match;
      }
      return match;
    }
  );
}

const CATEGORY_TOPIC_MAP: Readonly<Record<string, string>> = {
  "實習與企業徵才": "實習徵才",
  "演講訊息": "演講講座",
  "工讀與獎學金": "獎助學金",
  "工讀獎學金": "獎助學金",
  "榮譽榜": "活動競賽",
};

const KEYWORD_TOPIC_RULES: readonly [RegExp, string][] = [
  [/實習|徵才|誠徵|招募|就業|職缺/, "實習徵才"],
  [/演講|講座|論壇|座談|讀書會|分享會/, "演講講座"],
  [/獎學金|書卷獎|研修獎|揚帆|工讀|助學/, "獎學金"],
  [/科目表|選課|課表|學分抵免|抵免|學分|專題|論文|修課|課程|選修|必修/, "課程消息"],
  [/獲獎|得獎|頒獎|榮譽|黑客松|競賽/, "活動競賽"],
  [/畢業審查|畢業審核|離校|畢業/, "畢業審查"],
  [/新生手冊|新生資訊|新生/, "新生專區"],
];

function inferTopicTagFromTitle(title: string, category?: string): string {
  for (const [regex, tag] of KEYWORD_TOPIC_RULES) {
    if (regex.test(title)) return tag;
  }
  return category === "其他活動" ? "其他動態" : "系所情報";
}

function extractBracketTags(title: string): string[] {
  const tags: string[] = [];
  let start = -1;
  let closeChar = "";

  for (let i = 0; i < title.length; i++) {
    const ch = title[i];
    if (start === -1) {
      if (ch === "【") {
        start = i + 1;
        closeChar = "】";
      } else if (ch === "[") {
        start = i + 1;
        closeChar = "]";
      }
    } else if (ch === closeChar) {
      const tag = title.slice(start, i).trim();
      if (tag) {
        tags.push(tag);
      }
      start = -1;
    }
  }

  return tags;
}

function resolveTopicTag(
  rawTitle: string,
  rawTag: string,
  category?: string
): string {
  const bracketTags = extractBracketTags(rawTitle);
  const specificBracketTag = bracketTags.find((t) => !GENERIC_TAGS.has(t));
  if (specificBracketTag) return specificBracketTag;

  if (rawTag && !GENERIC_TAGS.has(rawTag)) return rawTag;

  if (category && CATEGORY_TOPIC_MAP[category]) {
    return CATEGORY_TOPIC_MAP[category];
  }

  return inferTopicTagFromTitle(rawTitle, category);
}

function stripLeadingBrackets(text: string): string {
  let cleaned = text.trim();
  while (cleaned.startsWith("【") || cleaned.startsWith("[")) {
    const closeIdx = cleaned.startsWith("【")
      ? cleaned.indexOf("】")
      : cleaned.indexOf("]");
    if (closeIdx === -1) break;
    cleaned = cleaned.slice(closeIdx + 1).trim();
  }
  return cleaned || text;
}

/**
 * Parses announcement metadata:
 * 1. Distinguishes '重要' priority status from actual topic category
 * 2. Decodes HTML entities and strips leading brackets from title for clean display
 * 3. Identifies specific topic category badge
 */
export function parseAnnouncementMeta(
  item: Pick<DepartmentNewsItem, "title" | "tag"> & { readonly category?: string }
): ParsedAnnouncementMeta {
  const rawTitle = decodeHtmlEntities(item.title || "");
  const rawTag = decodeHtmlEntities(item.tag || "");

  const isImportant =
    rawTag.includes("重要") ||
    rawTitle.includes("【重要】") ||
    rawTitle.includes("【重要公告】") ||
    rawTitle.startsWith("重要：") ||
    rawTitle.startsWith("重要:");

  const cleanTitle = stripLeadingBrackets(rawTitle);
  const topicTag = resolveTopicTag(rawTitle, rawTag, item.category);

  return { isImportant, topicTag, cleanTitle };
}

function hydrateNewsItem(rawItem: DepartmentNewsItem): DepartmentNewsItem {
  const item: DepartmentNewsItem = {
    ...rawItem,
    title: decodeHtmlEntities(rawItem.title || ""),
    tag: decodeHtmlEntities(rawItem.tag || ""),
  };
  if (item.date) return item;
  const cachedDate = getCachedNewsDate(item.id);
  return cachedDate ? { ...item, date: cachedDate } : item;
}

/**
 * Fetch a page of department announcements by category.
 */
export async function fetchDepartmentNews(
  category: string = "實習與企業徵才",
  page: number = 1,
  forceRefresh: boolean = false
): Promise<DepartmentNewsResponse> {
  const cacheKey = `list_${encodeURIComponent(category)}_${page}`;

  if (!forceRefresh) {
    const cached = getFromCache<DepartmentNewsResponse>(
      cacheKey,
      DEPARTMENT_NEWS_CONFIG.listTtlMs
    );
    if (cached) {
      return { ...cached, items: cached.items.map(hydrateNewsItem) };
    }
  }

  const url = `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?category=${encodeURIComponent(category)}&page=${page}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`系網公告載入失敗 (HTTP ${res.status})`);
    }
    const data = (await res.json()) as DepartmentNewsResponse;

    // Hydrate items: decode HTML entities and populate date from cache if available
    const items = data.items.map(hydrateNewsItem);
    const enrichedData = { ...data, items };
    saveToCache(cacheKey, enrichedData);
    return enrichedData;
  } catch (err) {
    const fallback = getStaleCache<DepartmentNewsResponse>(cacheKey);
    if (fallback) {
      return { ...fallback, items: fallback.items.map(hydrateNewsItem) };
    }
    throw err;
  }
}

/**
 * Fetch detail of a single department announcement by id.
 */
export async function fetchDepartmentNewsDetail(
  id: string,
  forceRefresh: boolean = false
): Promise<DepartmentNewsDetail> {
  const cacheKey = `detail_${id}`;

  if (!forceRefresh) {
    const cached = getFromCache<DepartmentNewsDetail>(
      cacheKey,
      DEPARTMENT_NEWS_CONFIG.detailTtlMs
    );
    if (
      cached &&
      (cached.date?.trim() ||
        cached.contentHtml?.trim() ||
        (cached.attachments && cached.attachments.length > 0))
    ) {
      return cached;
    }
  }

  const url = `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?id=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`公告內容載入失敗 (HTTP ${res.status})`);
    }
    const rawData = (await res.json()) as DepartmentNewsDetail;
    const contentHtml = (rawData.contentHtml || "")
      .replace(/src=["']\/(?!\/)/g, 'src="https://im.mgt.ncu.edu.tw/')
      .replace(/href=["']\/(?!\/)/g, 'href="https://im.mgt.ncu.edu.tw/');

    const title = decodeHtmlEntities(rawData.title || "");
    const attachments = (rawData.attachments || []).map((att) => ({
      ...att,
      name: decodeHtmlEntities(att.name || ""),
    }));

    const data: DepartmentNewsDetail = {
      ...rawData,
      title,
      attachments,
      contentHtml,
    };

    if (
      data.date ||
      data.contentHtml ||
      (data.attachments && data.attachments.length > 0)
    ) {
      saveToCache(cacheKey, data);
    }
    return data;
  } catch (err) {
    const fallback = getStaleCache<DepartmentNewsDetail>(cacheKey);
    if (fallback) {
      return fallback;
    }
    throw err;
  }
}
