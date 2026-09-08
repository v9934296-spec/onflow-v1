/**
 * Design tokens — typography.
 *
 * Supersedes spec §10.2 under the V1 mobile redesign. The change is one of
 * emphasis, not of family: Bebas Neue was previously reserved for screen
 * titles, which left a numeric score as the largest thing on the Result
 * screen and a trick name set in 17pt body. `slate` and `slateSm` exist so a
 * trick name can be the strongest element on a screen, which is what the
 * product is actually about.
 *
 * Bebas Neue has no lowercase and no true bold, so display styles are
 * headings and trick names only — never body, never a feedback verdict,
 * never an error message. Mono is reserved for machine-truth (timestamps,
 * versions, state tags) and never for prose.
 */

export const fontFamily = {
  display: "BebasNeue_400Regular",
  bodySemiBold: "Sora_600SemiBold",
  body: "Sora_400Regular",
  mono: "JetBrainsMono_400Regular",
} as const;

export const textStyle = {
  /** The trick slate. The largest type in the product. */
  slate: { fontSize: 60, lineHeight: 58, letterSpacing: 0.5, fontFamily: fontFamily.display },
  /** Trick name in a row, a log entry, or a recap breakdown. */
  slateSm: { fontSize: 34, lineHeight: 34, letterSpacing: 0.4, fontFamily: fontFamily.display },

  hero: { fontSize: 42, lineHeight: 42, letterSpacing: 1, fontFamily: fontFamily.display },
  h1: { fontSize: 30, lineHeight: 31, letterSpacing: 0.8, fontFamily: fontFamily.display },
  h2: { fontSize: 22, lineHeight: 24, letterSpacing: 0.6, fontFamily: fontFamily.display },

  bodyLg: { fontSize: 17, lineHeight: 25, fontFamily: fontFamily.body },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.body },
  bodySm: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.body },

  label: { fontSize: 13, lineHeight: 16, letterSpacing: 0.4, fontFamily: fontFamily.bodySemiBold },
  /** Technical metadata around a slate: REGULAR · ATTEMPT 07 · LANDED. */
  meta: { fontSize: 11, lineHeight: 14, letterSpacing: 1.4, fontFamily: fontFamily.bodySemiBold },

  mono: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.mono },
  /** Machine-truth that has to survive arm's length in sun: clocks, counts. */
  monoLg: { fontSize: 14, lineHeight: 18, fontFamily: fontFamily.mono },
} as const;

/** Minimum body size for outdoor legibility (spec 10.2). */
export const MIN_BODY_FONT_SIZE = 15;

/** Dynamic Type ceilings. The capture overlay caps visuals but not labels. */
export const dynamicTypeMaxScale = {
  default: 2.0,
  captureOverlay: 1.3,
  /** Display type is already large; let it grow less so layouts survive 200%. */
  display: 1.6,
} as const;

export type TextStyleToken = keyof typeof textStyle;
