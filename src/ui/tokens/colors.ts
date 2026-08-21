/**
 * Design tokens, spec 10.1.
 *
 * `media.recording` is a separate namespace from `semantic.red` on purpose: a
 * recording indicator is a camera convention and a missed trick is not an
 * application error.
 */

export const color = {
  bg: "#080808",
  surface: "#1A1A1A",
  surfaceAlt: "#222222",

  hairline: "#2A2A2A",
  hairlineHi: "#3A3A3A",

  textPrimary: "#F5F5F5",
  textSecondary: "#9A9A9A",
  textTertiary: "#6A6A6A",

  /** Primary action, positive state, landed. */
  neon: "#00FFA6",
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
  top: "rgba(10,10,11,0.72)",
  bottom: "rgba(10,10,11,0.88)",
} as const;

export type ColorToken = keyof typeof color;
