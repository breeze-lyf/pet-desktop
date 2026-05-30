import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { restActivities } from "../domain/rest";
import { RestOverlay } from "./RestOverlay";

describe("RestOverlay", () => {
  it("lets the user start a rest activity", () => {
    const onStartRest = vi.fn();
    render(
      <RestOverlay
        petName="Momo"
        activities={restActivities}
        onStartRest={onStartRest}
        onDismiss={vi.fn()}
        onFinishRest={vi.fn()}
        isResting={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "护眼休息 看向远处，慢慢眨眼，让眼睛离开屏幕一会儿。 3 分钟" }));
    expect(onStartRest).toHaveBeenCalledWith(restActivities[0]);
  });
});
