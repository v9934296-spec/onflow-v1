import { createSession, endSession as endSessionApi, fetchSession } from "../api/endpoints";
import type { ApiErrorKind } from "../api/types";
import { useSessionStore } from "./sessionStore";
import { kv, kvKeys } from "./kv";
import { mintTrickId } from "../domain/mappers/ids";
import type { CatalogTrick, SelectedTrick } from "../domain/models";

export function selectCatalogTrick(
  trick: CatalogTrick,
  modifiers: { stance: string | null; direction: string | null } = { stance: null, direction: null },
): SelectedTrick {
  return {
    trickId: mintTrickId(trick.trickId),
    canonicalName: trick.name,
    stance: modifiers.stance,
    direction: modifiers.direction,
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
  if (res.ok) {
    useSessionStore.getState().setSession(res.data);
    return;
  }
  if (isTransient(res.error.kind)) return;
  useSessionStore.getState().setSession(null);
}

function isTransient(kind: ApiErrorKind): boolean {
  return (
    kind === "offline" ||
    kind === "server" ||
    kind === "cancelled" ||
    kind === "configuration" ||
    kind === "rate_limited" ||
    kind === "unauthorized"
  );
}

/**
 * The skater ended the session, so it ends on this phone now. The server is
 * told immediately; if it cannot be reached the end time is kept and retried
 * on the next foreground (spec §4 "Session end", §9 change 6).
 */
export async function closeSession() {
  const store = useSessionStore.getState();
  const session = store.session;
  if (!session) return;
  const endedAt = session.endedAt ?? new Date().toISOString();
  store.setSession(null);
  store.setTrick(null);
  if (session.endedAt) return;
  const res = await endSessionApi(session.id, endedAt);
  if (res.ok) {
    useSessionStore.getState().setPendingEnd(null);
  } else if (isTransient(res.error.kind)) {
    useSessionStore.getState().setPendingEnd({ sessionId: session.id, endedAt });
  }
  return res;
}

/** Foreground retry for an end the server never confirmed. `endSession` keeps an earlier server end time. */
export async function retryPendingSessionEnd(): Promise<void> {
  const pending = useSessionStore.getState().pendingEnd;
  if (!pending) return;
  const res = await endSessionApi(pending.sessionId, pending.endedAt);
  if (res.ok || !isTransient(res.error.kind)) {
    useSessionStore.getState().setPendingEnd(null);
  }
}
