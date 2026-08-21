import * as FileSystem from "expo-file-system";
import { completeUpload, fetchClipJob, initiateUpload } from "../api/endpoints";
import type { OutboxRow } from "../domain/models";
import { classifyHttpFailure } from "../domain/outbox";
import { compressionContract } from "../domain/compression";
import { getOutbox, upsertOutbox } from "./outbox";
import { mintClipId } from "../domain/mappers/ids";

function rejectIfOverCeiling(row: OutboxRow): OutboxRow | null {
  if (row.durationSeconds > compressionContract.maxDurationSeconds) {
    return { ...row, state: "failed_permanent", errorKind: "clip_too_long" };
  }
  if (row.sizeBytes > compressionContract.maxBytes) {
    return { ...row, state: "failed_permanent", errorKind: "clip_too_large" };
  }
  return null;
}

export async function runOutboxRow(localId: string): Promise<OutboxRow | null> {
  const existing = await getOutbox(localId);
  if (!existing) return null;
  const ceiling = rejectIfOverCeiling(existing);
  if (ceiling) {
    await upsertOutbox(ceiling);
    return ceiling;
  }

  let row: OutboxRow = { ...existing, state: "presigning" };
  await upsertOutbox(row);

  const initiated = await initiateUpload({
    sessionId: row.sessionId ?? undefined,
    durationSeconds: row.durationSeconds,
    widthPx: compressionContract.longEdgePx,
    heightPx: compressionContract.longEdgePx,
    contentType: row.mimeType,
    sizeBytes: row.sizeBytes,
    capturedAt: row.capturedAt,
  });
  if (!initiated.ok) {
    row = {
      ...row,
      state: classifyHttpFailure(initiated.error.status ?? 0),
      errorKind: initiated.error.kind,
    };
    await upsertOutbox(row);
    return row;
  }

  row = {
    ...row,
    clipId: mintClipId(initiated.data.clip_id),
    state: "uploading",
    bytesUploaded: 0,
  };
  await upsertOutbox(row);

  const put = await putFile(initiated.data.upload_url, row.localUri, row.mimeType);
  if (!put.ok) {
    row = { ...row, state: "failed_retryable", errorKind: "upload_failed_retryable" };
    await upsertOutbox(row);
    return row;
  }

  row = { ...row, state: "requesting_analysis", bytesUploaded: row.sizeBytes };
  await upsertOutbox(row);

  const completed = await completeUpload(initiated.data.clip_id);
  if (!completed.ok) {
    if (completed.error.status === 409) {
      row = { ...row, state: "analyzing" };
      await upsertOutbox(row);
      return row;
    }
    row = {
      ...row,
      state: classifyHttpFailure(completed.error.status ?? 0),
      errorKind: completed.error.code ?? completed.error.kind,
    };
    await upsertOutbox(row);
    return row;
  }

  row = { ...row, state: "analyzing" };
  await upsertOutbox(row);
  return row;
}

export async function pollJob(clipId: string) {
  return fetchClipJob(clipId);
}

async function putFile(
  url: string,
  localUri: string,
  mime: string,
): Promise<{ ok: boolean }> {
  if (url.startsWith("local://")) return { ok: true };
  try {
    const result = await FileSystem.uploadAsync(url, localUri, {
      httpMethod: "PUT",
      headers: { "Content-Type": mime },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });
    return { ok: result.status >= 200 && result.status < 300 };
  } catch {
    return { ok: false };
  }
}
