import { createSession, endSession as endSessionApi, fetchSession } from "../api/endpoints";
import { useSessionStore } from "./sessionStore";
import { kv, kvKeys } from "./kv";
import { mintTrickId } from "../domain/mappers/ids";
import type { CatalogTrick, SelectedTrick } from "../domain/models";

export function selectCatalogTrick(trick: CatalogTrick): SelectedTrick {
  return {
    trickId: mintTrickId(trick.trickId),
    canonicalName: trick.name,
    stance: null,
    direction: null,
  };
}

export async function startFreeSkateSession() {
  const created = await createSession();
  if (created.ok) useSessionStore.getState().setSession(created.data);
  return created;
}

export async function restoreActiveSession() {
  const id = kv.get(kvKeys.activeSessionId);
  if (!id) return;
  const res = await fetchSession(id);
  if (res.ok) useSessionStore.getState().setSession(res.data);
  else useSessionStore.getState().setSession(null);
}

export async function closeSession() {
  const session = useSessionStore.getState().session;
  if (!session) return;
  if (session.endedAt) {
    useSessionStore.getState().setSession(null);
    useSessionStore.getState().setTrick(null);
    return;
  }
  const endedAt = new Date().toISOString();
  const res = await endSessionApi(session.id, endedAt);
  if (res.ok) {
    useSessionStore.getState().setSession(null);
    useSessionStore.getState().setTrick(null);
    useSessionStore.getState().setPendingEnd(null);
  } else {
    useSessionStore.getState().setPendingEnd(endedAt);
  }
  return res;
}
