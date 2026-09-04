import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonBadge,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import {
  checkmarkCircle,
  alertCircleOutline,
  refreshOutline,
  schoolOutline,
  bookOutline,
  ribbonOutline,
  flashOutline,
} from "ionicons/icons";
import { parseBookmarkletPayload } from "../services/cis-course-api";
import {
  TRACK_CONFIGS,
  GRADUATION_GATES,
  calculateTrackCredits,
  matchCisToCurriculum,
  type CurriculumCourse,
  type TrackType,
  type PrereqCourse,
  type CreditCalculationResult,
  type SectionCreditResult,
} from "../data/im-curriculum";
import CisLoginModal from "../components/CisLoginModal";

const STORAGE_KEY_TRACK = "ncu_credit_track";
const STORAGE_KEY_COURSES = "ncu_selected_credit_courses";
const STORAGE_KEY_PREREQS = "ncu_selected_prereqs";
const STORAGE_KEY_GATES = "ncu_selected_gates";

// ---------------------------------------------------------------------------
// Sub-components: Header & Top Controls
// ---------------------------------------------------------------------------

const CreditPageHeader = ({
  onOpenCisModal,
  onResetAll,
}: Readonly<{
  onOpenCisModal: () => void;
  onResetAll: () => void;
}>) => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/" text="" />
      </IonButtons>
      <IonTitle>115 碩士班學分試算</IonTitle>
      <IonButtons slot="end">
        <IonButton size="small" fill="outline" onClick={onOpenCisModal} style={{ fontWeight: 700, fontSize: 12 }}>
          <IonIcon slot="start" icon={flashOutline} />
          同步課務
        </IonButton>
        <IonButton fill="clear" size="small" color="medium" onClick={onResetAll} aria-label="重設全部">
          <IonIcon icon={refreshOutline} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const CURRICULUM_PDF_URL =
  "https://im.mgt.ncu.edu.tw/download/newpost/115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E5%85%A5%E5%AD%B8%E9%81%A9%E7%94%A8-%E8%B3%87%E7%AE%A1%E7%B3%BB%E7%A2%A9%E5%A3%AB%E7%8F%AD%E5%BF%85%E4%BF%AE%E5%8F%8A%E9%81%B8%E4%BF%AE%E7%A7%91%E7%9B%AE%E8%A1%A8-v1150609.pdf";

const TrackSelectorContent = ({
  track,
  onSelectTrack,
}: Readonly<{
  track: TrackType;
  onSelectTrack: (t: TrackType) => void;
}>) => (
  <>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        flexWrap: "wrap",
        gap: 6,
      }}
    >
      <span style={{ fontWeight: 700, color: "var(--ncu-ink)", fontSize: 15 }}>
        選擇修讀組別
      </span>
      <a
        href={CURRICULUM_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 12.5,
          color: "var(--ncu-primary)",
          textDecoration: "none",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <span>115 必選修科目表 PDF ↗</span>
      </a>
    </div>
    <IonSegment
      value={track}
      onIonChange={(e) => onSelectTrack(e.detail.value as TrackType)}
    >
      <IonSegmentButton value="mgmt">
        <IonLabel style={{ fontWeight: 700 }}>管理組 (33 學分)</IonLabel>
      </IonSegmentButton>
      <IonSegmentButton value="sys">
        <IonLabel style={{ fontWeight: 700 }}>資訊系統組 (30 學分)</IonLabel>
      </IonSegmentButton>
    </IonSegment>
  </>
);

