import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useIonToast } from "@ionic/react";
import {
  getAllMealCandidates,
  getRoomMealCandidates,
  pickRandomCandidates,
  getSecureRandomFloat,
  type MealCandidate,
} from "../../utils/meal-lottery";

export interface UseMealLotteryOptions {
  readonly isOpen: boolean;
  readonly defaultRoomId?: string;
}

export const useMealLottery = ({
  isOpen,
  defaultRoomId = "209",
}: UseMealLotteryOptions) => {
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [pickCount, setPickCount] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [autoNoRepeat, setAutoNoRepeat] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<MealCandidate | null>(null);
  const [pickedResults, setPickedResults] = useState<MealCandidate[]>([]);
  const [excludedNames, setExcludedNames] = useState<string[]>([]);
  const [presentToast] = useIonToast();

  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync default room when modal opens
  useEffect(() => {
    if (isOpen && defaultRoomId) {
      setSelectedRoom(defaultRoomId);
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
      return getAllMealCandidates();
    }
    return getRoomMealCandidates(selectedRoom);
  }, [selectedRoom]);

  // Filter remaining eligible candidates based on autoNoRepeat
  const remainingCandidates = useMemo(() => {
    if (!autoNoRepeat) return candidatesPool;
    const excludeSet = new Set(excludedNames);
    return candidatesPool.filter((c) => !excludeSet.has(c.name));
  }, [candidatesPool, autoNoRepeat, excludedNames]);

  const handleSelectRoom = useCallback((roomId: string) => {
    setSelectedRoom(roomId);
    setPickedResults([]);
  }, []);

  const handleSelectPickCount = useCallback((count: number) => {
    setPickCount(count);
  }, []);

  const handleToggleAutoNoRepeat = useCallback(() => {
    setAutoNoRepeat((prev) => !prev);
  }, []);

  const handleToggleShowExcluded = useCallback(() => {
    setShowExcluded((prev) => !prev);
  }, []);

  const handleStartDraw = useCallback(() => {
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

    if (rollTimerRef.current) clearInterval(rollTimerRef.current);
    rollTimerRef.current = setInterval(() => {
      const randIdx = Math.floor(getSecureRandomFloat() * candidatesPool.length);
      setRollingCandidate(candidatesPool[randIdx]);
    }, 60);

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
  }, [candidatesPool, isRolling, autoNoRepeat, remainingCandidates.length, pickCount, excludedNames, presentToast]);

  const handleResetExclusions = useCallback(() => {
    setExcludedNames([]);
    setPickedResults([]);
    setShowExcluded(false);
    presentToast({
      message: "已重置已中籤名單",
      duration: 1500,
      position: "top",
      color: "dark",
    });
  }, [presentToast]);

  const handleCopyResults = useCallback(async () => {
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
  }, [pickedResults, selectedRoom, presentToast]);

  const scopeLabel = autoNoRepeat
    ? `抽籤範圍 (剩 ${remainingCandidates.length} / 共 ${candidatesPool.length} 人)`
    : `抽籤範圍 (共 ${candidatesPool.length} 人)`;

  const resolveDrawButtonText = useCallback((): string => {
    if (isRolling) return "抽獎中...";
    if (autoNoRepeat && remainingCandidates.length === 0) return "名額已抽完";
    return "開始抽籤";
  }, [isRolling, autoNoRepeat, remainingCandidates.length]);

  return {
    selectedRoom,
    pickCount,
    isRolling,
    autoNoRepeat,
    showExcluded,
    rollingCandidate,
    pickedResults,
    excludedNames,
    candidatesPool,
    remainingCandidates,
    scopeLabel,
    drawButtonText: resolveDrawButtonText(),
    handleSelectRoom,
    handleSelectPickCount,
    handleToggleAutoNoRepeat,
    handleToggleShowExcluded,
    handleStartDraw,
    handleResetExclusions,
    handleCopyResults,
  };
};
