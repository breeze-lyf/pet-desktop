import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFocusTimer } from "./useFocusTimer";

describe("useFocusTimer", () => {
  it("moves to reminder state when remaining time reaches zero", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFocusTimer(1));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.status).toBe("reminding");
    expect(result.current.remainingSeconds).toBe(0);
    vi.useRealTimers();
  });

  it("calls syncTimerState when status changes", () => {
    const syncTimerState = vi.fn();
    (window as any).electronAPI = { syncTimerState };
    const { result } = renderHook(() => useFocusTimer(25));
    act(() => result.current.start());
    expect(syncTimerState).toHaveBeenCalledWith("running");
    act(() => result.current.pause());
    expect(syncTimerState).toHaveBeenCalledWith("paused");
  });
});
