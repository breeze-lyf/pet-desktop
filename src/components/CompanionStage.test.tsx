import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanionStage } from "./CompanionStage";

describe("CompanionStage", () => {
  it("shows the pet name and reminder mood", () => {
    render(
      <CompanionStage petName="Momo" portraitDataUrl="data:image/png;base64,abc" mood="reminding" />
    );

    expect(screen.getByText("Momo")).toBeInTheDocument();
    expect(screen.getByText("在提醒你休息")).toBeInTheDocument();
  });
});
