import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { isLoggedIn, clearToken } from "../services/ncu-oauth";
import { fetchSelectedCourses, parseNcuTime, type NcuCourse } from "../services/ncu-course-api";
import { isCisLoggedIn, cisLogout } from "../services/cis-login";
import { fetchCisSelectedCourses } from "../services/cis-course-api";
import { star } from "ionicons/icons";
import CisLoginModal from "../components/CisLoginModal";

// ── Types ─────────────────────────────────────────────────────

interface Course {
  readonly name: string;
  readonly teacher: string;
  readonly room: string;
  readonly isMyCourse?: boolean;
}

interface Period {
  readonly id: string;
  readonly time: string;
}

// ── Constants ─────────────────────────────────────────────────

const days: readonly string[] = ["一", "二", "三", "四", "五"];
const periods: readonly Period[] = [
  { id: "1", time: "08:10-09:00" },
  { id: "2", time: "09:10-10:00" },
  { id: "3", time: "10:10-11:00" },
  { id: "4", time: "11:10-12:00" },
  { id: "N", time: "12:10-13:00" },
  { id: "5", time: "13:10-14:00" },
  { id: "6", time: "14:10-15:00" },
  { id: "7", time: "15:10-16:00" },
  { id: "8", time: "16:10-17:00" },
  { id: "9", time: "17:10-18:00" },
];

/** Mock timetable data (fallback when API is unavailable) */
const MOCK_TIMETABLE: Record<string, Course> = {
  "1-0": { name: "計算機科學", teacher: "王志明", room: "313", isMyCourse: true },
  "1-2": { name: "計算機科學", teacher: "王志明", room: "313", isMyCourse: true },
  "3-1": { name: "資料庫系統", teacher: "李怡萱", room: "209" },
  "3-3": { name: "資料庫系統", teacher: "李怡萱", room: "209" },
  "5-0": { name: "機器學習", teacher: "陳俊廷", room: "919", isMyCourse: true },
  "5-2": { name: "機器學習", teacher: "陳俊廷", room: "919", isMyCourse: true },
  "7-1": { name: "演算法設計", teacher: "張文慧", room: "310" },
  "7-4": { name: "計算機網路", teacher: "林家豪", room: "313" },
  "9-3": { name: "軟體工程", teacher: "黃雅琪", room: "209" },
  "9-4": { name: "資訊安全", teacher: "劉承恩", room: "310" },
};

// ── Helpers ───────────────────────────────────────────────────

function getDefaultDayIndex(): number {
  const d = new Date().getDay();
  if (d >= 1 && d <= 5) return d - 1;
  return 0;
}

function getTimeIndicators(timetableData: Record<string, Course>, dayIndex: number): { current: number; next: number } {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  let current = -1;
  let next = -1;
  for (let i = 0; i < periods.length; i++) {
    const [startStr, endStr] = periods[i].time.split("-");
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const hasCourse = !!timetableData[`${periods[i].id}-${dayIndex}`];
    if (mins >= start && mins < end && hasCourse) {
      current = i;
    } else if (next === -1 && mins < start && hasCourse) {
      next = i;
    }
  }
  return { current, next };
}

/** Convert NCU API courses to our timetable Record format */
function buildTimetableFromApi(courses: NcuCourse[]): Record<string, Course> {
  const result: Record<string, Course> = {};
  for (const c of courses) {
    const parsed = parseNcuTime(c.time);
    for (const t of parsed) {
      if (t.dayIndex < 0) continue;
      for (let i = 0; i < periods.length; i++) {
        const [pStartStr, pEndStr] = periods[i].time.split("-");
        const [psh, psm] = pStartStr.split(":").map(Number);
        const [peh, pem] = pEndStr.split(":").map(Number);
        const [csh, csm] = t.start.split(":").map(Number);
        const [ceh, cem] = t.end.split(":").map(Number);
        const pStart = psh * 60 + psm;
        const pEnd = peh * 60 + pem;
        const cStart = csh * 60 + csm;
        if (cStart >= pStart && cStart < pEnd) {
          const key = `${periods[i].id}-${t.dayIndex}`;
          result[key] = {
            name: c.name,
            teacher: c.teacher,
            room: c.room,
            isMyCourse: true,
          };
        }
      }
    }
  }
  return result;
}

