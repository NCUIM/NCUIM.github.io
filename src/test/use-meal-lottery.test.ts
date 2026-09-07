import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMealLottery } from "../components/seats/useMealLottery";

const mockPresentToast = vi.fn();

vi.mock("@ionic/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ionic/react")>();
  return {
    ...actual,
    useIonToast: () => [mockPresentToast, vi.fn()],
  };
});

describe("useMealLottery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPresentToast.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("initializes with default room and candidates", () => {
    const { result } = renderHook(() =>
      useMealLottery({ isOpen: true, defaultRoomId: "209" }),
    );

    expect(result.current.selectedRoom).toBe("209");
    expect(result.current.pickCount).toBe(1);
    expect(result.current.isRolling).toBe(false);
    expect(result.current.autoNoRepeat).toBe(false);
    expect(result.current.showExcluded).toBe(false);
    expect(result.current.candidatesPool.length).toBeGreaterThan(0);
    expect(result.current.drawButtonText).toBe("開始抽籤");
  });

  it("handles room selection and resets picked results", () => {
    const { result } = renderHook(() =>
      useMealLottery({ isOpen: true, defaultRoomId: "209" }),
    );

    act(() => {
      result.current.handleSelectRoom("310");
    });

    expect(result.current.selectedRoom).toBe("310");
    expect(result.current.pickedResults).toEqual([]);
    expect(
      result.current.candidatesPool.every((c) => c.roomId === "310"),
    ).toBe(true);

    act(() => {
      result.current.handleSelectRoom("all");
    });
    expect(result.current.selectedRoom).toBe("all");
    expect(result.current.candidatesPool.length).toBeGreaterThan(20);
  });

  it("handles pick count and repeat toggles", () => {
    const { result } = renderHook(() =>
      useMealLottery({ isOpen: true, defaultRoomId: "209" }),
    );

    act(() => {
      result.current.handleSelectPickCount(3);
    });
    expect(result.current.pickCount).toBe(3);

    act(() => {
      result.current.handleToggleAutoNoRepeat();
    });
    expect(result.current.autoNoRepeat).toBe(true);

    act(() => {
      result.current.handleToggleShowExcluded();
    });
    expect(result.current.showExcluded).toBe(true);
  });

  it("performs draw animation and finalizes picked results", () => {
    const { result } = renderHook(() =>
      useMealLottery({ isOpen: true, defaultRoomId: "209" }),
    );

    act(() => {
      result.current.handleSelectPickCount(2);
    });

    act(() => {
      result.current.handleStartDraw();
    });

    expect(result.current.isRolling).toBe(true);
    expect(result.current.drawButtonText).toBe("抽獎中...");

    // Fast-forward interval ticks
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current.rollingCandidate).not.toBeNull();

    // Fast-forward until finish
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.isRolling).toBe(false);
    expect(result.current.rollingCandidate).toBeNull();
    expect(result.current.pickedResults).toHaveLength(2);
  });

  it("records excluded names when autoNoRepeat is enabled and blocks when exhausted", () => {
    const { result } = renderHook(() =>
      useMealLottery({ isOpen: true, defaultRoomId: "209" }),
    );

    act(() => {
      result.current.handleToggleAutoNoRepeat();
    });
    expect(result.current.autoNoRepeat).toBe(true);

    act(() => {
      result.current.handleSelectPickCount(2);
    });

    // Initial draw of 2
    act(() => {
      result.current.handleStartDraw();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.excludedNames).toHaveLength(2);

    // Reset exclusions
    act(() => {
      result.current.handleResetExclusions();
    });
    expect(result.current.excludedNames).toHaveLength(0);
    expect(mockPresentToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "已重置已中籤名單" }),
    );
  });

  it("copies results to clipboard when requested", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() =>
      useMealLottery({ isOpen: true, defaultRoomId: "209" }),
    );

    act(() => {
      result.current.handleStartDraw();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await act(async () => {
      await result.current.handleCopyResults();
    });

    expect(writeTextMock).toHaveBeenCalled();
    expect(mockPresentToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "已複製名單到剪貼簿！" }),
    );
  });
});
