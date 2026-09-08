import { describe, it, expect } from "vitest";
import teachersData from "../data/im-teachers.json";
import type { TeacherProfile } from "../types/faculty";
import { generateQuestion } from "../components/faculty/FacultyQuizModal";

const teachers = teachersData as readonly TeacherProfile[];

describe("faculty dataset and quiz logic", () => {
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

  it("should generate a valid quiz question with 4 unique options", () => {
    const question = generateQuestion(teachers);

    expect(question.teacher).toBeDefined();
    expect(question.options.length).toBe(4);

    // Target must be present in options
    const targetFound = question.options.some((o) => o.id === question.teacher.id);
    expect(targetFound).toBe(true);

    // Options must be unique
    const uniqueIds = new Set(question.options.map((o) => o.id));
    expect(uniqueIds.size).toBe(4);

    // Clues should contain non-empty fields
    expect(question.clues).toBeDefined();
    expect(question.clues.office).toBe(question.teacher.office);
    expect(question.clues.education).toBe(question.teacher.education);
  });

  it("should avoid immediate duplicate questions when lastId is provided", () => {
    const firstTeacher = teachers[0];
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion(teachers, firstTeacher.id);
      expect(q.teacher.id).not.toBe(firstTeacher.id);
    }
  });
});
