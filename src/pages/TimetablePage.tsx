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
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { isCisLoggedIn, cisLogout } from "../services/cis-login";
import { fetchCisSelectedCourses, type CisCourse } from "../services/cis-course-api";
import {
  fetchImMasterCourses,
  buildTimetableMapFromMasterCourses,
  type MasterCourseItem,
} from "../services/all-courses-api";
import { star, swapHorizontalOutline, linkOutline } from "ionicons/icons";
import CisLoginModal from "../components/CisLoginModal";

// ── Types ─────────────────────────────────────────────────────

export interface Course {
  readonly id?: string;
  readonly classNo?: string;
  readonly name: string;
  readonly teacher: string;
  readonly room?: string;
  readonly courseType?: "REQUIRED" | "ELECTIVE" | string;
  readonly credit?: number;
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

// ── Helpers ───────────────────────────────────────────────────

function getDefaultDayIndex(): number {
  const d = new Date().getDay();
  if (d >= 1 && d <= 5) return d - 1;
  return 0;
}

function getTimeIndicators(
  timetableData: Record<string, Course[]>,
  dayIndex: number,
): { current: number; next: number } {
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
    const courses = timetableData[`${periods[i].id}-${dayIndex}`];
    const hasCourse = Boolean(courses && courses.length > 0);
    if (mins >= start && mins < end && hasCourse) {
      current = i;
    } else if (next === -1 && mins < start && hasCourse) {
      next = i;
    }
  }
  return { current, next };
}

function matchCisCourse(master: MasterCourseItem, myCourses: readonly CisCourse[]): { isMine: boolean; room?: string } {
  const matched = myCourses.find((c) => {
    if (c.serialNo && String(master.serialNo) === String(c.serialNo)) {
      return true;
    }
    if (c.classNo && master.classNo && c.classNo === master.classNo) {
      return true;
    }
    const sameTitle = c.name.trim() === master.title.trim();
    const sameTeacher = master.teachers.some(
      (t) => t.trim() && (c.teacher.includes(t.trim()) || t.trim().includes(c.teacher.trim())),
    );
    return sameTitle && sameTeacher;
  });

  return {
    isMine: Boolean(matched),
    room: matched?.room || master.room,
  };
}

function mapMasterCourseToCourse(
  c: MasterCourseItem,
  myCourses: readonly CisCourse[],
): Course {
  const { isMine, room } = matchCisCourse(c, myCourses);
  return {
    id: String(c.serialNo),
    classNo: c.classNo,
    name: c.title,
    teacher: c.teachers.join(", "),
    room: room || c.room,
    courseType: c.courseType,
    credit: c.credit,
    isMyCourse: isMine,
  };
}

// ── Styles ────────────────────────────────────────────────────

const cellBase: React.CSSProperties = {
  border: "1px solid var(--ncu-border)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 76,
  overflow: "hidden",
};

// ── Sub-components ────────────────────────────────────────────

