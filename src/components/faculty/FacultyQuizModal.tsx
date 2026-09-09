import React, { useRef, useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonBadge,
} from "@ionic/react";
import {
  closeOutline,
  trophyOutline,
  schoolOutline,
  checkmarkCircle,
  closeCircle,
} from "ionicons/icons";
import type { TeacherProfile, MemeItem } from "../../types/faculty";
import teachersData from "../../data/im-teachers.json";
import memesData from "../../data/memes.json";
import { PointCloudCanvas } from "./PointCloudCanvas";
import { FacultyCompendiumModal } from "./FacultyCompendiumModal";
import { QuizResultCard } from "./QuizResultCard";
import { triggerConfetti } from "../../utils/confetti";
import { useFacultyQuiz } from "./useFacultyQuiz";
import { useModalHistorySync } from "../../utils/useModalHistorySync";
export { pickNextTarget, pickClaimedTeacher, generateQuestion, type QuizPhase } from "./useFacultyQuiz";

const allTeachers: readonly TeacherProfile[] = teachersData as readonly TeacherProfile[];
const allMemes: readonly MemeItem[] = memesData as readonly MemeItem[];

export const FacultyQuizModal: React.FC<{
  isOpen: boolean;
  onDismiss: () => void;
}> = ({ isOpen, onDismiss }) => {
  useModalHistorySync(isOpen, onDismiss, "faculty-quiz-modal");
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCancelRef = useRef<(() => void) | null>(null);
  const [showCompendium, setShowCompendium] = useState(false);

  useEffect(() => {
    return () => {
      confettiCancelRef.current?.();
      confettiCancelRef.current = null;
    };
  }, []);

  const handleDismiss = () => {
    confettiCancelRef.current?.();
    confettiCancelRef.current = null;
    onDismiss();
  };

  const {
    target,
    claimedTeacher,
    phase,
    streak,
    unlockedCount,
    unlockedIds,
    isCelebrating,
    nextRound,
    handleAligned,
    handleAnswer,
  } = useFacultyQuiz({
    teachers: allTeachers,
    memes: allMemes,
    isOpen,
    onSuccessReward: () => {
      confettiCancelRef.current?.();
      confettiCancelRef.current = triggerConfetti(confettiCanvasRef.current);
    },
  });

  if (!target || !claimedTeacher || !isOpen) return null;

  const isCompendiumComplete = allTeachers.every(teacher => unlockedIds.includes(teacher.id));

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>這是誰~</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleDismiss} aria-label="關閉">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ position: "relative" }}>
        {/* Confetti Overlay Canvas */}
        <canvas
          ref={confettiCanvasRef}
          width={window.innerWidth || 400}
          height={window.innerHeight || 700}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 100,
          }}
        />

        <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 24 }}>
          {/* Status Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IonBadge color="warning" style={{ fontSize: 13, padding: "4px 8px" }}>
                🔥 連勝 {streak}
              </IonBadge>
              <button
                type="button"
                onClick={() => setShowCompendium(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: isCompendiumComplete ? "linear-gradient(135deg, #fde68a, #f59e0b)" : "var(--ncu-primary)",
                  color: isCompendiumComplete ? "#78350f" : "#ffffff",
                  border: "none",
                  borderRadius: 16,
                  padding: "4px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: isCompendiumComplete ? "0 2px 8px rgba(245, 158, 11, 0.4)" : "0 2px 6px rgba(59, 130, 246, 0.3)",
                }}
                aria-label={isCompendiumComplete ? "全圖鑑達成，展開師資圖鑑" : "展開師資圖鑑"}
              >
                <IonIcon icon={trophyOutline} style={{ verticalAlign: "middle" }} />
                <span>{isCompendiumComplete ? "全圖鑑達成" : `圖鑑 ${unlockedCount} / ${allTeachers.length}`}</span>
              </button>
            </div>
          </div>

          {/* 3D Point Cloud Canvas */}
          <PointCloudCanvas
            key={target.data.id}
            item={target.data}
            isCelebrating={isCelebrating}
            onAligned={handleAligned}
          />

          {/* Phase 2: Verification Prompt */}
          {phase === "verifying" && (
            <div
              style={{
                marginTop: 14,
                background: "var(--ncu-surface)",
                border: "2px solid var(--ncu-primary)",
                borderRadius: "var(--ncu-radius-lg, 16px)",
                padding: "16px 18px",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)",
                animation: "popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--ncu-ink)",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <IonIcon icon={schoolOutline} style={{ color: "var(--ncu-primary)", fontSize: 20 }} />
                <span>這是{claimedTeacher.name}{claimedTeacher.title}嗎？</span>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <IonButton
                  color="success"
                  onClick={() => handleAnswer(true)}
                  style={{ fontWeight: 800, flex: 1, maxWidth: 140 }}
                >
                  <IonIcon slot="start" icon={checkmarkCircle} />
                  是
                </IonButton>
                <IonButton
                  color="danger"
                  onClick={() => handleAnswer(false)}
                  style={{ fontWeight: 800, flex: 1, maxWidth: 140 }}
                >
                  <IonIcon slot="start" icon={closeCircle} />
                  不是
                </IonButton>
              </div>
            </div>
          )}

          {/* Phase 3 & 4: Result Card */}
          {(phase === "success" || phase === "failed") && (
            <QuizResultCard
              target={target}
              claimedTeacher={claimedTeacher}
              phase={phase}
              onNext={nextRound}
            />
          )}
        </div>
      </IonContent>

      <FacultyCompendiumModal
        isOpen={showCompendium}
        onDismiss={() => setShowCompendium(false)}
        teachers={allTeachers}
        memes={allMemes}
        unlockedIds={unlockedIds}
      />
    </IonModal>
  );
};
