import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDepartmentNews,
  fetchDepartmentNewsDetail,
  parseAnnouncementMeta,
  decodeHtmlEntities,
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
    it.each([
      [
        "【重要】115學年度入學碩士班必修及選修科目表",
        "重要",
        "其他活動",
        true,
        "課程消息",
        "115學年度入學碩士班必修及選修科目表",
      ],
      [
        "【重要】「國立中央大學學業成績優良書卷獎獎勵辦法」修正",
        "重要",
        "最新消息",
        true,
        "獎學金",
        "「國立中央大學學業成績優良書卷獎獎勵辦法」修正",
      ],
      [
        "【重要公告】大學部115學年度入學新生手冊",
        "重要公告",
        "最新消息",
        true,
        "新生專區",
        "大學部115學年度入學新生手冊",
      ],
      [
        "【畢業審查】六學期-112學年度入學學生畢業審核表說明",
        "畢業審查",
        "最新消息",
        false,
        "畢業審查",
        "六學期-112學年度入學學生畢業審核表說明",
      ],
      [
        "【重要】【實習】長榮航空2027年資訊類實習生甄選報名事宜",
        "重要",
        "最新消息",
        true,
        "實習",
        "長榮航空2027年資訊類實習生甄選報名事宜",
      ],
      [
        "【公告】1141本系新開選修課程",
        "公告",
        "課程消息",
        false,
        "課程消息",
        "1141本系新開選修課程",
      ],
      [
        "可外借專題參考書籍清單",
        "",
        "最新消息",
        false,
        "課程消息",
        "可外借專題參考書籍清單",
      ],
      [
        "系辦公室會議室使用異動說明",
        "",
        "",
        false,
        "系所情報",
        "系辦公室會議室使用異動說明",
      ],
      [
        "【重要】獲獎名單出爐&amp;金質獎畢典出席調查",
        "重要",
        "榮譽榜",
        true,
        "活動競賽",
        "獲獎名單出爐&金質獎畢典出席調查",
      ],
    ])(
      "correctly parses metadata for: %s",
      (title, tag, category, isImportant, topicTag, cleanTitle) => {
        const res = parseAnnouncementMeta({ title, tag, category });
        expect(res).toEqual({ isImportant, topicTag, cleanTitle });
      }
    );
  });

  describe("decodeHtmlEntities", () => {
    it("decodes named HTML entities correctly", () => {
      expect(decodeHtmlEntities("A&amp;B")).toBe("A&B");
      expect(decodeHtmlEntities("&quot;Hello&quot; &amp; &#39;World&#39;")).toBe('"Hello" & \'World\'');
      expect(decodeHtmlEntities("&lt;tag&gt;&nbsp;content")).toBe("<tag> content");
    });

    it("decodes decimal and hexadecimal numeric entities", () => {
      expect(decodeHtmlEntities("Test&#8211;Case")).toBe("Test\u2013Case");
      expect(decodeHtmlEntities("Test&#x2013;Case")).toBe("Test\u2013Case");
    });

    it("handles empty or falsy inputs gracefully", () => {
      expect(decodeHtmlEntities("")).toBe("");
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
            date: "2026-10-14",
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

    it("does not issue per-item network requests when date is missing and hydrates cached date if present", async () => {
      localStorage.setItem(
        `${DEPARTMENT_NEWS_CONFIG.storagePrefix}detail_1002`,
        JSON.stringify({
          timestamp: Date.now(),
          data: { id: "1002", title: "公告 2", date: "2026-10-12" },
        })
      );

      const mockResponse: DepartmentNewsResponse = {
        category: "演講訊息",
        page: 1,
        total: 2,
        items: [
          {
            id: "1001",
            title: "公告 1 (無日期)",
            url: "https://im.mgt.ncu.edu.tw/homes/1001/post",
            tag: "",
            category: "演講訊息",
          },
          {
            id: "1002",
            title: "公告 2 (快取有日期)",
            url: "https://im.mgt.ncu.edu.tw/homes/1002/post",
            tag: "",
            category: "演講訊息",
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const res = await fetchDepartmentNews("演講訊息", 1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res.items[0].date).toBeUndefined();
      expect(res.items[1].date).toBe("2026-10-12");
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
            date: "2026-10-10",
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
