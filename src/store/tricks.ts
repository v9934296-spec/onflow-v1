import { fetchTricks } from "../api/endpoints";
import type { CatalogTrick } from "../domain/models";
import type { ApiResult } from "../api/types";
import { ok } from "../api/types";
import { kv, kvKeys } from "./kv";
import { bumpUsage, type TrickUsage } from "../domain/tricks";
import { rememberRecentId } from "../domain/tricks";

function readCatalogCache(): CatalogTrick[] {
  const raw = kv.get(kvKeys.trickCatalog);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CatalogTrick[]) : [];
  } catch {
    return [];
  }
}

export async function loadTrickCatalog(): Promise<ApiResult<CatalogTrick[]>> {
  const live = await fetchTricks();
  if (live.ok) {
    kv.set(kvKeys.trickCatalog, JSON.stringify(live.data));
    return live;
  }
  const cached = readCatalogCache();
  if (cached.length > 0) return ok(cached);
  return live;
}

export function readRecentTrickIds(): string[] {
  const raw = kv.get(kvKeys.recentTrickIds);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function readTrickUsage(): TrickUsage {
  const raw = kv.get(kvKeys.trickUsage);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const clean: Record<string, number> = {};
    for (const [id, count] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof count === "number" && Number.isFinite(count) && count > 0) clean[id] = count;
    }
    return clean;
  } catch {
    return {};
  }
}

/** Confirming a trick records both that it was just called and how often it has been. */
export function rememberConfirmedTrick(trickId: string): void {
  kv.set(kvKeys.recentTrickIds, JSON.stringify(rememberRecentId(readRecentTrickIds(), trickId)));
  kv.set(kvKeys.trickUsage, JSON.stringify(bumpUsage(readTrickUsage(), trickId)));
}
