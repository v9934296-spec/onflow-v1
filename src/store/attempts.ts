import type { Attempt, AttemptOutcome, SelectedTrick } from "../domain/models";
import { mintAttemptId } from "../domain/mappers/ids";
import type { SessionId } from "../domain/types/ids";
import { useAuthStore } from "./authStore";
import { useSessionAttemptsStore } from "./sessionAttempts";
import { useSessionStore } from "./sessionStore";

/**
 * Records the skater's call for the current trick in the current session.
 * The attempt is persisted locally before any request is made and stays
 * queued until the server accepts it — the outcome is never lost to a dropped
 * connection. Resolves true when the server has it, false when it is queued.
 *
 * `clip` pins the call to the clip's own session and trick (a result reopened
 * from History); without it the current session and selected trick are used.
 */
export async function recordOutcome(
  outcome: AttemptOutcome,
  clip?: { sessionId: SessionId | null; trick: SelectedTrick | null },
): Promise<boolean> {
  const current = useSessionStore.getState();
  const sessionId = clip ? clip.sessionId : current.session?.id ?? null;
  const trick = clip ? clip.trick : current.trick;
  const userId = useAuthStore.getState().userId;
  if (!sessionId || !trick || !userId) return false;
  const attempt: Attempt = {
    id: mintAttemptId(globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}`),
    sessionId,
    trickId: trick.trickId,
    canonicalName: trick.canonicalName,
    outcome,
    loggedAt: new Date().toISOString(),
  };
  return useSessionAttemptsStore.getState().record(userId, attempt);
}
