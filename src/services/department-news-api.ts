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
  "最新消息",
  "課程消息",
  "演講訊息",
  "工讀獎學金",
  "實習與企業徵才",
  "榮譽榜",
  "其他活動",
] as const;

export type DepartmentNewsCategory = (typeof DEPARTMENT_NEWS_CATEGORIES)[number];

export const DEPARTMENT_NEWS_CONFIG = {
  baseUrl: "https://ncuim-news-proxy.g1014308.workers.dev",
  listTtlMs: 10 * 60 * 1000, // 10 minutes
  detailTtlMs: 60 * 60 * 1000, // 60 minutes
  storagePrefix: "ncuim_news_cache_",
};

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

/**
 * Fetch a page of department announcements by category.
 */
export async function fetchDepartmentNews(
  category: string = "最新消息",
  page: number = 1,
  forceRefresh: boolean = false
): Promise<DepartmentNewsResponse> {
  const cacheKey = `list_${encodeURIComponent(category)}_${page}`;

  if (!forceRefresh) {
    const cached = getFromCache<DepartmentNewsResponse>(
      cacheKey,
      DEPARTMENT_NEWS_CONFIG.listTtlMs
    );
    if (cached) return cached;
  }

  const url = `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?category=${encodeURIComponent(category)}&page=${page}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`系網公告載入失敗 (HTTP ${res.status})`);
    }
    const data = (await res.json()) as DepartmentNewsResponse;
    saveToCache(cacheKey, data);
    return data;
  } catch (err) {
    const fallback = getStaleCache<DepartmentNewsResponse>(cacheKey);
    if (fallback) {
      return fallback;
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
    if (cached) return cached;
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

    if (data.contentHtml || (data.attachments && data.attachments.length > 0)) {
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