const TrackSelectorCard = ({
  track,
  onSelectTrack,
}: Readonly<{
  track: TrackType;
  onSelectTrack: (t: TrackType) => void;
}>) => (
  <IonCard
    style={{
      margin: "0 0 16px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardContent style={{ padding: "12px 16px" }}>
      <TrackSelectorContent track={track} onSelectTrack={onSelectTrack} />
    </IonCardContent>
  </IonCard>
);

// ---------------------------------------------------------------------------
// Sub-components: Overview Credit Dashboard
// ---------------------------------------------------------------------------

const DashboardHeader = ({
  trackName,
  creditStats,
}: Readonly<{
  trackName: string;
  creditStats: CreditCalculationResult;
}>) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
    }}
  >
    <div>
      <IonCardSubtitle style={{ color: "var(--ncu-primary)", fontWeight: 700 }}>
        {trackName} 畢業學分試算
      </IonCardSubtitle>
      <IonCardTitle
        style={{
          fontSize: "var(--ncu-font-size-2xl)",
          fontWeight: 800,
          color: "var(--ncu-ink)",
        }}
      >
        {creditStats.totalEarnedCredits} / {creditStats.targetCredits} 學分
      </IonCardTitle>
    </div>
    <div>
      {creditStats.isGraduationEligible ? (
        <IonBadge color="success" style={{ fontSize: 14, padding: "6px 12px", fontWeight: 700 }}>
          🎉 應修學分已達標
        </IonBadge>
      ) : (
        <IonBadge color="warning" style={{ fontSize: 14, padding: "6px 12px", fontWeight: 700 }}>
          尚缺 {Math.max(0, creditStats.targetCredits - creditStats.totalEarnedCredits)} 學分
        </IonBadge>
      )}
    </div>
  </div>
);

const DashboardBody = ({
  creditStats,
}: Readonly<{
  creditStats: CreditCalculationResult;
}>) => (
  <>
    <IonProgressBar
      value={creditStats.progressPercentage / 100}
      color={creditStats.isGraduationEligible ? "success" : "primary"}
      style={{ height: 10, borderRadius: 5, marginBottom: 12 }}
    />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ncu-muted)" }}>
      <span>達成進度：{creditStats.progressPercentage}%</span>
      <span>最低畢業門檻：{creditStats.targetCredits} 學分</span>
    </div>
  </>
);

const CreditDashboardCard = ({
  trackName,
  creditStats,
}: Readonly<{
  trackName: string;
  creditStats: CreditCalculationResult;
}>) => (
  <IonCard
    style={{
      margin: "0 0 20px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
      background: "var(--ncu-surface)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 8 }}>
      <DashboardHeader trackName={trackName} creditStats={creditStats} />
    </IonCardHeader>
    <IonCardContent>
      <DashboardBody creditStats={creditStats} />
    </IonCardContent>
  </IonCard>
);

// ---------------------------------------------------------------------------
// Sub-components: Curriculum Course Sections
// ---------------------------------------------------------------------------

const CourseItemRow = ({
  course,
  isChecked,
  onToggle,
}: Readonly<{
  course: CurriculumCourse;
  isChecked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}>) => (
  <IonItem
    button
    detail={false}
    onClick={() => onToggle(course.id, !isChecked)}
    style={{
      "--background": isChecked ? "var(--ncu-primary-light)" : "var(--ncu-surface)",
      cursor: "pointer",
    }}
  >
    <IonCheckbox slot="start" checked={isChecked} style={{ pointerEvents: "none" }} />
    <IonLabel style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
          {course.name}
        </strong>
        {course.code && (
          <IonBadge color="light" style={{ fontSize: 11, border: "1px solid var(--ncu-border)" }}>
            {course.code}
          </IonBadge>
        )}
      </div>
    </IonLabel>
    <IonNote slot="end" style={{ fontWeight: 700, fontSize: 13, color: "var(--ncu-ink)" }}>
      {course.credits} 學分
    </IonNote>
  </IonItem>
);

const SectionHeaderContent = ({
  section,
  result,
}: Readonly<{
  section: (typeof TRACK_CONFIGS)[TrackType]["sections"][number];
  result?: SectionCreditResult;
}>) => (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: 800 }}>
          {section.title}
        </IonCardTitle>
        {result?.isMet ? (
          <IonBadge color="success">
            <IonIcon icon={checkmarkCircle} style={{ verticalAlign: "middle", marginRight: 2 }} />
            已達標 ({result.earned}/{result.target})
          </IonBadge>
        ) : (
          <IonBadge color="medium">
            需 {result?.target ?? section.requiredCredits} 學分 · 目前 {result?.earned ?? 0}
          </IonBadge>
        )}
      </div>
    </div>
    <IonCardSubtitle style={{ marginTop: 4, color: "var(--ncu-muted)", fontSize: 12 }}>
      {section.description}
    </IonCardSubtitle>
    {result?.hint && (
      <div style={{ marginTop: 6, fontSize: 12, color: "#d97706", display: "flex", alignItems: "center", gap: 4 }}>
        <IonIcon icon={alertCircleOutline} />
        <span>{result.hint}</span>
      </div>
    )}
  </>
);

