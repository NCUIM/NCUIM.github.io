import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  IonSpinner,
  useIonToast,
} from "@ionic/react";
import { isCisLoggedIn, cisLogout } from "../services/cis-login";
import { fetchCisSelectedCourses, parseBookmarkletPayload, type CisCourse } from "../services/cis-course-api";
import { fetchImMasterCourses, type MasterCourseItem } from "../services/all-courses-api";
import CisLoginModal from "../components/CisLoginModal";
import { TRACK_CONFIGS, matchCisToCurriculum, type TrackType } from "../data/im-curriculum";
import {
  getDefaultDayIndex,
  getTimeIndicators,
  computeMergedTimetableData,
} from "../utils/timetable-matcher";
import { TimetableHeader } from "../components/timetable/TimetableHeader";
import { TimetableMobileView } from "../components/timetable/TimetableMobileView";
import { TimetableDesktopView } from "../components/timetable/TimetableDesktopView";

// ── Re-exports for backwards compatibility & tests ───────────────
export type { Course, Period, DayCourseSpan, DesktopCourseSpan } from "../types/timetable";
export { days, NCU_PERIODS, periods } from "../types/timetable";
export {
  getPeriodTimeBounds,
  extractCourseCodeAndSection,
  isSerialMatch,
  isClassNoMatch,
  isSingleMasterCourseMatch,
  isCourseMatch,
  matchCisCourse,
  mapMasterCourseToCourse,
  buildTimetableFromCisCourses,
  collectDayCourseSpans,
  getDayFixedTracks,
  getDesktopCourseSpans,
} from "../utils/timetable-matcher";
export { DesktopRulerItem } from "../components/timetable/TimetableDesktopView";
export { TimetableHeader } from "../components/timetable/TimetableHeader";

const STORAGE_KEY_CIS_COURSES = "ncu_my_cis_courses";

const handleCatchNoop = (err: unknown): void => {
  if (err) {
    // Handled in component state
  }
};

