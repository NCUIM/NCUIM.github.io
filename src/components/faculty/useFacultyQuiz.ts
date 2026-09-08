import { useState, useEffect, useCallback, useRef } from "react";
import type { TeacherProfile, MemeItem, QuizTarget, QuizQuestion } from "../../types/faculty";

export const STORAGE_KEY_UNLOCKED = "ncu_faculty_quiz_unlocked";
export const STORAGE_KEY_STREAK = "ncu_faculty_quiz_streak";

export type QuizPhase = "aligning" | "verifying" | "success" | "failed";

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

interface UseFacultyQuizProps {
  teachers: readonly TeacherProfile[];
  memes: readonly MemeItem[];
  isOpen: boolean;
  onSuccessReward?: () => void;
}

export const useFacultyQuiz = ({
  teachers,
  memes,
  isOpen,
  onSuccessReward,
}: UseFacultyQuizProps) => {
  const [target, setTarget] = useState<QuizTarget | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("aligning");
  const completedRef = useRef(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

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

  const nextRound = useCallback(() => {
    if (teachers.length === 0 && memes.length === 0) return;
    const newTarget = pickNextTarget(teachers, memes, target?.data.id);
    setTarget(newTarget);
    completedRef.current = false;
    setPhase("aligning");
    setIsCelebrating(false);
  }, [teachers, memes, target?.data.id]);

  useEffect(() => {
    if (!isOpen) {
      setTarget(null);
      return;
    }
    if (isOpen && !target) {
      nextRound();
    }
  }, [isOpen, target, nextRound]);

  const handleAligned = useCallback(() => {
    if (completedRef.current || !target || !isOpen) return;
    completedRef.current = true;
    setPhase("verifying");
    navigator.vibrate?.(30);
  }, [target, isOpen]);

  const handleAnswer = useCallback((answeredIsTeacher: boolean) => {
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
      onSuccessReward?.();
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
  }, [target, streak, onSuccessReward]);

  return {
    target,
    phase,
    streak,
    unlockedIds,
    unlockedCount: unlockedIds.length,
    isCelebrating,
    nextRound,
    handleAligned,
    handleAnswer,
  };
};
