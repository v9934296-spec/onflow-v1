import { fetchTricks } from "../api/endpoints";
import type { CatalogTrick } from "../domain/models";
import type { ApiResult } from "../api/types";
import { ok } from "../api/types";
import { kv, kvKeys } from "./kv";
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

export function rememberConfirmedTrick(trickId: string): void {
  kv.set(kvKeys.recentTrickIds, JSON.stringify(rememberRecentId(readRecentTrickIds(), trickId)));
}
