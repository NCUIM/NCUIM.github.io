import { describe, it, expect } from "vitest";
import {
  getAllMealCandidates,
  getRoomMealCandidates,
  pickRandomCandidates,
  type MealCandidate,
} from "../utils/meal-lottery";

describe("Meal Lottery Utilities", () => {
  it("should extract all 73 meal candidates across 4 rooms", () => {
    const all = getAllMealCandidates();
    expect(all).toHaveLength(73);

    const roomCounts = all.reduce<Record<string, number>>((acc, cur) => {
      acc[cur.roomId] = (acc[cur.roomId] || 0) + 1;
      return acc;
    }, {});

    expect(roomCounts["209"]).toBe(19);
    expect(roomCounts["310"]).toBe(24);
    expect(roomCounts["313"]).toBe(22);
    expect(roomCounts["919"]).toBe(8);
  });

  it("should extract candidates for specific rooms correctly", () => {
    const r209 = getRoomMealCandidates("209");
    expect(r209).toHaveLength(19);
    expect(r209.every((c) => c.roomId === "209")).toBe(true);

    const r313 = getRoomMealCandidates("313");
    expect(r313).toHaveLength(22);
    expect(r313.every((c) => c.roomId === "313")).toBe(true);

    const r919 = getRoomMealCandidates("919");
    expect(r919).toHaveLength(8);
    expect(r919.every((c) => c.roomId === "919")).toBe(true);

    const nonExistent = getRoomMealCandidates("999");
    expect(nonExistent).toEqual([]);
  });

  it("should pick candidates without duplicates", () => {
    const pool = getAllMealCandidates();
    const picked = pickRandomCandidates(pool, 3);
    expect(picked).toHaveLength(3);

    const uniqueNames = new Set(picked.map((p) => p.name));
    expect(uniqueNames.size).toBe(3);
  });

  it("should respect excludeNames when allowDuplicate is false", () => {
    const pool: MealCandidate[] = [
      { name: "CandidateA", roomId: "209", seatLabel: "1-1" },
      { name: "CandidateB", roomId: "209", seatLabel: "1-2" },
      { name: "CandidateC", roomId: "209", seatLabel: "1-3" },
    ];

    const picked = pickRandomCandidates(pool, 2, ["CandidateA"]);
    expect(picked).toHaveLength(2);
    expect(picked.some((p) => p.name === "CandidateA")).toBe(false);
    expect(picked.map((p) => p.name).sort()).toEqual(["CandidateB", "CandidateC"]);
  });

  it("should allow repeating from full pool when allowDuplicate is true", () => {
    const pool: MealCandidate[] = [
      { name: "CandidateA", roomId: "209", seatLabel: "1-1" },
      { name: "CandidateB", roomId: "209", seatLabel: "1-2" },
    ];

    const picked = pickRandomCandidates(pool, 2, ["CandidateA"], true);
    expect(picked).toHaveLength(2);
    // Can still pick CandidateA because allowDuplicate is true
    expect(picked.some((p) => p.name === "CandidateA") || picked.some((p) => p.name === "CandidateB")).toBe(true);
  });

  it("should return empty array when all candidates are excluded and allowDuplicate is false", () => {
    const pool = getRoomMealCandidates("919");
    const allNames = pool.map((p) => p.name);
    const result = pickRandomCandidates(pool, 1, allNames, false);
    expect(result).toEqual([]);
  });

  it("should handle boundary conditions gracefully", () => {
    const pool = getRoomMealCandidates("919");
    expect(pickRandomCandidates(pool, 0)).toEqual([]);
    expect(pickRandomCandidates([], 2)).toEqual([]);

    // Count greater than pool size
    const pickedOver = pickRandomCandidates(pool, 100);
    expect(pickedOver).toHaveLength(pool.length);
  });
});
