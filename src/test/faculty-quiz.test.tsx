import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import teachersData from "../data/im-teachers.json";
import memesData from "../data/memes.json";
import type { TeacherProfile, MemeItem } from "../types/faculty";
import {
  generateQuestion,
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
    cleanup();
    localStorage.clear();
  });

  it("should contain 23 full-time faculty members with required fields", () => {
    expect(teachers.length).toBe(23);

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

  it("should contain 54 meme stickers with valid paths", () => {
    expect(memes.length).toBe(54);

    for (const meme of memes) {
      expect(meme.id).toBeTruthy();
      expect(meme.name).toBeTruthy();
      expect(meme.photoUrl).toMatch(/^\/png\/[a-zA-Z0-9_.-]+\.png$/);
      expect(meme.localPhotoUrl).toMatch(/^\/png\/[a-zA-Z0-9_.-]+\.png$/);
    }
  });

  it("should support mixed random draw from teachers and memes", () => {
    const draws = Array.from({ length: 100 }, () => pickNextTarget(teachers, memes));
    const teacherCount = draws.filter((d) => d.type === "teacher").length;
    const memeCount = draws.filter((d) => d.type === "meme").length;

    expect(teacherCount).toBeGreaterThan(0);
    expect(memeCount).toBeGreaterThan(0);
  });

  it("should avoid immediate duplicate target when lastId is provided", () => {
    const firstId = teachers[0].id;
    for (let i = 0; i < 20; i++) {
      const drawn = pickNextTarget(teachers, memes, firstId);
      expect(drawn.data.id).not.toBe(firstId);
    }
  });

  it("should generate legacy question format for backward compatibility", () => {
    const question = generateQuestion(teachers);
    expect(question.teacher).toBeDefined();
    expect(question.options.length).toBe(4);
    expect(question.clues).toBeDefined();
  });

  it("should prompt verification buttons on alignment and handle answer", () => {
    const { getByTestId, getByText, queryByText } = render(
      <FacultyQuizModal isOpen={true} onDismiss={() => {}} />
    );

    // Initial state: verifying prompt is not displayed
    expect(queryByText("🤔 這是系上的教授嗎？")).toBeNull();

    // Trigger alignment
    fireEvent.click(getByTestId("mock-align-btn"));

    // Verification prompt should appear with both options
    expect(getByText("🤔 這是系上的教授嗎？")).toBeDefined();
    expect(getByText("是教授")).toBeDefined();
    expect(getByText("不是教授")).toBeDefined();

    // Answer "是教授"
    fireEvent.click(getByText("是教授"));

    // Prompt disappears and either success or failed card is revealed
    expect(queryByText("🤔 這是系上的教授嗎？")).toBeNull();
  });
});
