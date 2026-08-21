import { fetchTricks } from "../api/endpoints";
import type { CatalogTrick } from "../domain/models";
import type { ApiResult } from "../api/types";

export async function loadTrickCatalog(): Promise<ApiResult<CatalogTrick[]>> {
  return fetchTricks();
}
