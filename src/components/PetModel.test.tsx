import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PetModel } from "./PetModel";

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@react-three/drei", () => ({
  useGLTF: vi.fn(() => ({ scene: { clone: () => ({ position: { y: 0 }, rotation: { x: 0, y: 0, z: 0 } }) } })),
  OrbitControls: () => null
}));

describe("PetModel", () => {
  it("renders without crashing given a modelPath and mood", () => {
    const { container } = render(
      <PetModel modelPath="/fake/pet.glb" mood="idle" onClick={() => {}} />
    );
    expect(container).toBeTruthy();
  });
});
