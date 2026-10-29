import { useEffect, useRef } from "react";
import { useIonToast } from "@ionic/react";
import {
  parseBookmarkletPayload,
  type CisCourse,
} from "../services/cis-course-api";
import {
  getStoredTrack,
  getStoredSelectedCourses,
  setStoredSelectedCourses,
  setStoredCisCourses,
  isValidCisCourse,
} from "../services/cis-storage";
import {
  TRACK_CONFIGS,
  matchCisToCurriculum,
  type TrackType,
} from "../data/im-curriculum";

export interface CisSyncPayload {
  readonly currentCourses: readonly CisCourse[];
  readonly historyCourses: readonly CisCourse[];
}

export interface UseCisBookmarkletSyncOptions {
  readonly currentTrack?: TrackType;
  readonly onSyncSuccess?: (payload: CisSyncPayload, matchedCourseIds: readonly string[]) => void;
  readonly onSyncError?: (error: unknown) => void;
}

export function generateSyncToastMessage(
  currentCount: number,
  historyCount: number,
  matchedCount: number,
): string | null {
  if (currentCount <= 0 && historyCount <= 0) {
    return null;
  }
  if (currentCount > 0 && historyCount > 0) {
    return `🎉 成功同步！已匯入 ${currentCount} 門本學期課表與 ${historyCount} 門歷年修課（自動配對 ${matchedCount} 門必選修）！`;
  }
  if (currentCount > 0) {
    return `🎉 成功同步！已匯入 ${currentCount} 門本學期課表！`;
  }
  return `🎉 成功同步！已匯入 ${historyCount} 門歷年修課（自動配對 ${matchedCount} 門必選修）！`;
}

export function useCisBookmarkletSync(options: UseCisBookmarkletSyncOptions = {}): void {
  const [presentToast] = useIonToast();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      const payload = parseBookmarkletPayload(hash);
      if (!payload) return;

      let hasProcessed = false;
      try {
        const validCurrentCourses = payload.currentCourses.filter(isValidCisCourse);
        const validHistoryCourses = payload.historyCourses.filter(isValidCisCourse);

        if (validCurrentCourses.length === 0 && validHistoryCourses.length === 0) {
          return;
        }

        hasProcessed = true;
        let matchedIds: string[] = [];

        if (validCurrentCourses.length > 0) {
          setStoredCisCourses(validCurrentCourses);
        }

        if (validHistoryCourses.length > 0) {
          const track = optionsRef.current.currentTrack || getStoredTrack();
          const config = TRACK_CONFIGS[track] || TRACK_CONFIGS.mgmt;
          matchedIds = matchCisToCurriculum(validHistoryCourses, config, track);
          const prevSelected = getStoredSelectedCourses();
          const merged = Array.from(new Set([...prevSelected, ...matchedIds]));
          setStoredSelectedCourses(merged);
        }

        const message = generateSyncToastMessage(
          validCurrentCourses.length,
          validHistoryCourses.length,
          matchedIds.length,
        );

        if (message) {
          presentToast({
            message,
            duration: 4000,
            color: "success",
            position: "top",
          });
        }

        const sanitizedPayload: CisSyncPayload = {
          currentCourses: validCurrentCourses,
          historyCourses: validHistoryCourses,
        };

        optionsRef.current.onSyncSuccess?.(sanitizedPayload, matchedIds);
      } catch (err) {
        hasProcessed = true;
        presentToast({
          message: "課務資料解析失敗，請重新嘗試同步",
          duration: 3000,
          color: "danger",
          position: "top",
        });
        optionsRef.current.onSyncError?.(err);
      } finally {
        if (hasProcessed) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    };

    handleHashSync();
    window.addEventListener("hashchange", handleHashSync);
    return () => {
      window.removeEventListener("hashchange", handleHashSync);
    };
  }, [presentToast]);
}
