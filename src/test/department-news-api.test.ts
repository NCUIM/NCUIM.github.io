import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDepartmentNews,
  fetchDepartmentNewsDetail,
  DEPARTMENT_NEWS_CONFIG,
  type DepartmentNewsResponse,
  type DepartmentNewsDetail,
} from "../services/department-news-api";

describe("department-news-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("fetchDepartmentNews", () => {
    it("fetches and returns announcement list successfully and caches it", async () => {
      const mockResponse: DepartmentNewsResponse = {
        category: "最新消息",
        page: 1,
        total: 20,
        items: [
          {
            id: "1001",
            title: "測試公告 1",
            url: "https://im.mgt.ncu.edu.tw/homes/1001/post",
            tag: "重要",
            category: "最新消息",
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const res = await fetchDepartmentNews("最新消息", 1);
      expect(res).toEqual(mockResponse);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${DEPARTMENT_NEWS_CONFIG.baseUrl}/?category=%E6%9C%80%E6%96%B0%E6%B6%88%E6%81%AF&page=1`
      );

      // Verify cached hit without calling fetch again
      fetchSpy.mockClear();
      const cachedRes = await fetchDepartmentNews("最新消息", 1);
      expect(cachedRes).toEqual(mockResponse);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("falls back to stale cache on network failure", async () => {
      const mockCached: DepartmentNewsResponse = {
        category: "課程消息",
        page: 1,
        total: 1,
        items: [
          {
            id: "2001",
            title: "舊快取公告",
            url: "https://im.mgt.ncu.edu.tw/homes/2001/post",
            tag: "",
            category: "課程消息",
          },
        ],
      };

      // Populate stale cache (timestamp in the distant past)
      localStorage.setItem(
        `${DEPARTMENT_NEWS_CONFIG.storagePrefix}list_${encodeURIComponent("課程消息")}_1`,
        JSON.stringify({
          timestamp: Date.now() - 99999999,
          data: mockCached,
        })
      );

      // Network fails
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network Error"));

      const res = await fetchDepartmentNews("課程消息", 1);
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
