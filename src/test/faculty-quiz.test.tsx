import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, fireEvent, cleanup, within } from "@testing-library/react";
import { STORAGE_KEY_UNLOCKED } from "../components/faculty/useFacultyQuiz";
import teachersData from "../data/im-teachers.json";
import memesData from "../data/memes.json";
import type { TeacherProfile, MemeItem } from "../types/faculty";
import * as random from "../utils/random";
import {
  generateQuestion,
  pickClaimedTeacher,
  pickNextTarget,
  FacultyQuizModal,
} from "../components/faculty/FacultyQuizModal";

vi.mock("@ionic/react", async () => {
  const actual = await vi.importActual<typeof import("@ionic/react")>("@ionic/react");
  return {
    ...actual,
    IonModal: ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="ion-modal">{children}</div> : null,
  };
});

vi.mock("../components/faculty/PointCloudCanvas", () => ({
  PointCloudCanvas: ({ onAligned }: any) => (
    <button data-testid="mock-align-btn" onClick={onAligned}>
      Simulate Front Alignment
    </button>
  ),
}));

const teachers = teachersData as readonly TeacherProfile[];
const memes = memesData as readonly MemeItem[];

describe("faculty dataset and quiz logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cleanup();
    localStorage.clear();
  });

  it("should contain 23 full-time faculty members with required fields", () => {
    expect(teachers).toHaveLength(23);

    for (const teacher of teachers) {
      expect(teacher.id).toBeTruthy();
      expect(teacher.name).toBeTruthy();
      expect(teacher.title).toMatch(/教授/);
      expect(teacher.photoUrl).toMatch(/^https:\/\/im\.mgt\.ncu\.edu\.tw\/img\/teacher\//);
      expect(teacher.localPhotoUrl).toMatch(/^\/teachers\/[a-zA-Z0-9_.-]+$/);
      expect(typeof teacher.education).toBe("string");
      expect(typeof teacher.specialty).toBe("string");
      expect(Array.isArray(teacher.specialtyTags)).toBe(true);
      expect(typeof teacher.office).toBe("string");
    }
  });

  it("uses only curated portrait-style memes with matching puzzle and reveal paths", () => {
    expect(memes.map(m => m.id).sort()).toEqual(["cat_polite", "doge", "rollsafe"]);

    for (const meme of memes) {
      expect(meme.id).toBeTruthy();
      expect(meme.name).toBeTruthy();
      expect(meme.photoUrl).toMatch(/^\/meme-portraits\/[a-zA-Z0-9_.-]+\.png$/);
      expect(meme.localPhotoUrl).toBe(meme.photoUrl);
    }
  });

  it("draws teachers for the first 80% of the random range", () => {
    const rng = vi.spyOn(random, "getSecureRandomFloat");
    rng.mockReturnValueOnce(0.799999).mockReturnValueOnce(0);
    expect(pickNextTarget(teachers, memes).type).toBe("teacher");
    rng.mockReturnValueOnce(0.8).mockReturnValueOnce(0);
    expect(pickNextTarget(teachers, memes).type).toBe("meme");
  });

  it("should avoid immediate duplicate target when lastId is provided", () => {
    const firstId = teachers[0].id;
    for (let i = 0; i < 20; i++) {
      const drawn = pickNextTarget(teachers, memes, firstId);
      expect(drawn.data.id).not.toBe(firstId);
    }
  });

  it("asks about either the pictured teacher or a different professor", () => {
    const target = { type: "teacher", data: teachers[0] } as const;
    const rng = vi.spyOn(random, "getSecureRandomFloat");
    rng.mockReturnValueOnce(0);
    const matching = pickClaimedTeacher(target, teachers);
    expect(matching.id).toBe(target.data.id);

    rng.mockReturnValueOnce(0.9).mockReturnValueOnce(0);
    const different = pickClaimedTeacher(target, teachers);
    expect(different.id).not.toBe(target.data.id);

    rng.mockReturnValueOnce(0);
    const memeClaim = pickClaimedTeacher({ type: "meme", data: memes[0] }, teachers);
    expect(memeClaim.id).toBe(teachers[0].id);
  });

  it("should generate legacy question format for backward compatibility", () => {
    const question = generateQuestion(teachers);
    expect(question.teacher).toBeDefined();
    expect(question.options).toHaveLength(4);
    expect(question.clues).toBeDefined();
  });

  it("should prompt verification buttons on alignment and handle answer", () => {
    const { getByTestId, getByText, queryByText } = render(
      <FacultyQuizModal isOpen={true} onDismiss={() => {}} />
    );

    // Initial state: verifying prompt is not displayed
    expect(queryByText(/^這是.+教授嗎？$/)).toBeNull();

    // Trigger alignment
    fireEvent.click(getByTestId("mock-align-btn"));

    // Verification prompt should appear with both options
    expect(getByText(/^這是.+教授嗎？$/)).toBeDefined();
    expect(getByText("是")).toBeDefined();
    expect(getByText("不是")).toBeDefined();

    // Answer "是"
    fireEvent.click(getByText("是"));

    // Prompt disappears and either success or failed card is revealed
    expect(queryByText(/^這是.+教授嗎？$/)).toBeNull();
  });

  it.each([0, 22, 23])("collects memes without changing %i collected professors or completion", (count) => {
    localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(teachers.slice(0, count).map(t => t.id)));
    vi.spyOn(random, "getSecureRandomFloat").mockReturnValue(0.99);
    const view = render(<FacultyQuizModal isOpen={true} onDismiss={() => {}} />);
    fireEvent.click(view.getByTestId("mock-align-btn"));
    fireEvent.click(view.getByText("不是"));
    expect(view.getByText("🎉 答對了！")).toBeDefined();
    expect(view.queryByText(/答對了！這不是教授/)).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_UNLOCKED)!)).toContain(`meme:${memes[2].id}`);
    expect(view.getByText(count === 23 ? "全圖鑑達成" : `圖鑑 ${count} / 23`)).toBeDefined();
    view.unmount();

    const reopened = render(<FacultyQuizModal isOpen={true} onDismiss={() => {}} />);
    fireEvent.click(reopened.getByRole("button", { name: /展開師資圖鑑/ }));
    expect(reopened.getByText(`解鎖 ${count} / 23 位教授`)).toBeDefined();
    const collection = within(reopened.getByRole("region", { name: "迷因收藏" }));
    expect(collection.getByRole("img", { name: memes[2].name })).toBeDefined();
    expect(collection.queryByRole("img", { name: memes[0].name })).toBeNull();
  });
});
