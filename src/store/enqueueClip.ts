import { mintSessionId, mintUserId } from "../domain/mappers/ids";
import type { LocalId } from "../domain/types/ids";
import type { OutboxRow } from "../domain/models";
import { newLocalId, upsertOutbox } from "./outbox";
import { runOutboxRow } from "./upload";
import { useAuthStore } from "./authStore";
import { useSessionStore } from "./sessionStore";
import { compressionContract } from "../domain/compression";
import { persistOwnedClip } from "./ownedMedia";

export async function enqueueClip(input: {
  uri: string;
  durationSeconds: number;
  sizeBytes: number;
  mimeType: "video/mp4" | "video/quicktime";
  mediaKind: "recorded" | "imported";
  capturedAt: string;
}): Promise<LocalId | null> {
  const userId = useAuthStore.getState().userId;
  if (!userId) return null;
  if (input.durationSeconds > compressionContract.maxDurationSeconds) return null;
  if (input.sizeBytes > compressionContract.maxBytes) return null;
  const { session, trick } = useSessionStore.getState();
  const localId = newLocalId();
  const localUri = await persistOwnedClip(input.uri, localId, input.mimeType, input.sizeBytes);
  if (!localUri) return null;
  const row: OutboxRow = {
    schemaVersion: 1,
    localId,
    ownerUserId: mintUserId(userId),
    clipId: null,
    sessionId: session ? mintSessionId(session.id) : null,
    state: "pending",
    mediaKind: input.mediaKind,
    localUri,
    mimeType: input.mimeType,
    durationSeconds: input.durationSeconds,
    sizeBytes: input.sizeBytes,
    capturedAt: input.capturedAt,
    bytesUploaded: null,
    attemptCount: 0,
    nextRetryAt: null,
    errorKind: null,
    trick: trick ?? null,
    outcome: null,
  };
  await upsertOutbox(row);
  // A crashed request is recoverable from the persisted row on next foreground drain.
  void runOutboxRow(localId).catch(() => {});
  return localId;
}
