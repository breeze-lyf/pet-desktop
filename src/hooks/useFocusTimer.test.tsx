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
});
