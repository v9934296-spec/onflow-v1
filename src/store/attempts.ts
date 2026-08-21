import { syncAttempts } from "../api/endpoints";
import type { Attempt, AttemptOutcome } from "../domain/models";
import { mintAttemptId } from "../domain/mappers/ids";
import { useSessionStore } from "./sessionStore";

export async function reportOutcomeAndMaybeContinue(outcome: AttemptOutcome): Promise<void> {
  const { session, trick } = useSessionStore.getState();
  if (!session || !trick) return;
  const attempt: Attempt = {
    id: mintAttemptId(globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}`),
    sessionId: session.id,
    trickId: trick.trickId,
    canonicalName: trick.canonicalName,
    outcome,
    loggedAt: new Date().toISOString(),
  };
  await syncAttempts([attempt]);
}
