import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { IonApp } from "@ionic/react";
import { TimetableHeader } from "../pages/TimetablePage";
import { CreditPageHeader } from "../pages/CreditPage";

const mockIsIos = vi.hoisted(() => vi.fn(() => false));
vi.mock("../services/platform", () => ({
  isIosHeaderMode: () => mockIsIos(),
}));

const timetableProps = {
  cisAuthenticated: true,
  viewScope: "all" as const,
  enrolledCount: 3,
  onToggleViewScope: () => {},
  onOpenCisModal: () => {},
  onLogout: () => {},
};

const slotOf = (label: string): string | null => {
  const btn = renderResult
    .getAllByLabelText(label)
    .find((el) => el.tagName === "ION-BUTTON");
  return btn?.closest("ion-buttons")?.getAttribute("slot") ?? null;
};

let renderResult: ReturnType<typeof render>;

describe("per-platform header action layout", () => {
  beforeEach(() => {
    cleanup();
    mockIsIos.mockReset();
    renderResult = {} as ReturnType<typeof render>;
  });

  describe("TimetableHeader (CIS linked, 4 actions)", () => {
    it("md mode: every action stays trailing", () => {
      mockIsIos.mockReturnValue(false);
      renderResult = render(
        <IonApp>
          <TimetableHeader {...timetableProps} />
        </IonApp>,
      );
      expect(slotOf("課務日程")).toBe("end");
      expect(slotOf("全所開課")).toBe("end");
      expect(slotOf("重新連結")).toBe("end");
      expect(slotOf("登出")).toBe("end");
    });

    it("ios mode: 重新連結 moves leading, the rest stay trailing", () => {
      mockIsIos.mockReturnValue(true);
      renderResult = render(
        <IonApp>
          <TimetableHeader {...timetableProps} />
        </IonApp>,
      );
      expect(slotOf("重新連結")).toBe("start");
      expect(slotOf("課務日程")).toBe("end");
      expect(slotOf("全所開課")).toBe("end");
      expect(slotOf("登出")).toBe("end");
    });

    it("ios mode, not linked: single 連結課表 action stays trailing", () => {
      mockIsIos.mockReturnValue(true);
      renderResult = render(
        <IonApp>
          <TimetableHeader {...timetableProps} cisAuthenticated={false} />
        </IonApp>,
      );
      expect(slotOf("連結課表")).toBe("end");
      expect(renderResult.queryAllByLabelText("重新連結")).toHaveLength(0);
    });
  });

  describe("CreditPageHeader", () => {
    it("md mode: both actions trailing", () => {
      mockIsIos.mockReturnValue(false);
      renderResult = render(
        <IonApp>
          <CreditPageHeader onOpenCisModal={() => {}} onResetAll={() => {}} />
        </IonApp>,
      );
      expect(slotOf("同步課務")).toBe("end");
      expect(slotOf("重設全部")).toBe("end");
    });

    it("ios mode: 同步課務 leads and 重設全部 trails", () => {
      mockIsIos.mockReturnValue(true);
      renderResult = render(
        <IonApp>
          <CreditPageHeader onOpenCisModal={() => {}} onResetAll={() => {}} />
        </IonApp>,
      );
      expect(slotOf("同步課務")).toBe("start");
      expect(slotOf("重設全部")).toBe("end");
    });
  });
});
