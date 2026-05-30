import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PetOverlay } from "./PetOverlay";

beforeEach(() => {
  (window as any).electronAPI = {
    onTimerStateChange: vi.fn(() => () => {}),
    movePetWindow: vi.fn()
  };
});

describe("PetOverlay", () => {
  it("renders pet image when cartoonPath is provided via localStorage", () => {
    localStorage.setItem("pet-companion", JSON.stringify({
      profile: { id: "1", name: "奶盖", photoDataUrl: "", createdAt: "" },
      portraitDataUrl: "data:image/png;base64,abc",
      mood: "idle",
      cartoonPath: "/fake/cartoon.png"
    }));
    const { container } = render(<PetOverlay />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.src).toContain("cartoon.png");
  });

  it("falls back to portraitDataUrl when no cartoonPath", () => {
    localStorage.setItem("pet-companion", JSON.stringify({
      profile: { id: "1", name: "奶盖", photoDataUrl: "", createdAt: "" },
      portraitDataUrl: "data:image/png;base64,abc",
      mood: "idle"
    }));
    const { container } = render(<PetOverlay />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.src).toContain("base64,abc");
  });

  it("renders nothing when no companion in localStorage", () => {
    localStorage.removeItem("pet-companion");
    const { container } = render(<PetOverlay />);
    expect(container.firstChild).toBeNull();
  });
});
