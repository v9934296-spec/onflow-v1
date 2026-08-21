/**
 * Design tokens, spec 10.2.
 *
 * Bebas Neue has no lowercase and no true bold, so `display` is headings only —
 * never body, never a feedback verdict, never an error message. Mono is reserved
 * for machine-truth (timestamps, versions, state tags) and never for prose.
 */

export const fontFamily = {
  display: "BebasNeue_400Regular",
  bodySemiBold: "Sora_600SemiBold",
  body: "Sora_400Regular",
  mono: "JetBrainsMono_400Regular",
} as const;

export const textStyle = {
  hero: { fontSize: 42, lineHeight: 44, fontFamily: fontFamily.display },
  h1: { fontSize: 30, lineHeight: 33, fontFamily: fontFamily.display },
  h2: { fontSize: 22, lineHeight: 26, fontFamily: fontFamily.display },
  bodyLg: { fontSize: 17, lineHeight: 25, fontFamily: fontFamily.body },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.body },
  bodySm: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.body },
  label: { fontSize: 13, lineHeight: 16, fontFamily: fontFamily.bodySemiBold },
  mono: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.mono },
} as const;

/** Minimum body size for outdoor legibility (spec 10.2). */
export const MIN_BODY_FONT_SIZE = 15;

/** Dynamic Type ceilings. The capture overlay caps visuals but not labels. */
export const dynamicTypeMaxScale = {
  default: 2.0,
  captureOverlay: 1.3,
} as const;

export type TextStyleToken = keyof typeof textStyle;