const SingleCourseCell = ({ course }: Readonly<{ course: Course }>) => {
  const isMine = course.isMyCourse ?? false;
  const isRequired = course.courseType === "REQUIRED";
  return (
    <div
      style={{
        ...cellBase,
        alignItems: "center",
        padding: "8px 6px",
        textAlign: "center",
        background: isMine
          ? "var(--ncu-star-light)"
          : isRequired
            ? "var(--ncu-primary-light)"
            : "var(--ncu-surface)",
        border: isMine
          ? "2px solid var(--ncu-star)"
          : "1px solid var(--ncu-border)",
        gap: 3,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
        {isMine && (
          <IonIcon
            icon={star}
            style={{ color: "var(--ncu-star)", fontSize: 13, flexShrink: 0 }}
          />
        )}
        <strong
          style={{
            fontSize: 13,
            lineHeight: 1.3,
            color: isMine
              ? "var(--ncu-ink)"
              : isRequired
                ? "var(--ncu-primary)"
                : "var(--ncu-ink)",
          }}
        >
          {course.name}
        </strong>
      </div>
      <span style={{ fontSize: 11, color: "var(--ncu-muted)" }}>
        {course.teacher}
      </span>
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
    </div>
  );
};

const CourseMiniCard = ({ course }: Readonly<{ course: Course }>) => {
  const isMine = course.isMyCourse ?? false;
  const isRequired = course.courseType === "REQUIRED";
  return (
    <div
      style={{
        padding: "5px 6px",
        borderRadius: "var(--ncu-radius-sm)",
        background: isMine
          ? "var(--ncu-star-light)"
          : isRequired
            ? "var(--ncu-primary-light)"
            : "var(--ncu-surface)",
        border: isMine
          ? "1.5px solid var(--ncu-star)"
          : isRequired
            ? "1.5px solid var(--ncu-primary)"
            : "1px solid var(--ncu-border)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        textAlign: "center",
        boxShadow: isMine ? "0 1px 3px rgba(255, 212, 90, 0.4)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
        {isMine && (
          <IonIcon
            icon={star}
            style={{ color: "var(--ncu-star)", fontSize: 11, flexShrink: 0 }}
          />
        )}
        <strong
          style={{
            fontSize: 12,
            lineHeight: 1.25,
            color: isMine
              ? "var(--ncu-ink)"
              : isRequired
                ? "var(--ncu-primary)"
                : "var(--ncu-ink)",
          }}
        >
          {course.name}
        </strong>
      </div>
      <span style={{ fontSize: 10, color: "var(--ncu-muted)" }}>
        {course.teacher}
      </span>
      {course.room && (
        <span
          style={{
            fontSize: 9,
            color: "var(--ncu-primary)",
            fontWeight: 700,
            background: "rgba(49, 87, 200, 0.08)",
            padding: "1px 5px",
            borderRadius: 2,
            alignSelf: "center",
          }}
        >
          {course.room}
        </span>
      )}
    </div>
  );
};

const MultiCourseCell = ({ courses }: Readonly<{ courses: readonly Course[] }>) => (
  <div
    style={{
      ...cellBase,
      padding: "4px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      background: "var(--ncu-surface)",
    }}
  >
    {courses.map((course) => (
      <CourseMiniCard
        key={course.id || `${course.name}-${course.teacher}`}
        course={course}
      />
    ))}
  </div>
);

const CourseCell = ({ courses }: Readonly<{ courses?: readonly Course[] }>) => {
  if (!courses || courses.length === 0) {
    return <div style={{ ...cellBase, background: "var(--ncu-surface)" }} />;
  }

  if (courses.length === 1) {
    return <SingleCourseCell course={courses[0]} />;
  }

  return <MultiCourseCell courses={courses} />;
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
  timetableData: Record<string, Course[]>;
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
    courses: timetableData[`${period.id}-${dayIndex}`] || [],
    idx: i,
  }));

  const scrollToIndex =
    currentPeriodIndex >= 0 ? currentPeriodIndex : nextPeriodIndex;
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
        style={{ marginBottom: 8 }}
      >
        {days.map((day, index) => (
          <IonSegmentButton key={day} value={String(index)}>
            <IonLabel>週{day}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
      <IonList className="timetable-course-list" inset>
        {dailyPeriods.map(({ period, courses, idx }) => {
          const isCurrent = isToday && idx === currentPeriodIndex;
          const isNext =
            isToday && idx === nextPeriodIndex && idx !== currentPeriodIndex;

          if (courses.length === 0) {
            return (
              <IonItem
                key={period.id}
                ref={(el) => {
                  periodRefs.current[idx] = el;
                }}
              >
                <IonLabel>
                  <h2 style={{ color: "var(--ncu-muted)", fontWeight: 400 }}>
                    空堂
                  </h2>
                </IonLabel>
                <IonNote slot="end">
                  {period.id === "N" ? "午休" : `第 ${period.id} 節`}
                  <br />
                  {period.time}
                </IonNote>
              </IonItem>
            );
          }

          return courses.map((course, cIdx) => (
            <IonItem
              key={`${period.id}-${course.name}-${course.teacher}`}
              ref={(el) => {
                if (cIdx === 0) periodRefs.current[idx] = el;
              }}
              style={
                {
                  ...(course.isMyCourse
                    ? { "--background": "var(--ncu-star-light)" }
                    : {}),
                  ...(isCurrent
                    ? {
                        borderLeft: "3px solid var(--ncu-primary)",
                        "--min-height": "56px",
                      }
                    : {}),
                  ...(isNext
                    ? {
                        borderLeft: "4px solid #0d7a3e",
                        "--min-height": "56px",
                      }
                    : {}),
                } as React.CSSProperties
              }
            >
              <IonLabel>
                <h2>
                  {course.isMyCourse && (
                    <IonIcon
                      icon={star}
                      style={{
                        color: "var(--ncu-star)",
                        marginRight: 4,
                        fontSize: "0.85em",
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                  {course.name}
                  {course.courseType === "REQUIRED" && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--ncu-primary)",
                        marginLeft: 6,
                        fontWeight: 700,
                      }}
                    >
                      [必修]
                    </span>
                  )}
                </h2>
                <p>
                  {course.teacher}
                  {course.room ? ` · ${course.room}` : ""}
                  {course.credit ? ` (${course.credit}學分)` : ""}
                </p>
              </IonLabel>
              <IonNote slot="end">
                {isCurrent && (
                  <span
                    style={{
                      color: "var(--ncu-primary)",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    ● NOW
                  </span>
                )}
                {isNext && (
                  <span
                    style={{
                      color: "#0d7a3e",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    &#9654; NEXT
                  </span>
                )}
                {period.id === "N" ? "午休" : `第 ${period.id} 節`}
                <br />
                {period.time}
              </IonNote>
            </IonItem>
          ));
        })}
      </IonList>
    </section>
  );
};

const TimetableDesktopView = ({
  timetableData,
}: Readonly<{ timetableData: Record<string, Course[]> }>) => (
  <section
    className="timetable-desktop"
    aria-label="全週課表"
    style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 0 32px" }}
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
      <div
        style={{
          ...cellBase,
          minHeight: 44,
          alignItems: "center",
          background: "var(--ncu-ink)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        節次
      </div>
      {days.map((day) => (
        <div
          key={day}
          style={{
            ...cellBase,
            minHeight: 44,
            alignItems: "center",
            background: "var(--ncu-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          週{day}
        </div>
      ))}
      {periods.map((period) => (
        <React.Fragment key={period.id}>
          <div
            style={{
              ...cellBase,
              alignItems: "center",
              background: "var(--ncu-primary-light)",
              fontSize: 12,
              textAlign: "center",
              padding: "6px 2px",
            }}
          >
            <strong style={{ fontSize: 13, color: "var(--ncu-ink)" }}>
              {period.id === "N" ? "午休" : `第 ${period.id} 節`}
            </strong>
            <span style={{ color: "var(--ncu-muted)", marginTop: 2 }}>
              {period.time}
            </span>
          </div>
          {days.map((day, index) => (
            <CourseCell
              key={`${period.id}-${day}`}
              courses={timetableData[`${period.id}-${index}`]}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  </section>
);

// ── Main Page ─────────────────────────────────────────────────

const TimetableHeader = ({
  cisAuthenticated,
  viewScope,
  enrolledCount,
  onToggleViewScope,
  onOpenCisModal,
  onLogout,
}: Readonly<{
  cisAuthenticated: boolean;
  viewScope: "all" | "mine";
  enrolledCount: number;
  onToggleViewScope: () => void;
  onOpenCisModal: () => void;
  onLogout: () => void;
}>) => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/" text="" />
      </IonButtons>
      <IonTitle>{viewScope === "mine" ? "我的課表" : "碩士班課表"}</IonTitle>
      <IonButtons slot="end">
        {cisAuthenticated ? (
          <>
            <IonButton
              fill={viewScope === "mine" ? "solid" : "outline"}
              size="small"
              onClick={onToggleViewScope}
              style={{ fontSize: 12 }}
            >
              <IonIcon slot="start" icon={swapHorizontalOutline} />
              {viewScope === "mine" ? `我的 (${enrolledCount})` : "全所開課"}
            </IonButton>
            <IonButton size="small" fill="clear" onClick={onOpenCisModal}>
              重新連結
            </IonButton>
            <IonButton size="small" fill="clear" onClick={onLogout} color="medium">
              登出
            </IonButton>
          </>
        ) : (
          <IonButton size="small" fill="outline" onClick={onOpenCisModal}>
            <IonIcon slot="start" icon={linkOutline} />
            連結課表
          </IonButton>
        )}
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const TimetablePage = () => {
  const defaultDay = getDefaultDayIndex();
  const [selectedDay, setSelectedDay] = useState(String(defaultDay));
  const [viewScope, setViewScope] = useState<"all" | "mine">("all");

  const [masterCourses, setMasterCourses] = useState<MasterCourseItem[]>([]);
  const [myCisCourses, setMyCisCourses] = useState<CisCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cisAuthenticated, setCisAuthenticated] = useState(isCisLoggedIn());
  const [showCisLogin, setShowCisLogin] = useState(false);

  // Load default master courses (IM5000+ from S3 all.json)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const courses = await fetchImMasterCourses();
        if (!cancelled && courses.length > 0) {
          setMasterCourses(courses);
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            err instanceof Error ? err.message : "載入碩士班課程資料失敗",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch courses from CIS session when user links their session
  useEffect(() => {
    if (!cisAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const courses = await fetchCisSelectedCourses();
        if (!cancelled && courses.length > 0) {
          setMyCisCourses(courses);
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
    return () => {
      cancelled = true;
    };
  }, [cisAuthenticated]);

  // Combine master courses with user selection & filter by viewScope
  const timetableData = useMemo(() => {
    const map = buildTimetableMapFromMasterCourses(masterCourses);
    const result: Record<string, Course[]> = {};

    for (const [key, list] of Object.entries(map)) {
      const mapped = list.map((c) => mapMasterCourseToCourse(c, myCisCourses));
      result[key] = viewScope === "mine" ? mapped.filter((c) => c.isMyCourse) : mapped;
    }

    return result;
  }, [masterCourses, myCisCourses, viewScope]);

  const enrolledCount = useMemo(() => {
    return myCisCourses.length;
  }, [myCisCourses]);

  const dayIndex = Number(selectedDay);
  const { current: currentPeriodIndex, next: nextPeriodIndex } = useMemo(
    () => getTimeIndicators(timetableData, dayIndex),
    [timetableData, dayIndex],
  );
  const isToday = useMemo(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 && Number(selectedDay) === d - 1;
  }, [selectedDay]);

  const handleToggleViewScope = useCallback(() => {
    setViewScope((v) => (v === "mine" ? "all" : "mine"));
  }, []);

  const handleCisLoginSuccess = useCallback(() => {
    setApiError(null);
    setCisAuthenticated(true);
    setViewScope("mine");
  }, []);

  const handleOpenCisModal = useCallback(() => {
    setShowCisLogin(true);
  }, []);

  const handleLogout = useCallback(() => {
    cisLogout();
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
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
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
