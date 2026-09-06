import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import {
  refreshOutline,
  bookOutline,
  flashOutline,
} from "ionicons/icons";
import { parseBookmarkletPayload } from "../services/cis-course-api";
import { isIosHeaderMode } from "../services/platform";
import {
  TRACK_CONFIGS,
  calculateTrackCredits,
  matchCisToCurriculum,
  type TrackType,
  type CreditCalculationResult,
} from "../data/im-curriculum";
import CisLoginModal from "../components/CisLoginModal";
import TrackSelectorCard from "../components/credit/TrackSelectorCard";
import CreditDashboardCard from "../components/credit/CreditDashboardCard";
import SectionCard from "../components/credit/SectionCard";
import PrereqsCard from "../components/credit/PrereqsCard";
import GraduationGatesCard from "../components/credit/GraduationGatesCard";

const STORAGE_KEY_TRACK = "ncu_credit_track";
const STORAGE_KEY_COURSES = "ncu_selected_credit_courses";
const STORAGE_KEY_PREREQS = "ncu_selected_prereqs";
const STORAGE_KEY_GATES = "ncu_selected_gates";

// ---------------------------------------------------------------------------
// Sub-components: Header & Top Controls
// ---------------------------------------------------------------------------

export const CreditPageHeader = ({
  onOpenCisModal,
  onResetAll,
}: Readonly<{
  onOpenCisModal: () => void;
  onResetAll: () => void;
}>) => {
  // Cupertino centers the title across the full toolbar, so on iOS the primary
  // action flanks it on the leading side; md/Material keeps everything trailing.
  const primaryCisButton = (
    <IonButton
      size="small"
      fill="outline"
      onClick={onOpenCisModal}
      style={{ fontWeight: 700, fontSize: 12 }}
      aria-label="同步課務"
    >
      <IonIcon slot="start" icon={flashOutline} />
      <span className="responsive-label">同步課務</span>
    </IonButton>
  );
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/" text="" />
          {isIosHeaderMode() && primaryCisButton}
        </IonButtons>
        <IonTitle>學分試算</IonTitle>
        <IonButtons slot="end">
          {!isIosHeaderMode() && primaryCisButton}
          <IonButton fill="clear" size="small" color="medium" onClick={onResetAll} aria-label="重設全部">
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

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
