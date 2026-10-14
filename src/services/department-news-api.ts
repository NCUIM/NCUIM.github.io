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

/**
 * Parses announcement metadata:
 * 1. Distinguishes '重要' priority status from actual topic category
 * 2. Strips leading brackets from title for clean display
 * 3. Identifies specific topic category badge
 */
export function parseAnnouncementMeta(
  item: Pick<DepartmentNewsItem, "title" | "tag"> & { readonly category?: string }
): ParsedAnnouncementMeta {
  const isImportant =
    item.tag.includes("重要") ||
    item.title.includes("【重要】") ||
    item.title.includes("【重要公告】") ||
    item.title.startsWith("重要：") ||
    item.title.startsWith("重要:");

  // Strip all leading bracket prefixes (e.g. 【重要】、【公告】、[重要])
  const cleanTitle =
    item.title.replace(/^([【\[][^】\]]+[】\]]\s*)+/, "").trim() || item.title;

  // Extract all bracket tags from the original title
  const matches = Array.from(item.title.matchAll(/【([^】]+)】|\[([^\]]+)\]/g));
  const bracketTags = matches.map((m) => m[1] || m[2]).filter(Boolean);

  const specificBracketTag = bracketTags.find((t) => !GENERIC_TAGS.has(t));
  const specificItemTag =
    item.tag && !GENERIC_TAGS.has(item.tag) ? item.tag : null;

  let topicTag = specificBracketTag || specificItemTag || null;

  if (!topicTag) {
    if (item.category && item.category !== "最新消息" && item.category !== "其他活動") {
      if (item.category === "實習與企業徵才") topicTag = "實習徵才";
      else if (item.category === "演講訊息") topicTag = "演講講座";
      else if (item.category === "工讀與獎學金" || item.category === "工讀獎學金") topicTag = "獎助學金";
      else if (item.category === "榮譽榜") topicTag = "活動競賽";
      else topicTag = item.category;
    } else {
      // Infer topic from title keywords
      const t = item.title;
      if (/實習|徵才|誠徵|招募|就業|職缺/.test(t)) {
        topicTag = "實習徵才";
      } else if (/演講|講座|論壇|座談|讀書會|分享會/.test(t)) {
        topicTag = "演講講座";
      } else if (/獎學金|書卷獎|研修獎|揚帆|工讀|助學/.test(t)) {
        topicTag = "獎學金";
      } else if (
        /科目表|選課|課表|學分抵免|抵免|學分|專題|論文|修課|課程|選修|必修/.test(t)
      ) {
        topicTag = "課程消息";
      } else if (/獲獎|得獎|頒獎|榮譽|黑客松|競賽/.test(t)) {
        topicTag = "活動競賽";
      } else if (/畢業審查|畢業審核|離校|畢業/.test(t)) {
        topicTag = "畢業審查";
      } else if (/新生手冊|新生資訊|新生/.test(t)) {
        topicTag = "新生專區";
      } else if (item.category === "其他活動") {
        topicTag = "其他動態";
      } else {
        topicTag = "系所情報";
      }
    }
  }

  if (!topicTag) {
    topicTag = "系所情報";
  }

  return { isImportant, topicTag, cleanTitle };
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
      // If some cached items are missing dates, fill from detail cache
      const itemsWithDates = cached.items.map((item) => {
        if (item.date) return item;
        const cachedDate = getCachedNewsDate(item.id);
        return cachedDate ? { ...item, date: cachedDate } : item;
      });
      return { ...cached, items: itemsWithDates };
    }
  }

  const url = `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?category=${encodeURIComponent(category)}&page=${page}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`系網公告載入失敗 (HTTP ${res.status})`);
    }
    const data = (await res.json()) as DepartmentNewsResponse;

    // Populate dates for all items: check cache or batch fetch details in background
    const itemsWithDates = await Promise.all(
      data.items.map(async (item) => {
        if (item.date) return item;
        const cachedDate = getCachedNewsDate(item.id);
        if (cachedDate) {
          return { ...item, date: cachedDate };
        }
        try {
          const detail = await fetchDepartmentNewsDetail(item.id);
          return { ...item, date: detail.date || undefined };
        } catch {
          return item;
        }
      })
    );

    const enrichedData = { ...data, items: itemsWithDates };
    saveToCache(cacheKey, enrichedData);
    return enrichedData;
  } catch (err) {
    const fallback = getStaleCache<DepartmentNewsResponse>(cacheKey);
    if (fallback) {
      const itemsWithDates = fallback.items.map((item) => {
        if (item.date) return item;
        const cachedDate = getCachedNewsDate(item.id);
        return cachedDate ? { ...item, date: cachedDate } : item;
      });
      return { ...fallback, items: itemsWithDates };
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

    const data: DepartmentNewsDetail = {
      ...rawData,
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
