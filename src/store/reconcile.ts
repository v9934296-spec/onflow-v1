import { useSessionAttemptsStore } from "./sessionAttempts";
import { retryPendingSessionEnd } from "./sessionActions";
import { drainRecoverable } from "./upload";
import { subscribeNetworkRestored } from "./net";

/** Drain every owned queue: clips, outcomes, then a pending session end. */
export async function reconcileOwnedWork(userId: string): Promise<void> {
  await drainRecoverable(userId);
  await useSessionAttemptsStore.getState().flush(userId, { force: true });
  await retryPendingSessionEnd();
}

export function subscribeReconcileTriggers(onTrigger: () => void): () => void {
  const stopNet = subscribeNetworkRestored(onTrigger);
  return () => {
    stopNet();
  };
}
