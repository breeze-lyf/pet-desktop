import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with onboarding", () => {
    render(<App />);
    expect(screen.getByText("创建你的陪伴宠物")).toBeInTheDocument();
  });
});
