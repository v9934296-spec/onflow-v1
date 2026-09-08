import type { Attempt, AttemptOutcome } from "../domain/models";
import { mintAttemptId } from "../domain/mappers/ids";
import { useAuthStore } from "./authStore";
import { useSessionAttemptsStore } from "./sessionAttempts";
import { useSessionStore } from "./sessionStore";

/**
 * Records the skater's call for the current trick in the current session.
 * The attempt is persisted locally before any request is made and stays
 * queued until the server accepts it — the outcome is never lost to a dropped
 * connection. Resolves true when the server has it, false when it is queued.
 */
export async function recordOutcome(outcome: AttemptOutcome): Promise<boolean> {
  const { session, trick } = useSessionStore.getState();
  const userId = useAuthStore.getState().userId;
  if (!session || !trick || !userId) return false;
  const attempt: Attempt = {
    id: mintAttemptId(globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}`),
    sessionId: session.id,
    trickId: trick.trickId,
    canonicalName: trick.canonicalName,
    outcome,
    loggedAt: new Date().toISOString(),
  };
  return useSessionAttemptsStore.getState().record(userId, attempt);
}
