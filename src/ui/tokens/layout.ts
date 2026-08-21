/** Design tokens, spec 10.3. */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** Minimums, not suggestions (spec 10.3, guardrails 12). */
export const touchTarget = {
  minimum: 48,
  primaryButton: 56,
  outcomeSelector: 64,
  captureControl: 76,
} as const;

export const motionMs = {
  press: 90,
  enter: 220,
  exit: 160,
  ambient: 1800,
} as const;

export const PRESS_SCALE = 0.97;
