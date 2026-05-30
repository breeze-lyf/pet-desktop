import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingPanel } from "./OnboardingPanel";

describe("OnboardingPanel", () => {
  it("requires a pet name before continuing", () => {
    const onCreate = vi.fn();
    render(<OnboardingPanel onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "生成陪伴宠物" }));

    expect(screen.getByText("先给宠物起个名字")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
