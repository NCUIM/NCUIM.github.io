import seatAssignments from "../data/seats.json";

export interface MealCandidate {
  readonly name: string;
  readonly roomId: string;
  readonly seatLabel: string;
}

export type DutyCandidate = MealCandidate;

import { getSecureRandomFloat } from "./random";

export { getSecureRandomFloat };

/**
 * Extracts all valid student candidates across all laboratory rooms.
 */
export const getAllMealCandidates = (): MealCandidate[] => {
  const data = seatAssignments as Record<string, Record<string, string>>;
  const candidates: MealCandidate[] = [];

  for (const [roomId, seats] of Object.entries(data)) {
    for (const [seatLabel, name] of Object.entries(seats)) {
      const trimmed = name?.trim();
      if (trimmed) {
        candidates.push({
          name: trimmed,
          roomId,
          seatLabel,
        });
      }
    }
  }

  return candidates;
};

export const getAllDutyCandidates = getAllMealCandidates;

/**
 * Extracts candidates belonging to a specific room.
 */
export const getRoomMealCandidates = (roomId: string): MealCandidate[] => {
  const data = seatAssignments as Record<string, Record<string, string>>;
  const seats = data[roomId];
  if (!seats) return [];

  const candidates: MealCandidate[] = [];
  for (const [seatLabel, name] of Object.entries(seats)) {
    const trimmed = name?.trim();
    if (trimmed) {
      candidates.push({
        name: trimmed,
        roomId,
        seatLabel,
      });
    }
  }

  return candidates;
};

export const getRoomDutyCandidates = getRoomMealCandidates;

/**
 * Randomly samples `count` candidates from a pool, optionally excluding specific names.
 * When allowDuplicate is false (default), it strictly draws only from eligible candidates.
 * If eligible candidates are fewer than count, it returns only the remaining eligible ones (or empty).
 */
export const pickRandomCandidates = (
  pool: readonly MealCandidate[],
  count: number,
  excludeNames: readonly string[] = [],
  allowDuplicate = false,
): MealCandidate[] => {
  if (count <= 0 || pool.length === 0) return [];

  let candidatePool: MealCandidate[];
  if (allowDuplicate) {
    candidatePool = [...pool];
  } else {
    const excludeSet = new Set(excludeNames);
    candidatePool = pool.filter((c) => !excludeSet.has(c.name));
  }

  if (candidatePool.length === 0) return [];

  const targetCount = Math.min(count, candidatePool.length);

  // Fisher-Yates shuffle on a copy
  for (let i = candidatePool.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandomFloat() * (i + 1));
    const temp = candidatePool[i];
    candidatePool[i] = candidatePool[j];
    candidatePool[j] = temp;
  }

  return candidatePool.slice(0, targetCount);
};