const SectionCard = ({
  section,
  result,
  selectedCourseIds,
  onToggleCourse,
}: Readonly<{
  section: (typeof TRACK_CONFIGS)[TrackType]["sections"][number];
  result?: SectionCreditResult;
  selectedCourseIds: readonly string[];
  onToggleCourse: (id: string, checked: boolean) => void;
}>) => (
  <IonCard
    style={{
      margin: "0 0 16px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 6 }}>
      <SectionHeaderContent section={section} result={result} />
    </IonCardHeader>

    <IonCardContent style={{ padding: 0 }}>
      <IonList lines="full" style={{ padding: 0 }}>
        {section.courses.map((course) => (
          <CourseItemRow
            key={course.id}
            course={course}
            isChecked={selectedCourseIds.includes(course.id)}
            onToggle={onToggleCourse}
          />
        ))}
      </IonList>
    </IonCardContent>
  </IonCard>
);

// ---------------------------------------------------------------------------
// Sub-components: Prerequisites & Graduation Gates
// ---------------------------------------------------------------------------

const PrereqItemRow = ({
  course,
  isChecked,
  onToggle,
}: Readonly<{
  course: PrereqCourse;
  isChecked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}>) => (
  <IonItem
    button
    detail={false}
    onClick={() => onToggle(course.id, !isChecked)}
    style={{
      "--background": isChecked ? "var(--ncu-success-light)" : "var(--ncu-surface)",
      cursor: "pointer",
    }}
  >
    <IonCheckbox slot="start" checked={isChecked} style={{ pointerEvents: "none" }} />
    <IonLabel style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
          {course.name}
        </strong>
        {course.note && (
          <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>{course.note}</span>
        )}
      </div>
    </IonLabel>
    <IonNote
      slot="end"
      style={{
        fontWeight: 700,
        fontSize: 12,
        color: isChecked ? "#0d7a3e" : "var(--ncu-muted)",
      }}
    >
      {isChecked ? "✓ 已抵免/已修" : "未修"}
    </IonNote>
  </IonItem>
);

const PrereqSubPanel = ({
  title,
  courses,
  selectedPrereqIds,
  onTogglePrereq,
}: Readonly<{
  title: string;
  courses: readonly PrereqCourse[];
  selectedPrereqIds: readonly string[];
  onTogglePrereq: (id: string, checked: boolean) => void;
}>) => (
  <div style={{ marginBottom: 14 }}>
    <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "var(--ncu-ink)" }}>
      {title}
    </h4>
    <IonList
      lines="full"
      style={{
        padding: 0,
        border: "1.5px solid var(--ncu-border)",
        borderRadius: "var(--ncu-radius-md)",
        overflow: "hidden",
      }}
    >
      {courses.map((p) => (
        <PrereqItemRow
          key={p.id}
          course={p}
          isChecked={selectedPrereqIds.includes(p.id)}
          onToggle={onTogglePrereq}
        />
      ))}
    </IonList>
  </div>
);

const PrereqsCard = ({
  track,
  prereqs,
  selectedPrereqIds,
  onTogglePrereq,
}: Readonly<{
  track: TrackType;
  prereqs: (typeof TRACK_CONFIGS)[TrackType]["prereqs"];
  selectedPrereqIds: readonly string[];
  onTogglePrereq: (id: string, checked: boolean) => void;
}>) => (
  <IonCard
    style={{
      margin: "0 0 16px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IonIcon icon={schoolOutline} style={{ fontSize: 20, color: "var(--ncu-primary)" }} />
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: 800 }}>
          入學先修課程檢核
        </IonCardTitle>
      </div>
      <IonCardSubtitle style={{ marginTop: 4, color: "var(--ncu-muted)", fontSize: 12 }}>
        大學非本科或入學未曾修習者需補修（補修學分不計入畢業學分）
      </IonCardSubtitle>
    </IonCardHeader>

    <IonCardContent style={{ paddingTop: 8 }}>
      <PrereqSubPanel
        title="全所共同先修科目"
        courses={prereqs.common}
        selectedPrereqIds={selectedPrereqIds}
        onTogglePrereq={onTogglePrereq}
      />
      <PrereqSubPanel
        title={track === "mgmt" ? "管理組先修科目" : "資訊系統組先修科目"}
        courses={prereqs.track}
        selectedPrereqIds={selectedPrereqIds}
        onTogglePrereq={onTogglePrereq}
      />
    </IonCardContent>
  </IonCard>
);

