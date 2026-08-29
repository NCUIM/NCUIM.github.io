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
  syncOutline,
  refreshOutline,
  schoolOutline,
  bookOutline,
  ribbonOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import { cisLogout, isCisLoggedIn } from "../services/cis-login";
import { fetchCisCourseHistory, type CisCourse } from "../services/cis-course-api";
import {
  TRACK_CONFIGS,
  GRADUATION_GATES,
  calculateTrackCredits,
  isSystemTrackFreeElectiveCode,
  type CurriculumCourse,
  type TrackType,
  type PrereqCourse,
} from "../data/im-curriculum";
import CisLoginModal from "../components/CisLoginModal";

const STORAGE_KEY_TRACK = "ncu_credit_track";
const STORAGE_KEY_COURSES = "ncu_selected_credit_courses";
const STORAGE_KEY_PREREQS = "ncu_selected_prereqs";
const STORAGE_KEY_GATES = "ncu_selected_gates";

const NORM_RE = /[\s\-_()（）]/gu;
const norm = (s: string) => s.replace(NORM_RE, "");

function matchesCurriculumCourse(cis: CisCourse, course: CurriculumCourse): boolean {
  const codeMatch = Boolean(cis.classNo && course.code) &&
    (cis.classNo.includes(course.code) || course.code.includes(cis.classNo));
  const [a, b] = [norm(cis.name), norm(course.name)];
  const nameMatch = a.length >= 2 && b.length >= 2 && (a.includes(b) || b.includes(a));
  return codeMatch || nameMatch;
}

function matchCisToCurriculum(
  cisCourses: readonly CisCourse[],
  config: (typeof TRACK_CONFIGS)[TrackType],
  track: TrackType,
): string[] {
  const ids: string[] = [];
  for (const section of config.sections) {
    for (const c of section.courses) {
      if (cisCourses.some((cis) => matchesCurriculumCourse(cis, c))) {
        ids.push(c.id);
      }
    }
  }
  if (
    track === "sys" &&
    cisCourses.some(
      (cis) =>
        isSystemTrackFreeElectiveCode(cis.classNo) &&
        !config.sections.some((s) =>
          s.courses.some((course) => matchesCurriculumCourse(cis, course)),
        ),
    )
  ) {
    ids.push("IM_FREE");
  }
  return ids;
}

