import React, { useState, useMemo } from "react";
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
  lockClosedOutline,
  checkmarkCircle,
  businessOutline,
  schoolOutline,
  mailOutline,
} from "ionicons/icons";
import type { TeacherProfile, MemeItem } from "../../types/faculty";

export interface FacultyCompendiumModalProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
  readonly teachers: readonly TeacherProfile[];
  readonly memes?: readonly MemeItem[];
  readonly unlockedIds: readonly string[];
}

export const FacultyCompendiumModal: React.FC<FacultyCompendiumModalProps> = ({
  isOpen,
  onDismiss,
  teachers,
  memes = [],
  unlockedIds,
}) => {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);

  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const unlockedCount = teachers.filter((t) => unlockedSet.has(t.id)).length;
  const progressPercent = Math.round((unlockedCount / Math.max(1, teachers.length)) * 100);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const isUnlocked = unlockedSet.has(t.id);
      if (filter === "unlocked") return isUnlocked;
      if (filter === "locked") return !isUnlocked;
      return true;
    });
  }, [teachers, unlockedSet, filter]);

  if (!isOpen) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>圖鑑</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onDismiss} aria-label="關閉圖鑑">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 32 }}>
          {/* Progress Overview Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              color: "#ffffff",
              borderRadius: "var(--ncu-radius-lg, 16px)",
              padding: "16px 20px",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#fbbf24",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IonIcon icon={trophyOutline} style={{ fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>收集進度</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    解鎖 {unlockedCount} / {teachers.length} 位教授
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#38bdf8" }}>{progressPercent}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 8,
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #38bdf8 0%, #4ade80 100%)",
                  borderRadius: 99,
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: filter === "all" ? 700 : 500,
                background: filter === "all" ? "var(--ncu-primary)" : "var(--ncu-surface)",
                color: filter === "all" ? "#fff" : "var(--ncu-muted)",
                cursor: "pointer",
                boxShadow: filter === "all" ? "var(--ncu-shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              全部 ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unlocked")}
              style={{
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: filter === "unlocked" ? 700 : 500,
                background: filter === "unlocked" ? "#10b981" : "var(--ncu-surface)",
                color: filter === "unlocked" ? "#fff" : "var(--ncu-muted)",
                cursor: "pointer",
                boxShadow: filter === "unlocked" ? "var(--ncu-shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              已解鎖 ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("locked")}
              style={{
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: filter === "locked" ? 700 : 500,
                background: filter === "locked" ? "#64748b" : "var(--ncu-surface)",
                color: filter === "locked" ? "#fff" : "var(--ncu-muted)",
                cursor: "pointer",
                boxShadow: filter === "locked" ? "var(--ncu-shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              未解鎖 ({teachers.length - unlockedCount})
            </button>
          </div>

          {/* Teacher Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {filteredTeachers.map((teacher) => {
              const isUnlocked = unlockedSet.has(teacher.id);

              return (
                <button
                  type="button"
                  key={teacher.id}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) setSelectedTeacher(teacher);
                  }}
                  style={{
                    background: "var(--ncu-surface)",
                    border: isUnlocked ? "1.5px solid rgba(16, 185, 129, 0.35)" : "1.5px dashed var(--ncu-border)",
                    borderRadius: "var(--ncu-radius-md, 12px)",
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: isUnlocked ? "pointer" : "default",
                    position: "relative",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: isUnlocked ? "var(--ncu-shadow-sm)" : "none",
                    opacity: isUnlocked ? 1 : 0.72,
                    width: "100%",
                  }}
                >
                  {/* Photo / Silhouette Container */}
                  <div
                    style={{
                      width: 80,
                      height: 100,
                      borderRadius: 8,
                      overflow: "hidden",
                      marginBottom: 8,
                      background: isUnlocked ? "#e2e8f0" : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {isUnlocked ? (
                      <img
                        src={teacher.localPhotoUrl || teacher.photoUrl}
                        alt={teacher.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                        }}
                      >
                        <IonIcon icon={lockClosedOutline} style={{ fontSize: 28 }} />
                        <span style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>未解鎖</span>
                      </div>
                    )}
                  </div>

                  {/* Name & Title */}
                  <div style={{ fontWeight: 800, fontSize: 14, color: isUnlocked ? "var(--ncu-ink)" : "var(--ncu-muted)" }}>
                    {isUnlocked ? teacher.name : "？？？"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ncu-muted)", marginTop: 2 }}>
                    {isUnlocked ? teacher.title : "資管教授"}
                  </div>

                  {/* Tag / Status */}
                  <div style={{ marginTop: 6 }}>
                    {isUnlocked ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#059669",
                          background: "rgba(16, 185, 129, 0.12)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        <IonIcon icon={checkmarkCircle} /> 已解鎖
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--ncu-muted)",
                          background: "rgba(100, 116, 139, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        對準解鎖
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <section aria-label="迷因收藏" style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, color: "var(--ncu-ink)" }}>迷因收藏</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {memes.map(meme => {
                const isUnlocked = unlockedSet.has(`meme:${meme.id}`);
                return (
                  <div key={meme.id} style={{ padding: 12, textAlign: "center", background: "var(--ncu-surface)", borderRadius: 12, color: "var(--ncu-ink)" }}>
                    {isUnlocked ? (
                      <img src={meme.localPhotoUrl || meme.photoUrl} alt={meme.name} style={{ width: "100%", aspectRatio: "1", objectFit: "contain", borderRadius: 8 }} />
                    ) : (
                      <div style={{ padding: 24, color: "var(--ncu-muted)" }}><IonIcon icon={lockClosedOutline} /> 未解鎖</div>
                    )}
                    <div style={{ marginTop: 8, fontWeight: 700 }}>{isUnlocked ? meme.name : "？？？"}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Detail Modal for Selected Unlocked Teacher */}
          <IonModal
            isOpen={selectedTeacher !== null}
            onDidDismiss={() => setSelectedTeacher(null)}
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>{selectedTeacher?.name ?? "教授詳細資料"}</IonTitle>
                <IonButtons slot="end">
                  <IonButton fill="clear" onClick={() => setSelectedTeacher(null)} aria-label="關閉詳情">
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {selectedTeacher && (
                <div
                  style={{
                    background: "var(--ncu-surface)",
                    borderRadius: "var(--ncu-radius-lg, 16px)",
                    padding: 20,
                    maxWidth: 480,
                    margin: "20px auto",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <img
                      src={selectedTeacher.localPhotoUrl || selectedTeacher.photoUrl}
                      alt={selectedTeacher.name}
                      style={{
                        width: 80,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "2px solid #22c55e",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ncu-ink)" }}>
                          {selectedTeacher.name}
                        </span>
                        <IonBadge color="success" style={{ fontSize: 11 }}>
                          {selectedTeacher.title}
                        </IonBadge>
                        {selectedTeacher.role && (
                          <IonBadge color="medium" style={{ fontSize: 11 }}>
                            {selectedTeacher.role}
                          </IonBadge>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <IonIcon icon={businessOutline} /> 研究室：{selectedTeacher.office || "管理二館"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ncu-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <IonIcon icon={schoolOutline} /> {selectedTeacher.education}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ncu-primary)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <IonIcon icon={mailOutline} /> {selectedTeacher.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 12, color: "var(--ncu-ink)", fontWeight: 700, marginBottom: 6 }}>
                      專長領域：
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {selectedTeacher.specialtyTags.map((tag) => (
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
                </div>
              )}
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonModal>
  );
};
