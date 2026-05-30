import { describe, expect, it } from "vitest";
import { createCompanionFromPhoto } from "./petGeneration";

describe("createCompanionFromPhoto", () => {
  it("creates a companion profile from a photo data URL", () => {
    const companion = createCompanionFromPhoto({
      name: "Momo",
      photoDataUrl: "data:image/png;base64,abc",
      now: "2026-05-30T00:00:00.000Z"
    });

    expect(companion.profile.name).toBe("Momo");
    expect(companion.profile.photoDataUrl).toBe("data:image/png;base64,abc");
    expect(companion.portraitDataUrl).toBe("data:image/png;base64,abc");
    expect(companion.mood).toBe("idle");
  });
});
