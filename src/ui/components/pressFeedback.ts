import { PRESS_SCALE, PRESS_SCALE_HARD, motionMs } from "../tokens";

/**
 * Press feedback under Reduce Motion (spec §10.3, guardrails 13).
 *
 * Reduce Motion means no movement — it does not mean no feedback. A control
 * that gives nothing back on touch is worse for everyone, so the compression
 * degrades to an opacity step applied instantly. Pure so the rule is asserted
 * by test rather than trusted to a device setting nobody here can toggle.
 */
export interface PressFeedback {
  readonly scale: number;
  readonly opacity: number;
  readonly durationMs: number;
}

/** Pressed opacity when movement is suppressed. Deliberately obvious in sunlight. */
export const REDUCED_MOTION_PRESS_OPACITY = 0.72;

export function pressFeedback(input: {
  pressed: boolean;
  reduceMotion: boolean;
  /** The large physical controls — FILM, record, START — compress harder. */
  hard?: boolean;
}): PressFeedback {
  if (!input.pressed) {
    return { scale: 1, opacity: 1, durationMs: input.reduceMotion ? 0 : motionMs.press };
  }
  if (input.reduceMotion) {
    return { scale: 1, opacity: REDUCED_MOTION_PRESS_OPACITY, durationMs: 0 };
  }
  return {
    scale: input.hard ? PRESS_SCALE_HARD : PRESS_SCALE,
    opacity: 1,
    durationMs: motionMs.press,
  };
}
