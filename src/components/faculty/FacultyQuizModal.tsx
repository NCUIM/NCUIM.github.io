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
  IonSpinner,
} from "@ionic/react";
import {
  closeOutline,
  trophyOutline,
  sparkles,
  bulbOutline,
  arrowForwardOutline,
  checkmarkCircle,
  mailOutline,
  businessOutline,
  schoolOutline,
} from "ionicons/icons";
import type { TeacherProfile, QuizQuestion } from "../../types/faculty";
import teachersData from "../../data/im-teachers.json";
import { PointCloudCanvas } from "./PointCloudCanvas";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [clueStep, setClueStep] = useState(1);
  const [streak, setStreak] = useState(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY_STREAK) || 0);
    } catch {
      return 0;
    }
  });
  const [unlockedCount, setUnlockedCount] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  });

  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start new round
  const nextRound = useCallback(() => {
    if (allTeachers.length === 0) return;
    const newQ = generateQuestion(allTeachers, question?.teacher.id);
    setQuestion(newQ);
    setSelectedId(null);
    setIsCorrect(null);
    setClueStep(1);
    setIsCelebrating(false);
    setShowProfileCard(false);
  }, [question?.teacher.id]);

  useEffect(() => {
    if (isOpen && !question) {
      nextRound();
    }
  }, [isOpen, question, nextRound]);

  const handleSelectOption = (chosen: TeacherProfile) => {
    if (isCorrect || !question) return;

    setSelectedId(chosen.id);

    if (chosen.id === question.teacher.id) {
      setIsCorrect(true);
      setIsCelebrating(true);

      const newStreak = streak + 1;
      setStreak(newStreak);
      try {
        localStorage.setItem(STORAGE_KEY_STREAK, String(newStreak));
        const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
        const unlockedList: string[] = saved ? JSON.parse(saved) : [];
        if (!unlockedList.includes(chosen.id)) {
          unlockedList.push(chosen.id);
          localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedList));
          setUnlockedCount(unlockedList.length);
        }
      } catch {
        // ignore
      }

      // Haptic
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 50, 60]);
      }

      // Confetti
      setTimeout(() => {
        triggerConfetti(confettiCanvasRef.current);
        setShowProfileCard(true);
      }, 500);
    } else {
      setIsCorrect(false);
      setStreak(0);
      try {
        localStorage.setItem(STORAGE_KEY_STREAK, "0");
      } catch {
        // ignore
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(80);
      }
    }
  };

  if (!question) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>3D 雲點猜教授</IonTitle>
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
              <IonBadge color="primary" style={{ fontSize: 13, padding: "4px 8px" }}>
                <IonIcon icon={trophyOutline} style={{ verticalAlign: "middle", marginRight: 3 }} />
                圖鑑 {unlockedCount} / {allTeachers.length}
              </IonBadge>
            </div>
            <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
              隨機抽取中大資管師資
            </span>
          </div>

          {/* 3D Point Cloud Canvas */}
          <PointCloudCanvas
            teacher={question.teacher}
            isCelebrating={isCelebrating}
          />

          {/* Clues Section */}
          <div
            style={{
              margin: "14px 0",
              background: "var(--ncu-surface)",
              border: "1.5px solid var(--ncu-border)",
              borderRadius: "var(--ncu-radius-md, 12px)",
              padding: "12px 14px",
              boxShadow: "var(--ncu-shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ fontSize: 14, color: "var(--ncu-ink)", display: "flex", alignItems: "center", gap: 4 }}>
                <IonIcon icon={bulbOutline} style={{ color: "#f59e0b" }} /> 關鍵線索
              </strong>
              {clueStep < 3 && !isCorrect && (
                <button
                  type="button"
                  onClick={() => setClueStep((s) => s + 1)}
                  style={{
                    border: "none",
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "var(--ncu-primary)",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  解鎖更多線索 (+1)
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              {/* Clue 1 */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "var(--ncu-muted)", flexShrink: 0 }}>💡 專長領域：</span>
                <span style={{ fontWeight: 600, color: "var(--ncu-ink)" }}>
                  {question.clues.specialties.join("、") || "資訊科技、管理決策"}
                </span>
              </div>

              {/* Clue 2 */}
              {clueStep >= 2 ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "var(--ncu-muted)", flexShrink: 0 }}>🎓 最高學歷：</span>
                  <span style={{ color: "var(--ncu-ink)" }}>{question.clues.education || "國立大學博士"}</span>
                </div>
              ) : (
                <div style={{ color: "var(--ncu-muted)", fontSize: 12, fontStyle: "italic" }}>
                  🔒 線索 2：點擊上方解鎖學歷提示
                </div>
              )}

              {/* Clue 3 */}
              {clueStep >= 3 ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "var(--ncu-muted)", flexShrink: 0 }}>🏢 研究室號：</span>
                  <span style={{ color: "var(--ncu-ink)" }}>{question.clues.office || "管理二館"}</span>
                </div>
              ) : (
                <div style={{ color: "var(--ncu-muted)", fontSize: 12, fontStyle: "italic" }}>
                  🔒 線索 3：點擊上方解鎖研究室位置
                </div>
              )}
            </div>
          </div>

          {/* Answer Choice Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {question.options.map((opt) => {
              const isPicked = selectedId === opt.id;
              const isTheTarget = opt.id === question.teacher.id;

              let btnBorder = "1.5px solid var(--ncu-border)";
              let btnBg = "var(--ncu-surface)";
              let btnColor = "var(--ncu-ink)";

              if (isPicked) {
                if (isCorrect) {
                  btnBg = "#dcfce7";
                  btnBorder = "2px solid #16a34a";
                  btnColor = "#15803d";
                } else {
                  btnBg = "#fee2e2";
                  btnBorder = "2px solid #dc2626";
                  btnColor = "#b91c1c";
                }
              } else if (isCorrect && isTheTarget) {
                btnBg = "#dcfce7";
                btnBorder = "2px solid #16a34a";
                btnColor = "#15803d";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={Boolean(isCorrect)}
                  style={{
                    border: btnBorder,
                    background: btnBg,
                    color: btnColor,
                    borderRadius: "var(--ncu-radius-md, 10px)",
                    padding: "12px 10px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: isCorrect ? "default" : "pointer",
                    boxShadow: "var(--ncu-shadow-sm)",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  {opt.name} {opt.title}
                </button>
              );
            })}
          </div>

          {/* Feedback & Result Card */}
          {selectedId && !isCorrect && (
            <div
              style={{
                textAlign: "center",
                padding: "8px 12px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                color: "#b91c1c",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              ❌ 猜錯囉！連勝歸零，再看仔細線索試試看！
            </div>
          )}

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
    </IonModal>
  );
};
