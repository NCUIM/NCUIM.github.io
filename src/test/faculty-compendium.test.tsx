import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { FacultyCompendiumModal } from "../components/faculty/FacultyCompendiumModal";
import teachersData from "../data/im-teachers.json";
import type { TeacherProfile } from "../types/faculty";

vi.mock("@ionic/react", async () => {
  const actual = await vi.importActual<typeof import("@ionic/react")>("@ionic/react");
  return {
    ...actual,
    IonModal: ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="ion-modal">{children}</div> : null,
  };
});

const teachers = teachersData as readonly TeacherProfile[];

describe("FacultyCompendiumModal", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <FacultyCompendiumModal
        isOpen={false}
        onDismiss={() => {}}
        teachers={teachers}
        unlockedIds={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should display collection progress and percentage", () => {
    const unlockedIds = [teachers[0].id, teachers[1].id];
    const { getByText } = render(
      <FacultyCompendiumModal
        isOpen={true}
        onDismiss={() => {}}
        teachers={teachers}
        unlockedIds={unlockedIds}
      />
    );

    expect(getByText(`解鎖 2 / ${teachers.length} 位教授`)).toBeDefined();
    const expectedPercent = `${Math.round((2 / teachers.length) * 100)}%`;
    expect(getByText(expectedPercent)).toBeDefined();
  });

  it("should show professor name for unlocked and mystery for locked", () => {
    const unlockedId = teachers[0].id;
    const { getByText, getAllByText } = render(
      <FacultyCompendiumModal
        isOpen={true}
        onDismiss={() => {}}
        teachers={teachers}
        unlockedIds={[unlockedId]}
      />
    );

    // Unlocked professor name should appear
    expect(getByText(teachers[0].name)).toBeDefined();

    // Locked professors should display placeholder
    expect(getAllByText("？？？").length).toBe(teachers.length - 1);
  });

  it("should filter teachers when filter pills are clicked", () => {
    const unlockedIds = [teachers[0].id, teachers[1].id];
    const { getByText, queryByText } = render(
      <FacultyCompendiumModal
        isOpen={true}
        onDismiss={() => {}}
        teachers={teachers}
        unlockedIds={unlockedIds}
      />
    );

    // Click "已解鎖" filter
    const unlockedFilterBtn = getByText(`已解鎖 (${unlockedIds.length})`);
    fireEvent.click(unlockedFilterBtn);

    expect(getByText(teachers[0].name)).toBeDefined();
    expect(getByText(teachers[1].name)).toBeDefined();
    expect(queryByText("？？？")).toBeNull();

    // Click "未解鎖" filter
    const lockedFilterBtn = getByText(`未解鎖 (${teachers.length - unlockedIds.length})`);
    fireEvent.click(lockedFilterBtn);

    expect(queryByText(teachers[0].name)).toBeNull();
    expect(queryByText(teachers[1].name)).toBeNull();
  });

  it("should open and close professor detail modal on card click", () => {
    const unlockedTeacher = teachers[0];
    const { getByText, queryByLabelText, getByLabelText } = render(
      <FacultyCompendiumModal
        isOpen={true}
        onDismiss={() => {}}
        teachers={teachers}
        unlockedIds={[unlockedTeacher.id]}
      />
    );

    // Click unlocked teacher card
    const teacherCard = getByText(unlockedTeacher.name).closest('[role="button"]')!;
    fireEvent.click(teacherCard);

    // Detail card should display email and education
    expect(getByText(unlockedTeacher.email)).toBeDefined();
    expect(getByText(unlockedTeacher.education)).toBeDefined();

    // Close detail card
    const closeDetailBtn = getByLabelText("關閉詳情");
    fireEvent.click(closeDetailBtn);

    expect(queryByLabelText("關閉詳情")).toBeNull();
  });

  it("should invoke onDismiss when close button is clicked", () => {
    const onDismiss = vi.fn();
    const { getByLabelText } = render(
      <FacultyCompendiumModal
        isOpen={true}
        onDismiss={onDismiss}
        teachers={teachers}
        unlockedIds={[]}
      />
    );

    fireEvent.click(getByLabelText("關閉圖鑑"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
