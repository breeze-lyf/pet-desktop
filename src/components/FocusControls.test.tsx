import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FocusControls } from "./FocusControls";

describe("FocusControls", () => {
  it("starts the focus timer", () => {
    const onStart = vi.fn();
    render(
      <FocusControls
        minutes={60}
        remainingSeconds={3600}
        status="idle"
        onMinutesChange={vi.fn()}
        onStart={onStart}
        onPause={vi.fn()}
        onReset={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开始陪伴" }));
    expect(onStart).toHaveBeenCalled();
  });
});
