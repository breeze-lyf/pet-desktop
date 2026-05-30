import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanionStage } from "./CompanionStage";

describe("CompanionStage", () => {
  it("shows the pet name and reminder mood", () => {
    render(
      <CompanionStage petName="Momo" portraitDataUrl="data:image/png;base64,abc" mood="reminding" />
    );

    expect(screen.getByText("Momo", { selector: ".companion-status strong" })).toBeInTheDocument();
    expect(screen.getByText("在提醒你休息", { selector: ".companion-status span" })).toBeInTheDocument();
  });

  it("shows the pet portrait and name badge", () => {
    render(
      <CompanionStage petName="Momo" portraitDataUrl="data:image/png;base64,abc" mood="idle" />
    );

    expect(screen.getByAltText("Momo 的陪伴头像")).toBeInTheDocument();
    const badge = screen.getByText("Momo", { selector: ".pet-name-badge strong" });
    expect(badge).toBeInTheDocument();
  });
});
