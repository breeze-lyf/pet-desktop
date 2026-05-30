import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PetOverlay } from "./PetOverlay";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn()
}));
vi.mock("@react-three/drei", () => ({
  useGLTF: vi.fn(() => ({ scene: { clone: () => ({}) } })),
  OrbitControls: () => null
}));
vi.mock("./PetModel", () => ({ PetModel: () => <div data-testid="pet-model" /> }));

beforeEach(() => {
  (window as any).electronAPI = {
    onTimerStateChange: vi.fn(() => () => {}),
    movePetWindow: vi.fn()
  };
});

describe("PetOverlay", () => {
  it("renders canvas when modelPath is provided via localStorage", () => {
    localStorage.setItem("pet-companion", JSON.stringify({
      profile: { id: "1", name: "奶盖", photoDataUrl: "", createdAt: "" },
      portraitDataUrl: "",
      mood: "idle",
      modelPath: "/fake/pet.glb"
    }));
    const { getByTestId } = render(<PetOverlay />);
    expect(getByTestId("canvas")).toBeTruthy();
  });

  it("renders nothing when no companion in localStorage", () => {
    localStorage.removeItem("pet-companion");
    const { container } = render(<PetOverlay />);
    expect(container.firstChild).toBeNull();
  });
});