const TimetablePage = () => {
  const [presentToast] = useIonToast();
  const defaultDay = getDefaultDayIndex();
  const [selectedDay, setSelectedDay] = useState(String(defaultDay));
  const [viewScope, setViewScope] = useState<"all" | "mine">(() =>
    isCisLoggedIn() ? "mine" : "all",
  );

  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const prevDayRef = useRef(getDefaultDayIndex());
  useEffect(() => {
    const newDay = getDefaultDayIndex();
    if (newDay !== prevDayRef.current) {
      prevDayRef.current = newDay;
      setSelectedDay(String(newDay));
    }
  }, [currentTimestamp]);

  const [masterCourses, setMasterCourses] = useState<MasterCourseItem[]>([]);
  const [myCisCourses, setMyCisCourses] = useState<CisCourse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CIS_COURSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cisAuthenticated, setCisAuthenticated] = useState(
    () => isCisLoggedIn() || Boolean(localStorage.getItem(STORAGE_KEY_CIS_COURSES)),
  );
  const [showCisLogin, setShowCisLogin] = useState(false);

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      const payload = parseBookmarkletPayload(hash);
      if (!payload) return;
      try {
        const { currentCourses, historyCourses } = payload;

        if (currentCourses.length > 0) {
          setMyCisCourses(currentCourses);
          localStorage.setItem(STORAGE_KEY_CIS_COURSES, JSON.stringify(currentCourses));
          setCisAuthenticated(true);
          setViewScope("mine");
        }

        if (historyCourses.length > 0) {
          const track = (localStorage.getItem("ncu_credit_track") as TrackType) || "mgmt";
          const config = TRACK_CONFIGS[track] || TRACK_CONFIGS.mgmt;
          const matchedIds = matchCisToCurriculum(historyCourses, config, track);
          let prevSelected: string[] = [];
          try {
            const saved = localStorage.getItem("ncu_selected_credit_courses");
            if (saved) prevSelected = JSON.parse(saved);
          } catch {
            // ignore
          }
          const merged = Array.from(new Set([...prevSelected, ...matchedIds]));
          localStorage.setItem("ncu_selected_credit_courses", JSON.stringify(merged));
        }

        presentToast({
          message: `🎉 成功同步！已匯入 ${currentCourses.length} 門本學期課表與 ${historyCourses.length} 門歷年學分紀錄！`,
          duration: 4000,
          color: "success",
          position: "top",
        });
      } catch {
        presentToast({
          message: "課務資料解析失敗，請重新嘗試同步",
          duration: 3000,
          color: "danger",
          position: "top",
        });
      } finally {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    handleHashSync();
    window.addEventListener("hashchange", handleHashSync);
    return () => window.removeEventListener("hashchange", handleHashSync);
  }, [presentToast]);

  const syncDefaultCourses = useCallback(async () => {
    setLoading(true);
    try {
      const courses = await fetchImMasterCourses();
      if (courses.length > 0) {
        setMasterCourses(courses);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "載入課程資料失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncDefaultCourses().catch(handleCatchNoop);
  }, [syncDefaultCourses]);

  const syncCisCourses = useCallback(async () => {
    if (!isCisLoggedIn()) return;
    setLoading(true);
    setApiError(null);
    try {
      const courses = await fetchCisSelectedCourses();
      if (courses.length > 0) {
        setMyCisCourses(courses);
      } else {
        cisLogout();
        setCisAuthenticated(false);
        setApiError("CIS Session 已過期，請重新連結");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "CIS 載入失敗";
      setApiError(msg);
      cisLogout();
      setCisAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cisAuthenticated) return;
    syncCisCourses().catch(handleCatchNoop);
  }, [cisAuthenticated, syncCisCourses]);

  const timetableData = useMemo(
    () => computeMergedTimetableData(masterCourses, myCisCourses, viewScope),
    [masterCourses, myCisCourses, viewScope],
  );

  const enrolledCount = useMemo(() => myCisCourses.length, [myCisCourses]);
  const dayIndex = Number(selectedDay);
  const { current: currentPeriodIndex, next: nextPeriodIndex } = useMemo(
    () => getTimeIndicators(timetableData, dayIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timetableData, dayIndex, currentTimestamp],
  );
  const isToday = useMemo(() => {
    const dayNum = new Date().getDay();
    return dayNum >= 1 && dayNum <= 5 && Number(selectedDay) === dayNum - 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, currentTimestamp]);

  const todayDayIndex = useMemo(() => {
    const dayNum = new Date().getDay();
    return dayNum >= 1 && dayNum <= 5 ? dayNum - 1 : -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTimestamp]);

  const handleToggleViewScope = useCallback(() => {
    setViewScope((v) => (v === "mine" ? "all" : "mine"));
  }, []);

  const handleOpenCisModal = useCallback(() => {
    setShowCisLogin(true);
  }, []);

  const handleLogout = useCallback(() => {
    cisLogout();
    localStorage.removeItem(STORAGE_KEY_CIS_COURSES);
    setCisAuthenticated(false);
    setMyCisCourses([]);
    setViewScope("all");
    setApiError(null);
  }, []);

  return (
    <IonPage>
      <TimetableHeader
        cisAuthenticated={cisAuthenticated}
        viewScope={viewScope}
        enrolledCount={enrolledCount}
        onToggleViewScope={handleToggleViewScope}
        onOpenCisModal={handleOpenCisModal}
        onLogout={handleLogout}
      />
      <IonContent className="ion-padding timetable-content">
        <div style={{ maxWidth: 1380, width: "100%", margin: "0 auto" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <IonSpinner name="crescent" />
              <p style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
                載入課表資料中…
              </p>
            </div>
          )}
          {apiError && (
            <div
              style={{
                padding: "8px 12px",
                marginBottom: 8,
                borderRadius: "var(--ncu-radius-sm)",
                background: "var(--ncu-danger-light)",
                fontSize: 12,
                color: "var(--ncu-danger)",
              }}
            >
              ⚠ {apiError}
            </div>
          )}
          <TimetableMobileView
            timetableData={timetableData}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            currentPeriodIndex={currentPeriodIndex}
            nextPeriodIndex={nextPeriodIndex}
            isToday={isToday}
          />
          <TimetableDesktopView
            timetableData={timetableData}
            todayDayIndex={todayDayIndex}
          />
        </div>
      </IonContent>
      <CisLoginModal
        isOpen={showCisLogin}
        onDismiss={() => setShowCisLogin(false)}
      />
    </IonPage>
  );
};

export default TimetablePage;
