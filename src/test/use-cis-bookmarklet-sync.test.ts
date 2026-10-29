import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useCisBookmarkletSync,
  generateSyncToastMessage,
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
    it("returns null when both counts are zero", () => {
      expect(generateSyncToastMessage(0, 0, 0)).toBeNull();
    });

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

    it("ignores empty sync payloads without showing success toast or clearing hash", () => {
      const onSyncSuccess = vi.fn();
      const emptyPayload = { current: [], history: [] };
      window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(emptyPayload))}`;

      renderHook(() => useCisBookmarkletSync({ onSyncSuccess }));

      expect(onSyncSuccess).not.toHaveBeenCalled();
      expect(mockPresentToast).not.toHaveBeenCalled();
      expect(window.location.hash).toContain("cis_data");
    });

    it("processes current courses, saves to storage, and delivers expected payload to callback", () => {
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
      expect(onSyncSuccess).toHaveBeenCalledWith(
        {
          currentCourses: [sampleCourse],
          historyCourses: [],
        },
        [],
      );
      expect(mockPresentToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "success",
        }),
      );
    });

    it("filters out crafted invalid course entries such as non-string classTimes", () => {
      const onSyncSuccess = vi.fn();
      const craftedCourse = {
        ...sampleCourse,
        serialNo: "malicious_1",
        classTimes: [{}], // non-string classTime object
      };
      const payload = {
        current: [sampleCourse, craftedCourse],
        history: [],
      };
      window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload))}`;

      renderHook(() => useCisBookmarkletSync({ onSyncSuccess }));

      // Only valid sampleCourse should be stored and passed
      expect(getStoredCisCourses()).toEqual([sampleCourse]);
      expect(onSyncSuccess).toHaveBeenCalledWith(
        {
          currentCourses: [sampleCourse],
          historyCourses: [],
        },
        [],
      );
    });

    it("processes history courses, matches to track curriculum, asserts matched selections in storage and callback", () => {
      setStoredTrack("mgmt");
      setStoredSelectedCourses(["existing_course_1"]);

      const historyCourse: CisCourse = {
        ...sampleCourse,
        classNo: "IM6003", // matches software engineering core in curriculum
        name: "軟體工程",
      };

      const payload = {
        current: [],
        history: [historyCourse],
      };
      window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload))}`;

      const onSyncSuccess = vi.fn();
      renderHook(() => useCisBookmarkletSync({ currentTrack: "mgmt", onSyncSuccess }));

      expect(onSyncSuccess).toHaveBeenCalledTimes(1);
      expect(onSyncSuccess).toHaveBeenCalledWith(
        {
          currentCourses: [],
          historyCourses: [historyCourse],
        },
        ["IM6003"],
      );
      const stored = getStoredSelectedCourses();
      expect(stored).toContain("existing_course_1");
      expect(stored).toContain("IM6003");
    });
  });

  describe("hashchange event listener and cleanup", () => {
    it("reacts dynamically to hashchange events with validated payload", () => {
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
      expect(onSyncSuccess).toHaveBeenCalledWith(
        {
          currentCourses: [sampleCourse],
          historyCourses: [],
        },
        [],
      );
      expect(getStoredCisCourses()).toEqual([sampleCourse]);

      unmount();

      // Dispatch a VALID payload after unmount to verify listener is truly unregistered
      const secondCourse: CisCourse = {
        ...sampleCourse,
        serialNo: "9999",
      };
      act(() => {
        const payload2 = {
          current: [secondCourse],
          history: [],
        };
        window.location.hash = `#cis_data=${encodeURIComponent(JSON.stringify(payload2))}`;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });

      // Should not trigger again after unmount and storage must not contain secondCourse
      expect(onSyncSuccess).toHaveBeenCalledTimes(1);
      expect(getStoredCisCourses()).toEqual([sampleCourse]);
    });

    it("triggers onSyncError and toast when parsing or processing throws", () => {
      const onSyncError = vi.fn();
      renderHook(() =>
        useCisBookmarkletSync({
          onSyncError,
          onSyncSuccess: () => {
            throw new Error("Processing failed");
          },
        }),
      );

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
