import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePersistentState } from "./usePersistentState";

describe("usePersistentState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists updates to localStorage", () => {
    const { result } = renderHook(() => usePersistentState("name", "Momo"));

    act(() => {
      result.current[1]("Lucky");
    });

    expect(result.current[0]).toBe("Lucky");
    expect(localStorage.getItem("name")).toBe("\"Lucky\"");
  });
});
