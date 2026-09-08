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
  checkmarkCircle,
  closeCircle,
  refreshOutline,
} from "ionicons/icons";
import type { TeacherProfile, MemeItem, QuizTarget, QuizQuestion } from "../../types/faculty";
import teachersData from "../../data/im-teachers.json";
import memesData from "../../data/memes.json";
import { PointCloudCanvas } from "./PointCloudCanvas";
import { FacultyCompendiumModal } from "./FacultyCompendiumModal";

const allTeachers: readonly TeacherProfile[] = teachersData as readonly TeacherProfile[];
const allMemes: readonly MemeItem[] = memesData as readonly MemeItem[];

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

export const pickNextTarget = (
  teachers: readonly TeacherProfile[],
  memes: readonly MemeItem[],
  lastId?: string,
): QuizTarget => {
  const pickTeacher = Math.random() < 0.5;
  if (pickTeacher && teachers.length > 0) {
    const eligible = teachers.filter((t) => t.id !== lastId);
    const chosen = eligible[Math.floor(Math.random() * eligible.length)] || teachers[0];
    return { type: "teacher", data: chosen };
  }
  if (memes.length > 0) {
    const eligible = memes.filter((m) => m.id !== lastId);
    const chosen = eligible[Math.floor(Math.random() * eligible.length)] || memes[0];
    return { type: "meme", data: chosen };
  }
  return { type: "teacher", data: teachers[0] };
};

// Kept for backward compatibility with existing tests
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

export type QuizPhase = "aligning" | "verifying" | "success" | "failed";

export const FacultyQuizModal: React.FC<{
  isOpen: boolean;
  onDismiss: () => void;
}> = ({ isOpen, onDismiss }) => {
  const [target, setTarget] = useState<QuizTarget | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("aligning");
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
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start new round
  const nextRound = useCallback(() => {
    if (allTeachers.length === 0 && allMemes.length === 0) return;
    const newTarget = pickNextTarget(allTeachers, allMemes, target?.data.id);
    setTarget(newTarget);
    completedRef.current = false;
    setPhase("aligning");
    setIsCelebrating(false);
  }, [target?.data.id]);

  useEffect(() => {
    if (!isOpen) {
      setTarget(null);
      return;
    }
    if (isOpen && !target) {
      nextRound();
    }
  }, [isOpen, target, nextRound]);

  const handleAligned = () => {
    if (completedRef.current || !target || !isOpen) return;
    completedRef.current = true;
    setPhase("verifying");
    navigator.vibrate?.(30);
  };

  const handleAnswer = (answeredIsTeacher: boolean) => {
    if (!target) return;
    const isActualTeacher = target.type === "teacher";
    const isCorrect = answeredIsTeacher === isActualTeacher;

    if (isCorrect) {
      setPhase("success");
      setIsCelebrating(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      try {
        localStorage.setItem(STORAGE_KEY_STREAK, String(newStreak));
        if (isActualTeacher) {
          const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
          const unlockedList: string[] = saved ? JSON.parse(saved) : [];
          if (!unlockedList.includes(target.data.id)) {
            unlockedList.push(target.data.id);
            localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedList));
            setUnlockedIds(unlockedList);
          }
        }
      } catch {
        // Storage unavailable
      }
      navigator.vibrate?.([40, 60, 80]);
      triggerConfetti(confettiCanvasRef.current);
    } else {
      setPhase("failed");
      setIsCelebrating(false);
      setStreak(0);
      try {
        localStorage.setItem(STORAGE_KEY_STREAK, "0");
      } catch {
        // Storage unavailable
      }
      navigator.vibrate?.([100, 50, 100]);
    }
  };

  if (!target || !isOpen) return null;

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
              隨機抽取教授或迷因貼圖
            </span>
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
                <span>他是教授嗎？</span>
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

          {/* Phase 3: Success Result */}
          {phase === "success" && (
            <div style={{ marginTop: 14 }}>
              {target.type === "teacher" ? (
                <div
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                    border: "2px solid #22c55e",
                    borderRadius: "var(--ncu-radius-lg, 16px)",
                    padding: 16,
                    boxShadow: "0 10px 25px rgba(34, 197, 94, 0.2)",
                    animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <img
                      src={target.data.localPhotoUrl || target.data.photoUrl}
                      alt={target.data.name}
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
                          {target.data.name}
                        </span>
                        <IonBadge color="success" style={{ fontSize: 11 }}>
                          {target.data.title}
                        </IonBadge>
                        {target.data.role && (
                          <IonBadge color="medium" style={{ fontSize: 11 }}>
                            {target.data.role}
                          </IonBadge>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <IonIcon icon={businessOutline} /> 研究室：{target.data.office || "管理二館"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <IonIcon icon={schoolOutline} /> {target.data.education}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ncu-primary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <IonIcon icon={mailOutline} /> {target.data.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 12, color: "var(--ncu-ink)", fontWeight: 700, marginBottom: 4 }}>
                      專長領域：
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {target.data.specialtyTags.map((tag) => (
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
                      下一位
                    </IonButton>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                    border: "2px solid #3b82f6",
                    borderRadius: "var(--ncu-radius-lg, 16px)",
                    padding: 16,
                    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.2)",
                    animation: "popIn 0.3s ease-out",
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <img
                      src={target.data.localPhotoUrl || target.data.photoUrl}
                      alt={target.data.name}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "contain",
                        borderRadius: 10,
                        background: "#f1f5f9",
                        padding: 4,
                        border: "2px solid #3b82f6",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ncu-ink)" }}>
                          {target.data.name}
                        </span>
                        <IonBadge color="primary" style={{ fontSize: 11 }}>
                          迷因貼圖
                        </IonBadge>
                      </div>
                      <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>
                        🎉 答對了，這是【{target.data.name}】！
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, textAlign: "center" }}>
                    <IonButton
                      expand="block"
                      color="primary"
                      onClick={nextRound}
                      style={{ fontWeight: 700 }}
                    >
                      <IonIcon slot="end" icon={arrowForwardOutline} />
                      下一題
                    </IonButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 4: Failed Result */}
          {phase === "failed" && (
            <div
              style={{
                marginTop: 14,
                background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
                border: "2px solid #ef4444",
                borderRadius: "var(--ncu-radius-lg, 16px)",
                padding: 16,
                boxShadow: "0 10px 25px rgba(239, 68, 68, 0.2)",
                animation: "popIn 0.3s ease-out",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <img
                  src={target.data.localPhotoUrl || target.data.photoUrl}
                  alt={target.data.name}
                  style={{
                    width: 72,
                    height: 80,
                    objectFit: target.type === "teacher" ? "cover" : "contain",
                    borderRadius: 10,
                    border: "2px solid #ef4444",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ncu-ink)" }}>
                      {target.data.name}
                    </span>
                    <IonBadge color="danger" style={{ fontSize: 11 }}>
                      答錯了
                    </IonBadge>
                  </div>
                  <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>
                    {target.type === "teacher"
                      ? `這是 ${target.data.name} 教授啦！記住囉 😉`
                      : `這不是教授，是【${target.data.name}】啦 🤣`}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <IonButton
                  expand="block"
                  color="medium"
                  onClick={nextRound}
                  style={{ fontWeight: 700 }}
                >
                  <IonIcon slot="end" icon={refreshOutline} />
                  再試一次
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