// ── Styles ────────────────────────────────────────────────────

const cellBase: React.CSSProperties = {
  border: "1px solid var(--ncu-border)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 68,
  overflow: "hidden",
};

// ── Sub-components ────────────────────────────────────────────

const CourseCell = ({ course }: Readonly<{ course?: Course }>) => {
  const isMine = course?.isMyCourse ?? false;
  return (
    <div
      style={{
        ...cellBase,
        alignItems: "center",
        padding: "6px 8px",
        textAlign: "center",
        background: isMine
          ? "var(--ncu-star-light)"
          : course
            ? "var(--ncu-primary-light)"
            : "var(--ncu-surface)",
        border: isMine ? "2px solid var(--ncu-star)" : "1px solid var(--ncu-border)",
        gap: 2,
      }}
    >
      {course && (
        <>
          <strong style={{ fontSize: 13, lineHeight: 1.3, color: "var(--ncu-ink)" }}>
            {course.name}
          </strong>
          <span style={{ fontSize: 11, color: "var(--ncu-muted)" }}>{course.teacher}</span>
          {course.room && (
            <span
              style={{
                fontSize: 11,
                color: "var(--ncu-primary)",
                fontWeight: 700,
                background: "rgba(49, 87, 200, 0.08)",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {course.room}
            </span>
          )}
        </>
      )}
    </div>
  );
};

// ── Timetable Views ───────────────────────────────────────────

const TimetableMobileView = ({
  timetableData,
  selectedDay,
  onSelectDay,
  currentPeriodIndex,
  nextPeriodIndex,
  isToday,
}: Readonly<{
  timetableData: Record<string, Course>;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  currentPeriodIndex: number;
  nextPeriodIndex: number;
  isToday: boolean;
}>) => {
  const dayIndex = Number(selectedDay);
  const periodRefs = useRef<(HTMLIonItemElement | null)[]>([]);
  const dailyPeriods = periods.map((period, i) => ({
    period,
    course: timetableData[`${period.id}-${dayIndex}`],
    idx: i,
  }));

  const scrollToIndex = currentPeriodIndex >= 0 ? currentPeriodIndex : nextPeriodIndex;
  useEffect(() => {
    if (!isToday || scrollToIndex < 0) return;
    const timer = setTimeout(() => {
      periodRefs.current[scrollToIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [isToday, scrollToIndex, selectedDay]);

  return (
    <section className="timetable-mobile" aria-label="依日課表">
      <IonSegment
        value={selectedDay}
        onIonChange={(event) => onSelectDay(String(event.detail.value ?? "0"))}
        scrollable
      >
        {days.map((day, index) => (
          <IonSegmentButton key={day} value={String(index)}>
            <IonLabel>週{day}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
      <IonList className="timetable-course-list" inset>
        {dailyPeriods.map(({ period, course, idx }) => {
          const isCurrent = isToday && idx === currentPeriodIndex;
          const isNext = isToday && idx === nextPeriodIndex && idx !== currentPeriodIndex;
          return (
            <IonItem
              key={period.id}
              ref={(el) => { periodRefs.current[idx] = el; }}
              style={{
                ...(course?.isMyCourse ? { "--background": "var(--ncu-star-light)" } : {}),
                ...(isCurrent ? { borderLeft: "3px solid var(--ncu-primary)", "--min-height": "56px" } : {}),
                ...(isNext ? { borderLeft: "4px solid #0d7a3e", "--min-height": "56px" } : {}),
              } as React.CSSProperties}
            >
              <IonLabel>
                {course ? (
                  <>
                    <h2>
                      {course.isMyCourse && (
                        <IonIcon icon={star} style={{ color: "var(--ncu-star)", marginRight: 4, fontSize: "0.85em", verticalAlign: "middle" }} />
                      )}
                      {course.name}
                    </h2>
                    <p>
                      {course.teacher}{course.room ? ` · ${course.room}` : ""}
                    </p>
                  </>
                ) : (
                  <h2 style={{ color: "var(--ncu-muted)", fontWeight: 400 }}>空堂</h2>
                )}
              </IonLabel>
              <IonNote slot="end">
                {isCurrent && <span style={{ color: "var(--ncu-primary)", fontWeight: 700, fontSize: 12, display: "block", marginBottom: 2 }}>● NOW</span>}
                {isNext && <span style={{ color: "#0d7a3e", fontWeight: 700, fontSize: 12, display: "block", marginBottom: 2 }}>&#9654; NEXT</span>}
                {period.id === "N" ? "午休" : `第 ${period.id} 節`}<br />
                {period.time}
              </IonNote>
            </IonItem>
          );
        })}
      </IonList>
    </section>
  );
};

const TimetableDesktopView = ({ timetableData }: Readonly<{ timetableData: Record<string, Course> }>) => (
  <section
    className="timetable-desktop"
    aria-label="全週課表"
    style={{ maxWidth: 1140, margin: "0 auto", padding: "8px 0 32px" }}
  >
    <div
      style={{
        border: "2px solid var(--ncu-ink)",
        borderRadius: "var(--ncu-radius-md)",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "88px repeat(5, minmax(0, 1fr))",
        boxShadow: "var(--ncu-shadow-hard)",
      }}
    >
      <div style={{ ...cellBase, minHeight: 44, alignItems: "center", background: "var(--ncu-ink)", color: "#fff", fontWeight: 700, fontSize: 14 }}>
        節次
      </div>
      {days.map((day) => (
        <div key={day} style={{ ...cellBase, minHeight: 44, alignItems: "center", background: "var(--ncu-primary)", color: "#fff", fontWeight: 700, fontSize: 15 }}>
          週{day}
        </div>
      ))}
      {periods.map((period) => (
        <React.Fragment key={period.id}>
          <div style={{ ...cellBase, alignItems: "center", background: "var(--ncu-primary-light)", fontSize: 12, textAlign: "center", padding: "4px 2px" }}>
            <strong style={{ fontSize: 13, color: "var(--ncu-ink)" }}>
              {period.id === "N" ? "午休" : `第 ${period.id} 節`}
            </strong>
            <span style={{ color: "var(--ncu-muted)", marginTop: 2 }}>{period.time}</span>
          </div>
          {days.map((day, index) => (
            <CourseCell
              key={`${period.id}-${day}`}
              course={timetableData[`${period.id}-${index}`]}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  </section>
);

// ── Main Page ─────────────────────────────────────────────────

const TimetableHeader = ({
  authenticated,
  cisAuthenticated,
  onLogout,
  onRelinkCis,
}: Readonly<{ authenticated: boolean; cisAuthenticated: boolean; onLogout: () => void; onRelinkCis: () => void }>) => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/" text="" />
      </IonButtons>
      <IonTitle>碩士班課表</IonTitle>
      <IonButtons slot="end">
        {cisAuthenticated && (
          <IonButton size="small" onClick={onRelinkCis}>
            重新連結
          </IonButton>
        )}
        {authenticated && (
          <IonButton size="small" onClick={onLogout}>
            登出
          </IonButton>
        )}
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const TimetablePage = () => {
  const defaultDay = getDefaultDayIndex();
  const [selectedDay, setSelectedDay] = useState(String(defaultDay));
  const [authenticated, setAuthenticated] = useState(isLoggedIn());

  const [timetableData, setTimetableData] = useState<Record<string, Course>>(MOCK_TIMETABLE);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cisAuthenticated, setCisAuthenticated] = useState(isCisLoggedIn());
  const [showCisLogin, setShowCisLogin] = useState(false);

  const dayIndex = Number(selectedDay);
  const { current: currentPeriodIndex, next: nextPeriodIndex } = useMemo(
    () => getTimeIndicators(timetableData, dayIndex),
    [timetableData, dayIndex],
  );
  const isToday = useMemo(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 && Number(selectedDay) === d - 1;
  }, [selectedDay]);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const courses = await fetchSelectedCourses();
        if (!cancelled && courses.length > 0) {
          setTimetableData(buildTimetableFromApi(courses));
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(err instanceof Error ? err.message : "Failed to load courses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authenticated]);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
  }, []);

  useEffect(() => {
    if (!cisAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const courses = await fetchCisSelectedCourses();
        if (!cancelled && courses.length > 0) {
          const DAY_MAP: Record<string, number> = {
            "一": 0, "二": 1, "三": 2, "四": 3, "五": 4,
            "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4,
          };
          const result: Record<string, Course> = {};
          for (const c of courses) {
            for (const ct of c.classTimes) {
              let dayIdx = -1;
              let periodChars = "";
              if (ct.length >= 2 && ct[0] >= "1" && ct[0] <= "5") {
                dayIdx = parseInt(ct[0], 10) - 1;
                periodChars = ct.slice(1);
              } else {
                const dayMatch = ct.match(/^(Mon|Tue|Wed|Thu|Fri|[一二三四五])/);
                if (dayMatch) {
                  dayIdx = DAY_MAP[dayMatch[1]] ?? -1;
                  periodChars = ct.slice(dayMatch[0].length);
                }
              }
              if (dayIdx < 0) continue;
              for (const ch of periodChars) {
                const period = periods.find((p) => p.id === ch);
                if (!period) continue;
                result[`${period.id}-${dayIdx}`] = {
                  name: c.name, teacher: c.teacher, room: c.room, isMyCourse: true,
                };
              }
            }
          }
          if (Object.keys(result).length > 0) {
            setTimetableData(result);
          } else {
            cisLogout();
            setCisAuthenticated(false);
            setApiError("CIS 回傳的課程資料格式無法解析，請重新連結");
          }
        } else if (!cancelled) {
          cisLogout();
          setCisAuthenticated(false);
          setApiError("CIS Session 已過期，請重新連結");
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "CIS 載入失敗";
          setApiError(msg);
          cisLogout();
          setCisAuthenticated(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cisAuthenticated]);

  const handleCisLoginSuccess = useCallback(() => {
    setApiError(null);
    setCisAuthenticated(true);
  }, []);

  const handleRelinkCis = useCallback(() => {
    setShowCisLogin(true);
  }, []);

  const handleLogout = useCallback(() => {
    cisLogout();
    clearToken();
    setAuthenticated(false);
    setCisAuthenticated(false);
    setTimetableData(MOCK_TIMETABLE);
    setApiError(null);
  }, []);

  return (
    <IonPage>
      <TimetableHeader
        authenticated={authenticated}
        cisAuthenticated={cisAuthenticated}
        onLogout={handleLogout}
        onRelinkCis={handleRelinkCis}
      />
      <IonContent className="ion-padding timetable-content">
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          {!cisAuthenticated && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: 12,
                borderRadius: "var(--ncu-radius-md)",
                background: "var(--ncu-primary-light)",
                border: "1px solid var(--ncu-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <IonText>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <strong>連結課務系統</strong>
                  <br />
                  <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
                    貼上 JSESSIONID 以載入你的已選課程
                  </span>
                </p>
              </IonText>
              <IonButton size="small" onClick={() => setShowCisLogin(true)}>
                連結
              </IonButton>
            </div>
          )}
          {authenticated && !cisAuthenticated && (
            <div style={{ padding: "8px 12px", marginBottom: 8, borderRadius: "var(--ncu-radius-sm)", background: "var(--ncu-surface)", fontSize: 12, color: "var(--ncu-muted)" }}>
              已登入 Portal（OAuth API 暫不可用）
            </div>
          )}
          {loading && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <IonSpinner name="crescent" />
              <p style={{ fontSize: 12, color: "var(--ncu-muted)" }}>載入課程中…</p>
            </div>
          )}
          {apiError && (
            <div style={{ padding: "8px 12px", marginBottom: 8, borderRadius: "var(--ncu-radius-sm)", background: "var(--ncu-danger-light)", fontSize: 12, color: "var(--ncu-danger)" }}>
              ⚠ {apiError}（使用範例資料）
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
          <TimetableDesktopView timetableData={timetableData} />
        </div>
      </IonContent>
      <CisLoginModal
        isOpen={showCisLogin}
        onDismiss={() => setShowCisLogin(false)}
        onSuccess={handleCisLoginSuccess}
      />
    </IonPage>
  );
};

export default TimetablePage;