const GraduationGatesCard = ({
  selectedGateIds,
  onToggleGate,
}: Readonly<{
  selectedGateIds: readonly string[];
  onToggleGate: (id: string, checked: boolean) => void;
}>) => (
  <IonCard
    style={{
      margin: "0 0 24px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IonIcon icon={ribbonOutline} style={{ fontSize: 20, color: "var(--ncu-primary)" }} />
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: 800 }}>
          畢業門檻與認證檢核
        </IonCardTitle>
      </div>
      <IonCardSubtitle style={{ marginTop: 4, color: "var(--ncu-muted)", fontSize: 12 }}>
        學術倫理、英文門檻與論文口試要求
      </IonCardSubtitle>
    </IonCardHeader>

    <IonCardContent style={{ padding: 0 }}>
      <IonList lines="full" style={{ padding: 0 }}>
        {GRADUATION_GATES.map((gate) => {
          const isChecked = selectedGateIds.includes(gate.id);
          return (
            <IonItem
              button
              detail={false}
              key={gate.id}
              onClick={() => onToggleGate(gate.id, !isChecked)}
              style={{
                "--background": isChecked ? "var(--ncu-success-light)" : "var(--ncu-surface)",
                cursor: "pointer",
              }}
            >
              <IonCheckbox slot="start" checked={isChecked} style={{ pointerEvents: "none" }} />
              <IonLabel style={{ margin: "10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
                    {gate.title}
                  </strong>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ncu-muted)" }}>
                  {gate.description}
                </p>
              </IonLabel>
              <IonNote
                slot="end"
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: isChecked ? "#0d7a3e" : "var(--ncu-muted)",
                }}
              >
                {isChecked ? "✓ 已通過" : "未通過"}
              </IonNote>
            </IonItem>
          );
        })}
      </IonList>
    </IonCardContent>
  </IonCard>
);

// ---------------------------------------------------------------------------
// Sub-components: Main Content Body
// ---------------------------------------------------------------------------

