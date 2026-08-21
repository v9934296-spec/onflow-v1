import { unsafeBrand } from "../types/brand";
import type { Score } from "../models";

/**
 * Whole numbers 0–10 (DOC-001). Floats from the engine are rounded to nearest
 * int. Values outside the scale are rejected — they never become 0.
 */
export function mapScore(raw: number | null | undefined): Score | null {
  if (raw == null || Number.isNaN(raw)) return null;
  const rounded = Math.round(raw);
  if (rounded < 0 || rounded > 10) return null;
  return unsafeBrand<Score>(rounded);
}

/**
 * DOC-001: `insufficient` never shows a score. `limited` may, when the payload
 * actually has one. `usable` shows the score when present.
 */
export function scoreForDisplay(
  readiness: "usable" | "limited" | "insufficient" | null,
  score: Score | null,
): Score | null {
  if (score == null) return null;
  if (readiness === "insufficient") return null;
  return score;
}
