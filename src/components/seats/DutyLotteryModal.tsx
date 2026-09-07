import { useState, useMemo, useEffect, useRef } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  useIonToast,
} from "@ionic/react";
import {
  diceOutline,
  refreshOutline,
  copyOutline,
  closeOutline,
  checkmarkCircleOutline,
  repeatOutline,
  chevronDownOutline,
  chevronUpOutline,
  restaurantOutline,
} from "ionicons/icons";
import {
  getAllDutyCandidates,
  getRoomDutyCandidates,
  pickRandomCandidates,
  getSecureRandomFloat,
  type DutyCandidate,
} from "../../utils/duty-lottery";

interface DutyLotteryModalProps {
  readonly isOpen: boolean;
  readonly defaultRoomId?: string;
  readonly onDismiss: () => void;
}

const ROOM_OPTIONS = [
  { id: "all", label: "全班" },
  { id: "209", label: "209" },
  { id: "310", label: "310" },
  { id: "313", label: "313" },
  { id: "919", label: "919" },
] as const;

const COUNT_OPTIONS = [1, 2, 3, 4] as const;

// ---------------------------------------------------------------------------
// Pure Sub-components (Cognitive Complexity <= 5)
// ---------------------------------------------------------------------------

const CandidateResultCard = ({
  candidate,
  index,
}: Readonly<{
  candidate: DutyCandidate;
  index: number;
}>) => (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: "var(--ncu-radius-md)",
      border: "2px solid var(--ncu-ink)",
      background: "var(--ncu-star-light)",
      boxShadow: "2px 2px 0 var(--ncu-ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
      boxSizing: "border-box",
      width: "100%",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
      <span
        style={{
          width: 24,
          height: 24,
          minWidth: 24,
          borderRadius: 999,
          background: "var(--ncu-primary)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      <span
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "var(--ncu-ink)",
          letterSpacing: 1,
          wordBreak: "break-word",
        }}
      >
        {candidate.name}
      </span>
    </div>
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "var(--ncu-muted)",
        background: "var(--ncu-surface)",
        padding: "3px 8px",
        borderRadius: "var(--ncu-radius-sm)",
        border: "1px solid var(--ncu-border)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {candidate.roomId} 室 · 座位 {candidate.seatLabel}
    </div>
  </div>
);

const RollingDisplay = ({
  displayName,
  displaySub,
}: Readonly<{
  displayName: string;
  displaySub: string;
}>) => (
  <div
    style={{
      padding: "20px 14px",
      borderRadius: "var(--ncu-radius-md)",
      border: "2px dashed var(--ncu-primary)",
      background: "var(--ncu-primary-light)",
      textAlign: "center",
      boxSizing: "border-box",
      width: "100%",
    }}
  >
    <div
      style={{
        fontSize: 24,
        fontWeight: 800,
        color: "var(--ncu-primary)",
        letterSpacing: 2,
        minHeight: 34,
        wordBreak: "break-word",
      }}
    >
      {displayName}
    </div>
    <div
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--ncu-muted)",
        marginTop: 6,
      }}
    >
      {displaySub}
    </div>
  </div>
);

