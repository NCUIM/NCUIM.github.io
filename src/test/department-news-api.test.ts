import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDepartmentNews,
  fetchDepartmentNewsDetail,
  parseAnnouncementMeta,
  DEPARTMENT_NEWS_CONFIG,
  type DepartmentNewsResponse,
  type DepartmentNewsDetail,
} from "../services/department-news-api";

describe("department-news-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("parseAnnouncementMeta", () => {
    it("distinguishes important status from topic category and cleans title", () => {
      const res = parseAnnouncementMeta({
        title: "【重要】115學年度入學碩士班必修及選修科目表",
        tag: "重要",
        category: "其他活動",
      });
      expect(res.isImportant).toBe(true);
      expect(res.cleanTitle).toBe("115學年度入學碩士班必修及選修科目表");
    });

    it("parses scholarship policy post with important status", () => {
      const res = parseAnnouncementMeta({
        title: "【重要】「國立中央大學學業成績優良書卷獎獎勵辦法」修正",
        tag: "重要",
        category: "最新消息",
      });
      expect(res.isImportant).toBe(true);
      expect(res.topicTag).toBe("獎學金");
      expect(res.cleanTitle).toBe("「國立中央大學學業成績優良書卷獎獎勵辦法」修正");
    });

    it("parses freshman guide post with important flag and clean title", () => {
      const res = parseAnnouncementMeta({
        title: "【重要公告】大學部115學年度入學新生手冊",
        tag: "重要公告",
        category: "最新消息",
      });
      expect(res.isImportant).toBe(true);
      expect(res.topicTag).toBe("新生專區");
      expect(res.cleanTitle).toBe("大學部115學年度入學新生手冊");
    });

    it("extracts specific bracket tag as topic tag and strips bracket from title", () => {
      const res = parseAnnouncementMeta({
        title: "【畢業審查】六學期-112學年度入學學生畢業審核表說明",
        tag: "畢業審查",
        category: "最新消息",
      });
      expect(res.isImportant).toBe(false);
      expect(res.topicTag).toBe("畢業審查");
      expect(res.cleanTitle).toBe("六學期-112學年度入學學生畢業審核表說明");
    });

    it("handles multiple brackets like 【重要】【實習】 cleanly", () => {
      const res = parseAnnouncementMeta({
        title: "【重要】【實習】長榮航空2027年資訊類實習生甄選報名事宜",
        tag: "重要",
        category: "最新消息",
      });
      expect(res.isImportant).toBe(true);
      expect(res.topicTag).toBe("實習");
      expect(res.cleanTitle).toBe("長榮航空2027年資訊類實習生甄選報名事宜");
    });

    it("falls back to item category when browsing a specific category tab", () => {
      const res = parseAnnouncementMeta({
        title: "【公告】1141本系新開選修課程",
        tag: "公告",
        category: "課程消息",
      });
      expect(res.isImportant).toBe(false);
      expect(res.topicTag).toBe("課程消息");
      expect(res.cleanTitle).toBe("1141本系新開選修課程");
    });

    it("handles untagged posts with title keyword heuristics", () => {
      const res = parseAnnouncementMeta({
        title: "可外借專題參考書籍清單",
        tag: "",
        category: "最新消息",
      });
      expect(res.isImportant).toBe(false);
      expect(res.topicTag).toBe("課程消息");
      expect(res.cleanTitle).toBe("可外借專題參考書籍清單");
    });

    it("guarantees a fallback topic tag when post has no tag, no category, and no keyword match", () => {
      const res = parseAnnouncementMeta({
        title: "系辦公室會議室使用異動說明",
        tag: "",
        category: "",
      });
      expect(res.isImportant).toBe(false);
      expect(res.topicTag).toBe("系所情報");
      expect(res.cleanTitle).toBe("系辦公室會議室使用異動說明");
    });
  });

  describe("fetchDepartmentNews", () => {
    it("fetches and returns announcement list successfully and caches it with default category", async () => {
      const mockResponse: DepartmentNewsResponse = {
        category: "實習與企業徵才",
        page: 1,
        total: 20,
        items: [
          {
            id: "1001",
            title: "測試公告 1",
            url: "https://im.mgt.ncu.edu.tw/homes/1001/post",
            tag: "重要",
            category: "實習與企業徵才",
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const res = await fetchDepartmentNews();
      expect(res.items[0].id).toBe("1001");
      expect(fetchSpy).toHaveBeenCalledWith(
        `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?category=${encodeURIComponent("實習與企業徵才")}&page=1`
      );

      // Verify cached hit without calling fetch again
      fetchSpy.mockClear();
      const cachedRes = await fetchDepartmentNews("實習與企業徵才", 1);
      expect(cachedRes.items[0].id).toBe("1001");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("falls back to stale cache on network failure", async () => {
      const mockCached: DepartmentNewsResponse = {
        category: "工讀與獎學金",
        page: 1,
        total: 1,
        items: [
          {
            id: "2001",
            title: "舊快取公告",
            url: "https://im.mgt.ncu.edu.tw/homes/2001/post",
            tag: "",
            category: "工讀與獎學金",
          },
        ],
      };

      // Populate stale cache (timestamp in the distant past)
      localStorage.setItem(
        `${DEPARTMENT_NEWS_CONFIG.storagePrefix}list_${encodeURIComponent("工讀與獎學金")}_1`,
        JSON.stringify({
          timestamp: Date.now() - 99999999,
          data: mockCached,
        })
      );

      // Network fails
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network Error"));

      const res = await fetchDepartmentNews("工讀與獎學金", 1);
      expect(res).toEqual(mockCached);
    });

    it("throws error when fetch fails and no cache exists", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 502,
      } as Response);

      await expect(fetchDepartmentNews("演講訊息", 1)).rejects.toThrow(
        "系網公告載入失敗 (HTTP 502)"
      );
    });
  });

  describe("fetchDepartmentNewsDetail", () => {
    it("fetches and returns post detail successfully and caches it", async () => {
      const mockDetail: DepartmentNewsDetail = {
        id: "9518",
        title: "科目表公告",
        date: "2026-10-08",
        contentHtml: "<p>公告內文</p>",
        attachments: [
          {
            name: "課表.pdf",
            url: "https://im.mgt.ncu.edu.tw/uploads/1.pdf",
          },
        ],
        originalUrl: "https://im.mgt.ncu.edu.tw/homes/9518/post",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      } as Response);

      const res = await fetchDepartmentNewsDetail("9518");
      expect(res).toEqual(mockDetail);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?id=9518`
      );

      // Verify cached
      fetchSpy.mockClear();
      const cached = await fetchDepartmentNewsDetail("9518");
      expect(cached).toEqual(mockDetail);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("throws error when post detail fails and no cache exists", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(fetchDepartmentNewsDetail("99999")).rejects.toThrow(
        "公告內容載入失敗 (HTTP 404)"
      );
    });
  });
});
