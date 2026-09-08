import type { CatalogTrick } from "./models";

export const STANCE_OPTIONS = ["Regular", "Switch", "Nollie", "Fakie"] as const;
export const DIRECTION_OPTIONS = ["Frontside", "Backside"] as const;

export function mimeFromUri(uri: string): "video/mp4" | "video/quicktime" {
  const path = uri.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".mov") || path.endsWith(".qt")) return "video/quicktime";
  return "video/mp4";
}

export function categoriesOf(tricks: readonly CatalogTrick[]): string[] {
  return [...new Set(tricks.map((t) => t.category))].sort();
}

export function filterTricks(
  tricks: readonly CatalogTrick[],
  query: string,
  category: string | null,
): CatalogTrick[] {
  const q = query.trim().toLowerCase();
  return tricks
    .filter((t) => (category ? t.category === category : true))
    .filter((t) => {
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.aliases.some((a) => a.toLowerCase().includes(q));
    })
    .slice(0, 12);
}

/** When the exact filter is empty, offer nearest registry names — never a custom invented trick. */
export function nearestTricks(tricks: readonly CatalogTrick[], query: string): CatalogTrick[] {
  const q = query.trim().toLowerCase();
  if (!q) return tricks.slice(0, 12);
  const scored = tricks
    .map((t) => {
      const name = t.name.toLowerCase();
      const aliasHit = t.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()));
      let score = 0;
      if (name.startsWith(q)) score = 3;
      else if (name.includes(q)) score = 2;
      else if (aliasHit) score = 2;
      else if (q.length >= 2 && name.split(" ").some((w) => w.startsWith(q))) score = 1;
      return { t, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.t);
  return scored.slice(0, 12);
}

export function rememberRecentId(existing: readonly string[], trickId: string, limit = 8): string[] {
  const next = [trickId, ...existing.filter((id) => id !== trickId)];
  return next.slice(0, limit);
}

/**
 * How often each trick has actually been called, by trick id.
 *
 * Recency and frequency are different questions. The recent list is
 * de-duplicated by definition, so counting it can only ever produce ones —
 * which is why "Popular" used to be the recent list in a different order.
 * This is a separate tally.
 */
export type TrickUsage = Readonly<Record<string, number>>;

/** Kept bounded so a long-lived install cannot grow this without limit. */
const USAGE_LIMIT = 60;

export function bumpUsage(usage: TrickUsage, trickId: string): TrickUsage {
  const next: Record<string, number> = { ...usage, [trickId]: (usage[trickId] ?? 0) + 1 };
  const entries = Object.entries(next);
  if (entries.length <= USAGE_LIMIT) return next;
  return Object.fromEntries(
    entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, USAGE_LIMIT),
  );
}

/**
 * Tricks called more than once, most-called first. A trick tried a single
 * time is recent, not established, so `minUses` is 2 — otherwise this
 * degenerates back into a second recent list.
 */
export function popularFromUsage(
  tricks: readonly CatalogTrick[],
  usage: TrickUsage,
  { minUses = 2, limit = 6 }: { minUses?: number; limit?: number } = {},
): CatalogTrick[] {
  return Object.entries(usage)
    .filter(([, count]) => count >= minUses)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => tricks.find((t) => t.trickId === id))
    .filter((t): t is CatalogTrick => t != null)
    .slice(0, limit);
}

export function usageCount(usage: TrickUsage, trickId: string): number {
  return usage[trickId] ?? 0;
}
