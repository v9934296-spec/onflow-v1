/**
 * Design tokens — spacing, radii, borders, touch targets, motion.
 *
 * Supersedes spec §10.3 under the V1 mobile redesign. Radii tightened
 * (`14 → 12` max, `10 → 8` default) so surfaces read as hard sections rather
 * than rounded cards; `glow.center` removed — a drop-shadow glow is
 * decoration, and the center action earns dominance through size and
 * contrast instead.
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Restrained on purpose. Anything above `lg` needs a specific reason. */
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

/** Rules and outlines. Hairline for structure, rule for emphasis. */
export const border = {
  hairline: 1,
  rule: 2,
} as const;

/** Minimums, not suggestions (spec 10.3, guardrails 12). */
export const touchTarget = {
  minimum: 48,
  primaryButton: 56,
  outcomeSelector: 64,
  captureControl: 76,
} as const;

/** Fast and physical. Nothing in the product should take longer than `enter`. */
export const motionMs = {
  press: 120,
  enter: 200,
  exit: 140,
  ambient: 1800,
} as const;

/** Press compression for ordinary controls. */
export const PRESS_SCALE = 0.97;
/** Press compression for the large physical controls: FILM, record, outcome. */
export const PRESS_SCALE_HARD = 0.94;

/**
 * The one remaining glow: the recording state must be unmistakable from
 * arm's length in sun. Hex matches `media.recording`.
 */
export const glow = {
  record: {
    shadowColor: "#FF3B3B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
