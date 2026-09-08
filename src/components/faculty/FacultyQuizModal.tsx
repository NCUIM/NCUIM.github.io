import React, { useState, useEffect, useCallback, useRef } from "react";
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
  arrowForwardOutline,
  mailOutline,
  businessOutline,
  schoolOutline,
} from "ionicons/icons";
import type { TeacherProfile, QuizQuestion } from "../../types/faculty";
import teachersData from "../../data/im-teachers.json";
import { PointCloudCanvas } from "./PointCloudCanvas";
import { FacultyCompendiumModal } from "./FacultyCompendiumModal";

const allTeachers: readonly TeacherProfile[] = teachersData as readonly TeacherProfile[];

const STORAGE_KEY_UNLOCKED = "ncu_faculty_quiz_unlocked";
const STORAGE_KEY_STREAK = "ncu_faculty_quiz_streak";

// Simple internal full-screen confetti effect
const triggerConfetti = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const count = 75;
  const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#fbbf24"];
  const pieces = Array.from({ length: count }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 12,
    gravity: 0.35 + Math.random() * 0.2,
    alpha: 1,
  }));

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha > 0 && p.y < canvas.height) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    frame++;
    if (alive > 0 && frame < 120) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  requestAnimationFrame(animate);
};

export const generateQuestion = (
  teachers: readonly TeacherProfile[],
  lastId?: string,
): QuizQuestion => {
  const eligible = teachers.filter((t) => t.id !== lastId);
  const target = eligible[Math.floor(Math.random() * eligible.length)] || teachers[0];

  const others = teachers.filter((t) => t.id !== target.id);
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  const distractors = shuffledOthers.slice(0, 3);

  const options = [target, ...distractors].sort(() => Math.random() - 0.5);

  return {
    teacher: target,
    options,
    clues: {
      specialties: target.specialtyTags.slice(0, 4),
      education: target.education,
      office: target.office,
    },
  };
};

export const FacultyQuizModal: React.FC<{
  isOpen: boolean;
  onDismiss: () => void;
}> = ({ isOpen, onDismiss }) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const completedRef = useRef(false);
  const [streak, setStreak] = useState(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY_STREAK) || 0);
    } catch {
      return 0;
    }
  });
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const unlockedCount = unlockedIds.length;
  const [showCompendium, setShowCompendium] = useState(false);

  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start new round
  const nextRound = useCallback(() => {
    if (allTeachers.length === 0) return;
    const newQ = generateQuestion(allTeachers, question?.teacher.id);
    setQuestion(newQ);
    completedRef.current = false;
    setIsCelebrating(false);
    setShowProfileCard(false);
  }, [question?.teacher.id]);

  useEffect(() => {
    if (!isOpen) {
      setQuestion(null);
      return;
    }
    if (isOpen && !question) {
      nextRound();
    }
  }, [isOpen, question, nextRound]);

  const handleAligned = () => {
    if (completedRef.current || !question || !isOpen) return;
    completedRef.current = true;
    setIsCelebrating(true);
    setShowProfileCard(true);
    const newStreak = streak + 1;
    setStreak(newStreak);
    try {
      localStorage.setItem(STORAGE_KEY_STREAK, String(newStreak));
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      const unlockedList: string[] = saved ? JSON.parse(saved) : [];
      if (!unlockedList.includes(question.teacher.id)) {
        unlockedList.push(question.teacher.id);
        localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedList));
        setUnlockedIds(unlockedList);
      }
    } catch {
      // Progress remains available for this session when storage is unavailable.
    }
    navigator.vibrate?.([30, 50, 60]);
    triggerConfetti(confettiCanvasRef.current);
  };

  if (!question || !isOpen) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>這是誰~</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onDismiss} aria-label="關閉">
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
                  background: "var(--ncu-primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 16,
                  padding: "4px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
                }}
                aria-label="展開師資圖鑑"
              >
                <IonIcon icon={trophyOutline} style={{ verticalAlign: "middle" }} />
                <span>圖鑑 {unlockedCount} / {allTeachers.length}</span>
              </button>
            </div>
            <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
              隨機抽取中大資管師資
            </span>
          </div>

          {/* 3D Point Cloud Canvas */}
          <PointCloudCanvas
            key={question.teacher.id}
            teacher={question.teacher}
            isCelebrating={isCelebrating}
            onAligned={handleAligned}
          />

          {/* Revealed Professor Card after Correct Answer */}
          {showProfileCard && (
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                border: "2px solid #22c55e",
                borderRadius: "var(--ncu-radius-lg, 16px)",
                padding: 16,
                boxShadow: "0 10px 25px rgba(34, 197, 94, 0.2)",
                animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <img
                  src={question.teacher.localPhotoUrl || question.teacher.photoUrl}
                  alt={question.teacher.name}
                  style={{
                    width: 72,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "2px solid #22c55e",
                    boxShadow: "var(--ncu-shadow-sm)",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ncu-ink)" }}>
                      {question.teacher.name}
                    </span>
                    <IonBadge color="success" style={{ fontSize: 11 }}>
                      {question.teacher.title}
                    </IonBadge>
                    {question.teacher.role && (
                      <IonBadge color="medium" style={{ fontSize: 11 }}>
                        {question.teacher.role}
                      </IonBadge>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <IonIcon icon={businessOutline} /> 研究室：{question.teacher.office || "管理二館"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <IonIcon icon={schoolOutline} /> {question.teacher.education}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ncu-primary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <IonIcon icon={mailOutline} /> {question.teacher.email}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 12, color: "var(--ncu-ink)", fontWeight: 700, marginBottom: 4 }}>
                  專長領域：
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {question.teacher.specialtyTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "rgba(34, 197, 94, 0.12)",
                        color: "#166534",
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14, textAlign: "center" }}>
                <IonButton
                  expand="block"
                  color="success"
                  onClick={nextRound}
                  style={{ fontWeight: 700 }}
                >
                  <IonIcon slot="end" icon={arrowForwardOutline} />
                  挑戰下一位教授（連勝中 🔥）
                </IonButton>
              </div>
            </div>
          )}
        </div>
      </IonContent>

      <FacultyCompendiumModal
        isOpen={showCompendium}
        onDismiss={() => setShowCompendium(false)}
        teachers={allTeachers}
        unlockedIds={unlockedIds}
      />
    </IonModal>
  );
};