const CreditPageBody = ({
  track,
  onSelectTrack,
  currentConfig,
  creditStats,
  selectedCourseIds,
  onToggleCourse,
  selectedPrereqIds,
  onTogglePrereq,
  selectedGateIds,
  onToggleGate,
}: Readonly<{
  track: TrackType;
  onSelectTrack: (t: TrackType) => void;
  currentConfig: (typeof TRACK_CONFIGS)[TrackType];
  creditStats: CreditCalculationResult;
  selectedCourseIds: readonly string[];
  onToggleCourse: (id: string, checked: boolean) => void;
  selectedPrereqIds: readonly string[];
  onTogglePrereq: (id: string, checked: boolean) => void;
  selectedGateIds: readonly string[];
  onToggleGate: (id: string, checked: boolean) => void;
}>) => (
  <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <TrackSelectorCard track={track} onSelectTrack={onSelectTrack} />
      <CreditDashboardCard trackName={currentConfig.trackName} creditStats={creditStats} />

      <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "var(--ncu-ink)", display: "flex", alignItems: "center", gap: 6 }}>
        <IonIcon icon={bookOutline} />
        <span>課程學分要求</span>
      </h3>

      {currentConfig.sections.map((sec) => (
        <SectionCard
          key={sec.id}
          section={sec}
          result={creditStats.sectionResults[sec.id]}
          selectedCourseIds={selectedCourseIds}
          onToggleCourse={onToggleCourse}
        />
      ))}

      <PrereqsCard
        track={track}
        prereqs={currentConfig.prereqs}
        selectedPrereqIds={selectedPrereqIds}
        onTogglePrereq={onTogglePrereq}
      />

      <GraduationGatesCard
        selectedGateIds={selectedGateIds}
        onToggleGate={onToggleGate}
      />
    </div>
  </IonContent>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const CreditPage: React.FC = () => {
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [track, setTrack] = useState<TrackType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRACK);
    return saved === "sys" ? "sys" : "mgmt";
  });

  const [selectedCourseIds, setSelectedCourseIds] = useState<readonly string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedPrereqIds, setSelectedPrereqIds] = useState<readonly string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREREQS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedGateIds, setSelectedGateIds] = useState<readonly string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GATES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showCisModal, setShowCisModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRACK, track);
  }, [track]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(selectedCourseIds));
  }, [selectedCourseIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREREQS, JSON.stringify(selectedPrereqIds));
  }, [selectedPrereqIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GATES, JSON.stringify(selectedGateIds));
  }, [selectedGateIds]);

  const currentConfig = useMemo(() => TRACK_CONFIGS[track], [track]);

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      const payload = parseBookmarkletPayload(hash);
      if (!payload) return;
      try {
        const { currentCourses, historyCourses } = payload;

        if (currentCourses.length > 0) {
          localStorage.setItem("ncu_my_cis_courses", JSON.stringify(currentCourses));
        }

        if (historyCourses.length > 0) {
          const matchedIds = matchCisToCurriculum(historyCourses, currentConfig, track);
          setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...matchedIds])));
          presentToast({
            message: `🎉 成功同步！已匯入 ${historyCourses.length} 門歷年修課（自動配對 ${matchedIds.length} 門必選修）與本學期課表！`,
            duration: 4000,
            color: "success",
            position: "top",
          });
        }
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
  }, [currentConfig, track, presentToast]);
  const creditStats = useMemo(() => calculateTrackCredits(track, selectedCourseIds), [track, selectedCourseIds]);

  const toggleCourse = useCallback((courseId: string, checked: boolean) => {
    setSelectedCourseIds((prev) =>
      checked ? [...new Set([...prev, courseId])] : prev.filter((id) => id !== courseId),
    );
  }, []);

  const togglePrereq = useCallback((prereqId: string, checked: boolean) => {
    setSelectedPrereqIds((prev) =>
      checked ? [...new Set([...prev, prereqId])] : prev.filter((id) => id !== prereqId),
    );
  }, []);

  const toggleGate = useCallback((gateId: string, checked: boolean) => {
    setSelectedGateIds((prev) =>
      checked ? [...new Set([...prev, gateId])] : prev.filter((id) => id !== gateId),
    );
  }, []);

  const handleResetAll = useCallback(() => {
    presentAlert({
      header: "確定重設所有勾選？",
      message: "這將會清空您目前所有已勾選的課程、先修與畢業門檻紀錄。",
      buttons: [
        { text: "取消", role: "cancel" },
        {
          text: "確定重設",
          role: "destructive",
          handler: () => {
            setSelectedCourseIds([]);
            setSelectedPrereqIds([]);
            setSelectedGateIds([]);
            presentToast({ message: "已重設所有學分試算記錄", duration: 2000, color: "medium" });
          },
        },
      ],
    });
  }, [presentAlert, presentToast]);

  const handleOpenCisModal = useCallback(() => setShowCisModal(true), []);

  return (
    <IonPage>
      <CreditPageHeader
        onOpenCisModal={handleOpenCisModal}
        onResetAll={handleResetAll}
      />
      <CreditPageBody
        track={track}
        onSelectTrack={setTrack}
        currentConfig={currentConfig}
        creditStats={creditStats}
        selectedCourseIds={selectedCourseIds}
        onToggleCourse={toggleCourse}
        selectedPrereqIds={selectedPrereqIds}
        onTogglePrereq={togglePrereq}
        selectedGateIds={selectedGateIds}
        onToggleGate={toggleGate}
      />
      <CisLoginModal
        isOpen={showCisModal}
        onDismiss={() => setShowCisModal(false)}
      />
    </IonPage>
  );
};

export default CreditPage;
