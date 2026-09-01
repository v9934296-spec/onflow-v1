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

export function popularFromRecent(
  tricks: readonly CatalogTrick[],
  recentIds: readonly string[],
): CatalogTrick[] {
  const counts = new Map<string, number>();
  for (const id of recentIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => tricks.find((t) => t.trickId === id))
    .filter((t): t is CatalogTrick => t != null)
    .slice(0, 8);
}
