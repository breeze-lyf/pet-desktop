import { describe, expect, it } from "vitest";
import { getDefaultTimerMinutes, restActivities, timerPresets } from "./rest";

describe("rest domain presets", () => {
  it("uses 60 minutes as the default timer", () => {
    expect(getDefaultTimerMinutes()).toBe(60);
  });

  it("includes the MVP rest activities", () => {
    expect(restActivities.map((activity) => activity.id)).toEqual([
      "eyes",
      "water",
      "stretch",
      "breathing",
      "walk"
    ]);
  });

  it("keeps timer presets user-friendly", () => {
    expect(timerPresets).toEqual([25, 45, 60, 90]);
  });
});
