/**
 * Design tokens — color.
 *
 * Supersedes spec §10.1 under the V1 mobile redesign (see
 * `docs/redesign-001-design-foundation.md`). The accent moved from `#00FFA6`
 * to `#54FF00`: a raw signal green rather than a soft mint, so the primary
 * action reads as OnFlow's rather than as a default dark-theme tint.
 *
 * `media.recording` is a separate namespace from `semantic.red` on purpose: a
 * recording indicator is a camera convention and a missed trick is not an
 * application error. Locked decision 14 survives the redesign unchanged —
 * red is never decorative.
 */

export const color = {
  bg: "#080808",
  /** One step off the background. Used for wells and inputs, not for cards. */
  surface: "#131313",
  /** Pressed / selected fill. */
  surfaceAlt: "#1C1C1C",

  hairline: "#242424",
  hairlineHi: "#3A3A3A",

  textPrimary: "#F5F5F5",
  textSecondary: "#9A9A9A",
  textTertiary: "#6A6A6A",

  /**
   * Primary action, positive state, landed. Carries hierarchy or state —
   * never decoration, never a background wash.
   */
  neon: "#54FF00",
  /** Warning / uncertain. Closed by DOC-001; carries `limited` readiness. */
  amber: "#FFB020",
  /** Errors and destructive actions only. Never decorative. */
  red: "#FF3B3B",
  /** Outlines, technical labels, missed outcome. */
  alum: "#9EA1A6",
} as const;

/** Camera convention. Not an error. Kept out of the semantic namespace. */
export const media = {
  recording: "#FF3B3B",
} as const;

export const scrim = {
  top: "rgba(8,8,8,0.72)",
  bottom: "rgba(8,8,8,0.88)",
} as const;

export type ColorToken = keyof typeof color;
