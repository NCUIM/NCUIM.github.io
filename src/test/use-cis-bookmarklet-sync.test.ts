import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useCisBookmarkletSync,
  generateSyncToastMessage,
  type CisSyncPayload,
} from "../utils/useCisBookmarkletSync";
import {
  getStoredCisCourses,
  getStoredSelectedCourses,
  setStoredSelectedCourses,
  setStoredTrack,
  clearCreditStorage,
  clearCisCoursesStorage,
} from "../services/cis-storage";
import type { CisCourse } from "../services/cis-course-api";

const mockPresentToast = vi.fn();

vi.mock("@ionic/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ionic/react")>();
  return {
    ...actual,
    useIonToast: () => [mockPresentToast, vi.fn()],
  };
});

describe("useCisBookmarkletSync", () => {
  const sampleCourse: CisCourse = {
    serialNo: "1001",
    classNo: "IM5019",
    name: "管理資訊系統",
    teacher: "陳彥良",
    room: "I1-404",
    credit: 3,
    classTimes: ["2-2", "2-3", "2-4"],
    classTimesAlt: "2-2,3,4",
    status: "passed",
    admitCnt: 30,
    limitCnt: 30,
    waitCnt: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    mockPresentToast.mockClear();
    window.location.hash = "";
  });

  afterEach(() => {
    clearCreditStorage();
    clearCisCoursesStorage();
    window.location.hash = "";
  });

  describe("generateSyncToastMessage", () => {
    it("formats message when both current and history courses are present", () => {
      const msg = generateSyncToastMessage(3, 10, 4);
      expect(msg).toContain("3 門本學期課表");
      expect(msg).toContain("10 門歷年修課");
      expect(msg).toContain("自動配對 4 門必選修");
    });

    it("formats message when only current courses are present", () => {
      const msg = generateSyncToastMessage(5, 0, 0);
      expect(msg).toContain("5 門本學期課表");
      expect(msg).not.toContain("歷年修課");
    });

    it("formats message when only history courses are present", () => {
      const msg = generateSyncToastMessage(0, 8, 3);
      expect(msg).toContain("8 門歷年修課");
      expect(msg).toContain("自動配對 3 門必選修");
      expect(msg).not.toContain("本學期課表");
    });
  });

  describe("hook behavior on mount", () => {
    it("does nothing if hash is empty", () => {
      const onSyncSuccess = vi.fn();
      renderHook(() => useCisBookmarkletSync({ onSyncSuccess }));

      expect(onSyncSuccess).not.toHaveBeenCalled();
      expect(mockPresentToast).not.toHaveBeenCalled();
      expect(getStoredCisCourses()).toEqual([]);
    });

    it("processes current courses and saves them to local storage", () => {
      const onSyncSuccess = vi.fn();
      const payload = {
        current: [sampleCourse],
        history: [],
      };
      window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload))}`;

      renderHook(() => useCisBookmarkletSync({ onSyncSuccess }));

      expect(getStoredCisCourses()).toHaveLength(1);
      expect(getStoredCisCourses()[0].serialNo).toBe("1001");
      expect(onSyncSuccess).toHaveBeenCalledTimes(1);
      expect(mockPresentToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "success",
        }),
      );
    });

    it("processes history courses, matches to track curriculum, and merges selections", () => {
      setStoredTrack("mgmt");
      setStoredSelectedCourses(["existing_course_1"]);

      const historyCourse: CisCourse = {
        ...sampleCourse,
        classNo: "IM5019", // Should match track curriculum if present
      };

      const payload = {
        current: [],
        history: [historyCourse],
      };
      window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload))}`;

      const onSyncSuccess = vi.fn();
      renderHook(() => useCisBookmarkletSync({ currentTrack: "mgmt", onSyncSuccess }));

      expect(onSyncSuccess).toHaveBeenCalledTimes(1);
      const stored = getStoredSelectedCourses();
      expect(stored).toContain("existing_course_1");
    });
  });

  describe("hashchange event listener", () => {
    it("reacts dynamically to hashchange events", () => {
      const onSyncSuccess = vi.fn();
      const { unmount } = renderHook(() => useCisBookmarkletSync({ onSyncSuccess }));

      expect(onSyncSuccess).not.toHaveBeenCalled();

      act(() => {
        const payload = {
          current: [sampleCourse],
          history: [],
        };
        window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload))}`;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });

      expect(onSyncSuccess).toHaveBeenCalledTimes(1);
      expect(getStoredCisCourses()).toHaveLength(1);

      unmount();

      act(() => {
        window.location.hash = "#cis_data=something_else";
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      // Should not trigger again after unmount
      expect(onSyncSuccess).toHaveBeenCalledTimes(1);
    });

    it("triggers onSyncError and toast when parsing or processing throws", () => {
      const onSyncError = vi.fn();
      renderHook(() => useCisBookmarkletSync({
        onSyncError,
        onSyncSuccess: () => {
          throw new Error("Processing failed");
        },
      }));

      act(() => {
        const payload = {
          current: [sampleCourse],
          history: [],
        };
        window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload))}`;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });

      expect(onSyncError).toHaveBeenCalled();
      expect(mockPresentToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "danger",
          message: "課務資料解析失敗，請重新嘗試同步",
        }),
      );
    });
  });
});
