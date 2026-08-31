import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchLiveLeaderboard,
  verifyEntryCode,
  getSavedParticipantInfo,
  saveParticipantInfo,
  clearSavedParticipantInfo,
} from "../services/card-event-api";

describe("card-event-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("fetchLiveLeaderboard", () => {
    it("fetches and returns leaderboard data", async () => {
      const mockResponse = {
        event: { name: "NCUIM2026-Fresher" },
        updatedAt: "2026-08-30T14:39:16.817Z",
        totalRanked: 69,
        top: [
          { rank: 1, nickname: "小明", score: 690 },
          { rank: 2, nickname: "小華", score: 600 },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const res = await fetchLiveLeaderboard();
      expect(res.event.name).toBe("NCUIM2026-Fresher");
      expect(res.totalRanked).toBe(69);
      expect(res.top).toHaveLength(2);
    });

    it("throws error when response is not ok", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(fetchLiveLeaderboard()).rejects.toThrow("排行榜載入失敗 (HTTP 500)");
    });
  });

  describe("verifyEntryCode", () => {
    it("throws error if code is empty", async () => {
      await expect(verifyEntryCode("   ")).rejects.toThrow("請輸入報到碼");
    });

    it("returns entry info on success", async () => {
      const mockData = {
        entryCode: "JOINNCU1",
        role: "PARTICIPANT",
        label: "新生 A",
        event: {
          id: "cmtfm0mc20001x0vlhc0bw8b2",
          name: "NCUIM2026-Fresher",
        },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const res = await verifyEntryCode("joinncu1");
      expect(res.entryCode).toBe("JOINNCU1");
      expect(res.label).toBe("新生 A");
    });

    it("throws error with server message when invalid", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "查不到這組報到碼" }),
      } as unknown as Response);

      await expect(verifyEntryCode("INVALID")).rejects.toThrow("查不到這組報到碼");
    });

    it("throws network/CORS error message on network failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(verifyEntryCode("JOINNCU1")).rejects.toThrow(
        "伺服器跨域限制，請直接點擊「前往報到」",
      );
    });

    it("throws fallback error when server returns non-JSON error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Bad gateway");
        },
      } as unknown as Response);

      await expect(verifyEntryCode("JOINNCU1")).rejects.toThrow("驗證失敗 (HTTP 502)");
    });
  });

  describe("localStorage participant info helpers", () => {
    it("saves, retrieves, and clears participant info", () => {
      expect(getSavedParticipantInfo()).toBeNull();

      const entryInfo = {
        entryCode: "JOINNCU1",
        role: "PARTICIPANT",
        label: "新生 A",
        event: {
          id: "cmtfm0mc20001x0vlhc0bw8b2",
          name: "NCUIM2026-Fresher",
        },
      };

      saveParticipantInfo(entryInfo);

      const saved = getSavedParticipantInfo();
      expect(saved).not.toBeNull();
      expect(saved?.entryCode).toBe("JOINNCU1");
      expect(saved?.eventId).toBe("cmtfm0mc20001x0vlhc0bw8b2");
      expect(saved?.label).toBe("新生 A");
      expect(saved?.eventName).toBe("NCUIM2026-Fresher");

      clearSavedParticipantInfo();
      expect(getSavedParticipantInfo()).toBeNull();
    });

    it("returns null if saved participant belongs to another event", () => {
      const entryInfo = {
        entryCode: "JOINNCU1",
        role: "PARTICIPANT",
        label: "新生 A",
        event: {
          id: "old-event-id",
          name: "Old Event",
        },
      };

      saveParticipantInfo(entryInfo);
      expect(getSavedParticipantInfo("new-event-id")).toBeNull();
    });
  });
});
