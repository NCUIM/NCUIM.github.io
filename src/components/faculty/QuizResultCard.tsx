import React from "react";
import { IonBadge, IonButton, IonIcon } from "@ionic/react";
import {
  arrowForwardOutline,
  businessOutline,
  mailOutline,
  refreshOutline,
  schoolOutline,
} from "ionicons/icons";
import type { QuizTarget, TeacherProfile } from "../../types/faculty";

interface QuizResultCardProps {
  target: QuizTarget;
  claimedTeacher: TeacherProfile;
  phase: "success" | "failed";
  onNext: () => void;
}

const getQuizFailedFeedback = (
  target: QuizTarget,
  claimedTeacher: TeacherProfile,
): string => {
  if (target.type !== "teacher") {
    return `這不是${claimedTeacher.name}${claimedTeacher.title} 🤣`;
  }
  if (target.data.id === claimedTeacher.id) {
    return `這位就是${claimedTeacher.name}${claimedTeacher.title} 😉`;
  }
  return `這位是${target.data.name}${target.data.title}，不是${claimedTeacher.name}${claimedTeacher.title}`;
};

export const QuizResultCard: React.FC<QuizResultCardProps> = ({
  target,
  claimedTeacher,
  phase,
  onNext,
}) => {
  if (phase === "success") {
    if (target.type === "teacher") {
      const teacher = target.data;
      return (
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
              src={teacher.localPhotoUrl || teacher.photoUrl}
              alt={teacher.name}
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
                  {teacher.name}
                </span>
                <IonBadge color="success" style={{ fontSize: 11 }}>
                  {teacher.title}
                </IonBadge>
                {teacher.role && (
                  <IonBadge color="medium" style={{ fontSize: 11 }}>
                    {teacher.role}
                  </IonBadge>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <IonIcon icon={businessOutline} /> 研究室：{teacher.office || "管理二館"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <IonIcon icon={schoolOutline} /> {teacher.education}
              </div>
              <div style={{ fontSize: 12, color: "var(--ncu-primary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <IonIcon icon={mailOutline} /> {teacher.email}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "var(--ncu-ink)", fontWeight: 700, marginBottom: 4 }}>
              專長領域：
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {teacher.specialtyTags.map((tag) => (
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
              onClick={onNext}
              style={{ fontWeight: 700 }}
            >
              <IonIcon slot="end" icon={arrowForwardOutline} />
              下一位
            </IonButton>
          </div>
        </div>
      );
    }

    // Meme success
    const meme = target.data;
    return (
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
            src={meme.localPhotoUrl || meme.photoUrl}
            alt={meme.name}
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
                {meme.name}
              </span>
              <IonBadge color="primary" style={{ fontSize: 11 }}>
                迷因貼圖
              </IonBadge>
            </div>
            <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>
              🎉 答對了！
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <IonButton
            expand="block"
            color="primary"
            onClick={onNext}
            style={{ fontWeight: 700 }}
          >
            <IonIcon slot="end" icon={arrowForwardOutline} />
            下一題
          </IonButton>
        </div>
      </div>
    );
  }

  // Failed
  return (
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
            {getQuizFailedFeedback(target, claimedTeacher)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <IonButton
          expand="block"
          color="medium"
          onClick={onNext}
          style={{ fontWeight: 700 }}
        >
          <IonIcon slot="end" icon={refreshOutline} />
          再試一次
        </IonButton>
      </div>
    </div>
  );
};
