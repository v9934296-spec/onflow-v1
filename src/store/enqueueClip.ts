import { mintSessionId, mintUserId } from "../domain/mappers/ids";
import type { LocalId } from "../domain/types/ids";
import type { OutboxRow } from "../domain/models";
import { newLocalId, upsertOutbox } from "./outbox";
import { runOutboxRow } from "./upload";
import { useAuthStore } from "./authStore";
import { useSessionStore } from "./sessionStore";
import { compressionContract } from "../domain/compression";

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
  const session = useSessionStore.getState().session;
  const localId = newLocalId();
  const row: OutboxRow = {
    schemaVersion: 1,
    localId,
    ownerUserId: mintUserId(userId),
    clipId: null,
    sessionId: session ? mintSessionId(session.id) : null,
    state: "pending",
    mediaKind: input.mediaKind,
    localUri: input.uri,
    mimeType: input.mimeType,
    durationSeconds: input.durationSeconds,
    sizeBytes: input.sizeBytes,
    capturedAt: input.capturedAt,
    bytesUploaded: null,
    attemptCount: 0,
    nextRetryAt: null,
    errorKind: null,
  };
  await upsertOutbox(row);
  void runOutboxRow(localId);
  return localId;
}
