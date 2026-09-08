import { describe, expect, it } from "vitest";
import { pressFeedback, REDUCED_MOTION_PRESS_OPACITY } from "../pressFeedback";
import { motionMs, PRESS_SCALE, PRESS_SCALE_HARD } from "../../tokens";

describe("press feedback", () => {
  it("compresses on press and returns when released", () => {
    expect(pressFeedback({ pressed: true, reduceMotion: false })).toEqual({
      scale: PRESS_SCALE,
      opacity: 1,
      durationMs: motionMs.press,
    });
    expect(pressFeedback({ pressed: false, reduceMotion: false })).toEqual({
      scale: 1,
      opacity: 1,
      durationMs: motionMs.press,
    });
  });

  it("compresses the large physical controls harder", () => {
    expect(pressFeedback({ pressed: true, reduceMotion: false, hard: true }).scale).toBe(
      PRESS_SCALE_HARD,
    );
    expect(PRESS_SCALE_HARD).toBeLessThan(PRESS_SCALE);
  });

  it("never moves anything under Reduce Motion", () => {
    for (const hard of [false, true]) {
      for (const pressed of [false, true]) {
        expect(pressFeedback({ pressed, reduceMotion: true, hard }).scale).toBe(1);
        expect(pressFeedback({ pressed, reduceMotion: true, hard }).durationMs).toBe(0);
      }
    }
  });

  it("still answers the touch when movement is suppressed", () => {
    const pressed = pressFeedback({ pressed: true, reduceMotion: true });
    expect(pressed.opacity).toBe(REDUCED_MOTION_PRESS_OPACITY);
    expect(pressed.opacity).toBeLessThan(1);
    expect(pressFeedback({ pressed: false, reduceMotion: true }).opacity).toBe(1);
  });
});
