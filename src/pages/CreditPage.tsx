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
import { isIosHeaderMode } from "../services/platform";
import {
  TRACK_CONFIGS,
  calculateTrackCredits,
  type TrackType,
  type CreditCalculationResult,
} from "../data/im-curriculum";
import {
  getStoredTrack,
  setStoredTrack,
  getStoredSelectedCourses,
  setStoredSelectedCourses,
  getStoredPrereqs,
  setStoredPrereqs,
  getStoredGates,
  setStoredGates,
  clearCreditStorage,
} from "../services/cis-storage";
import { useCisBookmarkletSync } from "../utils/useCisBookmarkletSync";
import CisLoginModal from "../components/CisLoginModal";
import {
  isModalDismissCooldown,
  markModalDismissed,
} from "../utils/useModalHistorySync";
import TrackSelectorCard from "../components/credit/TrackSelectorCard";
import CreditDashboardCard from "../components/credit/CreditDashboardCard";
import SectionCard from "../components/credit/SectionCard";
import PrereqsCard from "../components/credit/PrereqsCard";
import GraduationGatesCard from "../components/credit/GraduationGatesCard";

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

  const [track, setTrack] = useState<TrackType>(() => getStoredTrack());
  const [selectedCourseIds, setSelectedCourseIds] = useState<readonly string[]>(() =>
    getStoredSelectedCourses(),
  );
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<readonly string[]>(() =>
    getStoredPrereqs(),
  );
  const [selectedGateIds, setSelectedGateIds] = useState<readonly string[]>(() =>
    getStoredGates(),
  );

  const [showCisModal, setShowCisModal] = useState(false);

  useEffect(() => {
    setStoredTrack(track);
  }, [track]);

  useEffect(() => {
    setStoredSelectedCourses(selectedCourseIds);
  }, [selectedCourseIds]);

  useEffect(() => {
    setStoredPrereqs(selectedPrereqIds);
  }, [selectedPrereqIds]);

  useEffect(() => {
    setStoredGates(selectedGateIds);
  }, [selectedGateIds]);

  const currentConfig = useMemo(() => TRACK_CONFIGS[track], [track]);

  useCisBookmarkletSync({
    currentTrack: track,
    onSyncSuccess: (_payload, matchedIds) => {
      if (matchedIds.length > 0) {
        setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...matchedIds])));
      }
    },
  });
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
            clearCreditStorage();
            presentToast({ message: "已重設所有學分試算記錄", duration: 2000, color: "medium" });
          },
        },
      ],
    });
  }, [presentAlert, presentToast]);

  const handleOpenCisModal = useCallback(() => {
    if (isModalDismissCooldown()) return;
    setShowCisModal(true);
  }, []);

  const handleDismissCisModal = useCallback(() => {
    markModalDismissed();
    setShowCisModal(false);
  }, []);

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
        onDismiss={handleDismissCisModal}
      />
    </IonPage>
  );
};

export default CreditPage;