const CreditPage: React.FC = () => {
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // Track selection (mgmt / sys)
  const [track, setTrack] = useState<TrackType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRACK);
    return saved === "sys" ? "sys" : "mgmt";
  });

  // Selected courses
  const [selectedCourseIds, setSelectedCourseIds] = useState<readonly string[]>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_COURSES);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  // Selected prerequisites
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<readonly string[]>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PREREQS);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  // Completed graduation gates
  const [selectedGateIds, setSelectedGateIds] = useState<readonly string[]>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_GATES);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  const [showCisModal, setShowCisModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cisAuthenticated, setCisAuthenticated] = useState(isCisLoggedIn());

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRACK, track);
  }, [track]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_COURSES,
      JSON.stringify(selectedCourseIds),
    );
  }, [selectedCourseIds]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_PREREQS,
      JSON.stringify(selectedPrereqIds),
    );
  }, [selectedPrereqIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GATES, JSON.stringify(selectedGateIds));
  }, [selectedGateIds]);

  const currentConfig = useMemo(() => TRACK_CONFIGS[track], [track]);

  const creditStats = useMemo(() => {
    return calculateTrackCredits(track, selectedCourseIds);
  }, [track, selectedCourseIds]);

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
            presentToast({
              message: "已重設所有學分試算記錄",
              duration: 2000,
              color: "medium",
            });
          },
        },
      ],
    });
  }, [presentAlert, presentToast]);

  const handleSyncCis = useCallback(async () => {
    if (!isCisLoggedIn()) {
      setCisAuthenticated(false);
      setShowCisModal(true);
      return;
    }

    setIsSyncing(true);
    try {
      const cisCourses = await fetchCisCourseHistory();
      if (!cisCourses || cisCourses.length === 0) {
        presentToast({
          message: "課務系統目前沒有可用的選課結果，或需重新登入",
          duration: 3000,
          color: "warning",
        });
        return;
      }
      const matchedCourseIds = matchCisToCurriculum(cisCourses, currentConfig, track);
      if (matchedCourseIds.length > 0) {
        setSelectedCourseIds(matchedCourseIds);
        setCisAuthenticated(true);
        presentToast({
          message: `已從 CIS 歷年與本學期選課結果同步 ${matchedCourseIds.length} 門課程！`,
          duration: 2500,
          color: "success",
        });
      } else {
        const cisNames = cisCourses.map((c) => c.name).join("、");
        presentToast({
          message: `已從 CIS 讀取 ${cisCourses.length} 門選課紀錄（${cisNames}），但無符合此組別的碩士班必選修代碼`,
          duration: 4000,
          color: "medium",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "同步 CIS 失敗";
      if (msg.includes("過期") || msg.includes("尚未連結")) {
        setCisAuthenticated(false);
        setShowCisModal(true);
      }
      presentToast({
        message: msg,
        duration: 3500,
        color: "danger",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [currentConfig, presentToast]);

  const handleOpenCisModal = useCallback(() => {
    setShowCisModal(true);
  }, []);

  const handleCisLoginSuccess = useCallback(() => {
    setCisAuthenticated(true);
    setShowCisModal(false);
    handleSyncCis();
  }, [handleSyncCis]);

  const handleCisLogout = useCallback(() => {
    cisLogout();
    setCisAuthenticated(false);
  }, []);

  const renderPrereqItem = (p: PrereqCourse) => {
    const isChecked = selectedPrereqIds.includes(p.id);
    return (
      <IonItem
        button
        detail={false}
        key={p.id}
        onClick={() => togglePrereq(p.id, !isChecked)}
        style={{
          "--background": isChecked
            ? "var(--ncu-success-light)"
            : "var(--ncu-surface)",
          cursor: "pointer",
        }}
      >
        <IonCheckbox
          slot="start"
          checked={isChecked}
          style={{ pointerEvents: "none" }}
        />
        <IonLabel style={{ margin: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
              {p.name}
            </strong>
            <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
              ({p.requirement})
            </span>
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
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>115 碩士班學分試算</IonTitle>
          <IonButtons slot="end">
            {cisAuthenticated ? (
              <>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={handleSyncCis}
                  disabled={isSyncing}
                  style={{ fontSize: 12 }}
                >
                  <IonIcon slot="start" icon={syncOutline} />
                  {isSyncing ? "同步中…" : "同步 CIS"}
                </IonButton>
                <IonButton size="small" fill="clear" onClick={handleOpenCisModal}>
                  重新連結
                </IonButton>
                <IonButton size="small" fill="clear" color="medium" onClick={handleCisLogout}>
                  登出
                </IonButton>
              </>
            ) : (
              <IonButton size="small" fill="outline" onClick={handleOpenCisModal}>
                連結 CIS
              </IonButton>
            )}
            <IonButton
              fill="clear"
              size="small"
              color="medium"
              onClick={handleResetAll}
            >
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* 1. Track Selector */}
          <IonCard
            style={{
              margin: "0 0 16px",
              border: "2px solid var(--ncu-ink)",
              borderRadius: "var(--ncu-radius-md)",
              boxShadow: "var(--ncu-shadow-hard)",
            }}
          >
            <IonCardContent style={{ padding: "12px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 700, color: "var(--ncu-ink)", fontSize: 15 }}>
                  選擇修讀組別
                </span>
                <span style={{ fontSize: 13, color: "var(--ncu-muted)" }}>
                  115 學年度適用
                </span>
              </div>
              <IonSegment
                value={track}
                onIonChange={(e) => setTrack(e.detail.value as TrackType)}
              >
                <IonSegmentButton value="mgmt">
                  <IonLabel style={{ fontWeight: 700 }}>管理組 (33 學分)</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="sys">
                  <IonLabel style={{ fontWeight: 700 }}>資訊系統組 (30 學分)</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonCardContent>
          </IonCard>

          {/* 2. Overview Credit Dashboard */}
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
                    {currentConfig.trackName} 畢業學分試算
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
                    <IonBadge
                      color="success"
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 999,
                      }}
                    >
                      <IonIcon
                        icon={checkmarkCircle}
                        style={{ verticalAlign: "middle", marginRight: 4 }}
                      />
                      已達成畢業學分門檻
                    </IonBadge>
                  ) : (
                    <IonBadge
                      color="warning"
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 999,
                      }}
                    >
                      <IonIcon
                        icon={alertCircleOutline}
                        style={{ verticalAlign: "middle", marginRight: 4 }}
                      />
                      尚缺 {creditStats.targetCredits - creditStats.totalEarnedCredits} 學分
                    </IonBadge>
                  )}
                </div>
              </div>
            </IonCardHeader>

            <IonCardContent>
              {/* Progress bar */}
              <div style={{ margin: "4px 0 16px" }}>
                <IonProgressBar
                  value={creditStats.totalEarnedCredits / creditStats.targetCredits}
                  color={creditStats.isGraduationEligible ? "success" : "primary"}
                  style={{ height: 10, borderRadius: 5 }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--ncu-muted)",
                    marginTop: 6,
                  }}
                >
                  <span>達成率：{creditStats.progressPercentage}%</span>
                  <span>{currentConfig.prereqSummary}</span>
                </div>
              </div>

              {/* Category Breakdown Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    track === "sys"
                      ? "repeat(auto-fit, minmax(130px, 1fr))"
                      : "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                  textAlign: "center",
                }}
              >
                {currentConfig.sections.map((section) => {
                  const secStat = creditStats.sectionResults[section.id];
                  const isMet = secStat?.isMet ?? false;

                  return (
                    <div
                      key={section.id}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "var(--ncu-radius-sm)",
                        background: isMet
                          ? "var(--ncu-success-light)"
                          : "var(--ncu-primary-light)",
                        border: `1px solid ${
                          isMet ? "var(--ncu-success)" : "var(--ncu-border)"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isMet ? "#0d7a3e" : "var(--ncu-ink)",
                          marginBottom: 4,
                        }}
                      >
                        {section.title}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: isMet ? "#0d7a3e" : "var(--ncu-primary)",
                        }}
                      >
                        {secStat?.earned ?? 0} / {section.requiredCredits}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isMet ? "#0d7a3e" : "var(--ncu-danger)",
                          marginTop: 2,
                          fontWeight: isMet ? 500 : 700,
                        }}
                      >
                        {isMet
                          ? "✓ 已達標"
                          : secStat?.hint ||
                            `缺 ${section.requiredCredits - (secStat?.earned ?? 0)} 學分`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </IonCardContent>
          </IonCard>

          {/* 3. Academic Credit Sections */}
          {currentConfig.sections.map((section) => {
            const secStat = creditStats.sectionResults[section.id];
            const isMet = secStat?.isMet ?? false;

            return (
              <div key={section.id} style={{ marginBottom: 24 }}>
                {/* Section Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    padding: "0 4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <IonIcon
                      icon={
                        section.id === "common-req"
                          ? schoolOutline
                          : section.id.includes("req")
                            ? bookOutline
                            : ribbonOutline
                      }
                      style={{
                        fontSize: 20,
                        color: isMet
                          ? "var(--ncu-success)"
                          : "var(--ncu-primary)",
                      }}
                    />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 17,
                        fontWeight: 800,
                        color: "var(--ncu-ink)",
                      }}
                    >
                      {section.title}
                    </h3>
                  </div>
                  <div>
                    <IonBadge
                      color={isMet ? "success" : "warning"}
                      style={{ fontSize: 12 }}
                    >
                      {isMet
                        ? "✓ 已達標"
                        : secStat?.hint
                          ? `${secStat.earned}/${section.requiredCredits} (${secStat.hint})`
                          : `${secStat?.earned ?? 0} / ${section.requiredCredits} 學分`}
                    </IonBadge>
                  </div>
                </div>

                {section.description && (
                  <p
                    style={{
                      margin: "0 0 10px 4px",
                      fontSize: 13,
                      color: "var(--ncu-muted)",
                    }}
                  >
                    {section.description}
                  </p>
                )}

                {/* Section List */}
                <IonList
                  inset
                  style={{
                    margin: 0,
                    borderRadius: "var(--ncu-radius-md)",
                    border: "1.5px solid var(--ncu-border)",
                    overflow: "hidden",
                  }}
                >
                  {section.courses.map((course) => {
                    const isChecked = selectedCourseIds.includes(course.id);

                    return (
                      <IonItem
                        button
                        detail={false}
                        key={course.id}
                        onClick={() => toggleCourse(course.id, !isChecked)}
                        style={{
                          "--background": isChecked
                            ? "var(--ncu-star-light)"
                            : "var(--ncu-surface)",
                          cursor: "pointer",
                        }}
                      >
                        <IonCheckbox
                          slot="start"
                          checked={isChecked}
                          style={{ pointerEvents: "none" }}
                        />
                        <IonLabel style={{ margin: "10px 0" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--ncu-primary)",
                                background: "rgba(49, 87, 200, 0.08)",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              {course.code}
                            </span>
                            <strong
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: "var(--ncu-ink)",
                              }}
                            >
                              {course.name}
                            </strong>
                            {course.note && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--ncu-muted)",
                                  fontWeight: 500,
                                }}
                              >
                                ({course.note})
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--ncu-muted)",
                              marginTop: 4,
                            }}
                          >
                            {course.semester}
                            {course.schedule ? ` · ${course.schedule}` : ""}
                          </p>
                        </IonLabel>
                        <IonNote
                          slot="end"
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: isChecked
                              ? "var(--ncu-primary)"
                              : "var(--ncu-muted)",
                          }}
                        >
                          {course.credits} 學分
                        </IonNote>
                      </IonItem>
                    );
                  })}
                </IonList>
              </div>
            );
          })}

          {/* 4. Dedicated Prerequisite Check Section (先修課程檢核) */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                padding: "0 4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonIcon
                  icon={shieldCheckmarkOutline}
                  style={{ fontSize: 20, color: "var(--ncu-muted)" }}
                />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 800,
                    color: "var(--ncu-ink)",
                  }}
                >
                  先修課程檢核
                </h3>
              </div>
              <IonBadge color="medium" style={{ fontSize: 12 }}>
                0 學分 (不計入畢業學分)
              </IonBadge>
            </div>
            <p
              style={{
                margin: "0 0 12px 4px",
                fontSize: 13,
                color: "var(--ncu-muted)",
              }}
            >
              入學前未修習者需補修，已修過或抵免請勾選標記
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { label: "🏢 所先修", items: currentConfig.prereqs.common },
                { label: `🎯 組先修${track === "mgmt" ? "（3 選 2）" : ""}`, items: currentConfig.prereqs.track },
              ].map(({ label, items }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--ncu-surface)",
                    borderRadius: "var(--ncu-radius-md)",
                    border: "1.5px solid var(--ncu-border)",
                    padding: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--ncu-primary)",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{label}</span>
                  </div>
                  <IonList style={{ margin: 0, background: "transparent" }}>
                    {items.map(renderPrereqItem)}
                  </IonList>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Graduation Gate Checklists (畢業門檻檢核) */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                padding: "0 4px",
              }}
            >
              <IonIcon
                icon={ribbonOutline}
                style={{ fontSize: 20, color: "var(--ncu-primary)" }}
              />
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--ncu-ink)",
                }}
              >
                畢業門檻檢核清單
              </h3>
            </div>
            <p
              style={{
                margin: "0 0 10px 4px",
                fontSize: 13,
                color: "var(--ncu-muted)",
              }}
            >
              學位口試前需完成學術研究倫理、進修英文及英文畢業門檻
            </p>

            <IonList
              inset
              style={{
                margin: 0,
                borderRadius: "var(--ncu-radius-md)",
                border: "1.5px solid var(--ncu-border)",
                overflow: "hidden",
              }}
            >
              {GRADUATION_GATES.map((gate) => {
                const isChecked = selectedGateIds.includes(gate.id);
                return (
                  <IonItem
                    button
                    detail={false}
                    key={gate.id}
                    onClick={() => toggleGate(gate.id, !isChecked)}
                    style={{
                      "--background": isChecked
                        ? "var(--ncu-success-light)"
                        : "var(--ncu-surface)",
                      cursor: "pointer",
                    }}
                  >
                    <IonCheckbox
                      slot="start"
                      checked={isChecked}
                      style={{ pointerEvents: "none" }}
                    />
                    <IonLabel style={{ margin: "10px 0" }}>
                      <strong
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isChecked ? "#0d7a3e" : "var(--ncu-ink)",
                        }}
                      >
                        {gate.title}
                      </strong>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--ncu-muted)",
                          marginTop: 3,
                        }}
                      >
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
                      {isChecked ? "✓ 已通過" : "未完成"}
                    </IonNote>
                  </IonItem>
                );
              })}
            </IonList>
          </div>
        </div>
      </IonContent>

      <CisLoginModal
        isOpen={showCisModal}
        onDismiss={() => setShowCisModal(false)}
        onSuccess={handleCisLoginSuccess}
      />
    </IonPage>
  );
};

export default CreditPage;
