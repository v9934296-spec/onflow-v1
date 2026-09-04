/** Grok instrument math. Null score is absence — never drawn as zero. */

export function tickCountFilled(progress: number, ticks = 28): number {
  return Math.round(Math.max(0, Math.min(1, progress)) * ticks);
}

export function engineRingDashOffset(score: number | null, circumference: number): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  const clamped = Math.max(0, Math.min(10, score));
  return circumference * (1 - clamped / 10);
}

/**
 * Grok capture/engine chrome sits over asphalt without a second fill.
 * ScreenSafeArea stays opaque on tab roots; this is only for asphalt overlays.
 */
export const TRANSPARENT_OVER_ASPHALT = { backgroundColor: "transparent" } as const;