const ExcludedListDrawer = ({
  names,
  allCandidates,
}: Readonly<{
  names: readonly string[];
  allCandidates: readonly DutyCandidate[];
}>) => {
  const candidateMap = useMemo(() => {
    const map = new Map<string, DutyCandidate>();
    for (const c of allCandidates) {
      map.set(c.name, c);
    }
    return map;
  }, [allCandidates]);

  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "var(--ncu-radius-sm)",
        background: "var(--ncu-canvas)",
        border: "1.5px dashed var(--ncu-border)",
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        maxHeight: 140,
        overflowY: "auto",
      }}
    >
      {names.map((name) => {
        const info = candidateMap.get(name);
        return (
          <span
            key={name}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              background: "var(--ncu-surface)",
              border: "1px solid var(--ncu-border)",
              color: "var(--ncu-ink)",
            }}
          >
            {name} {info ? `(${info.roomId})` : ""}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Modal Component
// ---------------------------------------------------------------------------

export const DutyLotteryModal = ({
  isOpen,
  defaultRoomId = "209",
  onDismiss,
}: Readonly<DutyLotteryModalProps>) => {
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [pickCount, setPickCount] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [autoNoRepeat, setAutoNoRepeat] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<DutyCandidate | null>(null);
  const [pickedResults, setPickedResults] = useState<DutyCandidate[]>([]);
  const [excludedNames, setExcludedNames] = useState<string[]>([]);
  const [presentToast] = useIonToast();

  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync default room when modal opens
  useEffect(() => {
    if (isOpen && defaultRoomId) {
      const isValid = ROOM_OPTIONS.some((r) => r.id === defaultRoomId);
      if (isValid) {
        setSelectedRoom(defaultRoomId);
      }
    }
  }, [isOpen, defaultRoomId]);

  // Clean timers on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      setIsRolling(false);
    };
  }, [isOpen]);

  const candidatesPool = useMemo(() => {
    if (selectedRoom === "all") {
      return getAllDutyCandidates();
    }
    return getRoomDutyCandidates(selectedRoom);
  }, [selectedRoom]);

  // Filter remaining eligible candidates based on autoNoRepeat
  const remainingCandidates = useMemo(() => {
    if (!autoNoRepeat) return candidatesPool;
    const excludeSet = new Set(excludedNames);
    return candidatesPool.filter((c) => !excludeSet.has(c.name));
  }, [candidatesPool, autoNoRepeat, excludedNames]);

  const handleStartDraw = () => {
    if (candidatesPool.length === 0 || isRolling) return;

    if (autoNoRepeat && remainingCandidates.length === 0) {
      presentToast({
        message: "名額已全數抽完！請先清除重置名單",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    setIsRolling(true);
    setPickedResults([]);

    const finalCandidates = pickRandomCandidates(
      candidatesPool,
      pickCount,
      excludedNames,
      !autoNoRepeat,
    );

    // Rapidly cycle random names for rolling effect
    if (rollTimerRef.current) clearInterval(rollTimerRef.current);
    rollTimerRef.current = setInterval(() => {
      const randIdx = Math.floor(getSecureRandomFloat() * candidatesPool.length);
      setRollingCandidate(candidatesPool[randIdx]);
    }, 60);

    // Stop after animation completes
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = setTimeout(() => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current);
      setIsRolling(false);
      setRollingCandidate(null);
      setPickedResults(finalCandidates);
      if (autoNoRepeat) {
        setExcludedNames((prev) => Array.from(new Set([...prev, ...finalCandidates.map((c) => c.name)])));
      }
    }, 1200);
  };

  const handleResetExclusions = () => {
    setExcludedNames([]);
    setPickedResults([]);
    setShowExcluded(false);
    presentToast({
      message: "已重置已中籤名單",
      duration: 1500,
      position: "top",
      color: "dark",
    });
  };

  const handleCopyResults = async () => {
    if (pickedResults.length === 0) return;
    const roomText = selectedRoom === "all" ? "全班" : `${selectedRoom} 室`;
    const names = pickedResults
      .map((c) => `${c.name} (${c.roomId}室 ${c.seatLabel})`)
      .join("、");
    const text = `【${roomText}·今天跟誰一起吃~】${names}`;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        presentToast({
          message: "已複製名單到剪貼簿！",
          duration: 1500,
          position: "top",
          color: "success",
        });
        return;
      } catch {
        // Fallback below
      }
    }

    presentToast({
      message: "無法存取剪貼簿，請手動複製！",
      duration: 2000,
      position: "top",
      color: "warning",
    });
  };

  const scopeLabel = autoNoRepeat
    ? `抽籤範圍 (剩 ${remainingCandidates.length} / 共 ${candidatesPool.length} 人)`
    : `抽籤範圍 (共 ${candidatesPool.length} 人)`;

  const resolveDrawButtonText = (): string => {
    if (isRolling) return "抽獎中...";
    if (autoNoRepeat && remainingCandidates.length === 0) return "名額已抽完";
    return "開始抽籤";
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ paddingInline: 6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IonIcon icon={restaurantOutline} style={{ color: "var(--ncu-primary)" }} />
              <span>今天跟誰一起吃~</span>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill={autoNoRepeat ? "solid" : "clear"}
              color={autoNoRepeat ? "primary" : "medium"}
              onClick={() => setAutoNoRepeat((prev) => !prev)}
              aria-label={autoNoRepeat ? "自動不重複：開啟" : "自動不重複：關閉"}
              title={autoNoRepeat ? "自動不重複 (點擊切換為可重複)" : "可重複抽取 (點擊切換為自動不重複)"}
              style={{
                fontSize: 12,
                fontWeight: 700,
                marginRight: 4,
                "--border-radius": "999px",
                height: 28,
              }}
            >
              <IonIcon slot="start" icon={repeatOutline} />
              {autoNoRepeat ? "不重複" : "可重複"}
            </IonButton>
            <IonButton onClick={onDismiss}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, paddingBottom: 48 }}>
          {/* Scope Selector */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ncu-ink)" }}>
                {scopeLabel}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {autoNoRepeat && excludedNames.length > 0 && (
                  <>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => setShowExcluded((prev) => !prev)}
                      disabled={isRolling}
                      style={{
                        fontSize: 12,
                        height: 24,
                        minHeight: 24,
                        "--padding-start": "4px",
                        "--padding-end": "4px",
                        color: "var(--ncu-primary)",
                        fontWeight: 700,
                      }}
                    >
                      <span>已抽 ({excludedNames.length})</span>
                      <IonIcon slot="end" icon={showExcluded ? chevronUpOutline : chevronDownOutline} style={{ fontSize: 12 }} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={handleResetExclusions}
                      disabled={isRolling}
                      style={{
                        fontSize: 12,
                        height: 24,
                        minHeight: 24,
                        "--padding-start": "4px",
                        "--padding-end": "4px",
                      }}
                    >
                      <IonIcon slot="start" icon={refreshOutline} style={{ fontSize: 13 }} />
                      清除重置
                    </IonButton>
                  </>
                )}
              </div>
            </div>
            {autoNoRepeat && showExcluded && excludedNames.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <ExcludedListDrawer
                  names={excludedNames}
                  allCandidates={candidatesPool}
                />
              </div>
            )}
            <IonSegment
              className="duty-lottery-segment"
              value={selectedRoom}
              onIonChange={(e) => {
                setSelectedRoom(e.detail.value as string);
                setPickedResults([]);
              }}
              disabled={isRolling}
              style={{
                width: "100%",
                "--min-width": "0px",
              } as React.CSSProperties}
            >
              {ROOM_OPTIONS.map((opt) => (
                <IonSegmentButton
                  key={opt.id}
                  value={opt.id}
                  style={{
                    minWidth: 0,
                    "--min-width": "0px",
                    "--padding-start": "2px",
                    "--padding-end": "2px",
                    fontSize: 13,
                    fontWeight: 700,
                  } as React.CSSProperties}
                >
                  {opt.label}
                </IonSegmentButton>
              ))}
            </IonSegment>
          </div>

          {/* Count Selector */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ncu-ink)", marginBottom: 6 }}>
              抽出名額
            </div>
            <IonSegment
              className="duty-lottery-segment"
              value={String(pickCount)}
              onIonChange={(e) => setPickCount(Number(e.detail.value))}
              disabled={isRolling}
              style={{
                width: "100%",
                "--min-width": "0px",
              } as React.CSSProperties}
            >
              {COUNT_OPTIONS.map((num) => (
                <IonSegmentButton
                  key={num}
                  value={String(num)}
                  style={{
                    minWidth: 0,
                    "--min-width": "0px",
                    "--padding-start": "2px",
                    "--padding-end": "2px",
                    fontSize: 13,
                    fontWeight: 700,
                  } as React.CSSProperties}
                >
                  {num} 位
                </IonSegmentButton>
              ))}
            </IonSegment>
          </div>

          {/* Draw Button */}
          <IonButton
            expand="block"
            onClick={handleStartDraw}
            disabled={isRolling || (autoNoRepeat ? remainingCandidates.length === 0 : candidatesPool.length === 0)}
            style={{
              "--background": "var(--ncu-primary)",
              "--color": "#fff",
              fontWeight: 800,
              fontSize: 16,
              margin: "6px 0",
            }}
          >
            <IonIcon slot="start" icon={diceOutline} />
            {resolveDrawButtonText()}
          </IonButton>

          {/* Rolling State */}
          {isRolling && rollingCandidate && (
            <RollingDisplay
              displayName={rollingCandidate.name}
              displaySub={`${rollingCandidate.roomId} 室 · 座位 ${rollingCandidate.seatLabel}`}
            />
          )}

          {/* Results State */}
          {!isRolling && pickedResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "var(--ncu-ink)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <IonIcon icon={checkmarkCircleOutline} style={{ color: "var(--ncu-success)" }} />
                  抽獎結果
                </span>
                <IonButton fill="clear" size="small" onClick={handleCopyResults}>
                  <IonIcon slot="start" icon={copyOutline} />
                  複製名單
                </IonButton>
              </div>

              {pickedResults.map((c, idx) => (
                <CandidateResultCard key={`${c.roomId}-${c.seatLabel}`} candidate={c} index={idx} />
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default DutyLotteryModal;
