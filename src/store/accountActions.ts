import { deleteAccount, exportAccount } from "../api/endpoints";
import { purgeOutboxForUser } from "./outbox";
import { kv, kvUserKeys } from "./kv";
import { useAuthStore } from "./authStore";

/** Business actions belong in the store, never in the screens. */
export async function requestAccountExport() {
  return exportAccount();
}

export async function requestAccountDeletion(userId: string) {
  const result = await deleteAccount();
  if (!result.ok) return result;

  try {
    await purgeOutboxForUser(userId);
  } finally {
    // Erase all owner-scoped drafts even if an individual media file vanished.
    for (const key of [
      kvUserKeys.activeSessionId(userId),
      kvUserKeys.activeSession(userId),
      kvUserKeys.selectedTrick(userId),
      kvUserKeys.pendingSessionEnd(userId),
      kvUserKeys.pendingAttempts(userId),
      kvUserKeys.onboardingDraft(userId),
      kvUserKeys.skaterProfile(userId),
    ]) {
      kv.delete(key);
    }
    await useAuthStore.getState().signOut();
  }
  return result;
}
