import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchLiveLeaderboard,
  verifyEntryCode,
  getSavedParticipantInfo,
  saveParticipantInfo,
  clearSavedParticipantInfo,
  CARD_EVENT_CONFIG,
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
      expect(saved?.label).toBe("新生 A");
      expect(saved?.eventName).toBe("NCUIM2026-Fresher");

      clearSavedParticipantInfo();
      expect(getSavedParticipantInfo()).toBeNull();
    });
  });
});
