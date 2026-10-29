import { useEffect, useRef } from "react";
import { useIonToast } from "@ionic/react";
import {
  parseBookmarkletPayload,
  type BookmarkletPayload,
  type CisCourse,
} from "../services/cis-course-api";
import {
  getStoredTrack,
  getStoredSelectedCourses,
  setStoredSelectedCourses,
  setStoredCisCourses,
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
): string {
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

      try {
        const { currentCourses, historyCourses } = payload;
        let matchedIds: string[] = [];

        if (currentCourses.length > 0) {
          setStoredCisCourses(currentCourses);
        }

        if (historyCourses.length > 0) {
          const track = optionsRef.current.currentTrack || getStoredTrack();
          const config = TRACK_CONFIGS[track] || TRACK_CONFIGS.mgmt;
          matchedIds = matchCisToCurriculum(historyCourses, config, track);
          const prevSelected = getStoredSelectedCourses();
          const merged = Array.from(new Set([...prevSelected, ...matchedIds]));
          setStoredSelectedCourses(merged);
        }

        const message = generateSyncToastMessage(
          currentCourses.length,
          historyCourses.length,
          matchedIds.length,
        );

        presentToast({
          message,
          duration: 4000,
          color: "success",
          position: "top",
        });

        optionsRef.current.onSyncSuccess?.(payload, matchedIds);
      } catch (err) {
        presentToast({
          message: "課務資料解析失敗，請重新嘗試同步",
          duration: 3000,
          color: "danger",
          position: "top",
        });
        optionsRef.current.onSyncError?.(err);
      } finally {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    handleHashSync();
    window.addEventListener("hashchange", handleHashSync);
    return () => {
      window.removeEventListener("hashchange", handleHashSync);
    };
  }, [presentToast]);
}
