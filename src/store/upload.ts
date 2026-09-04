import * as FileSystem from "expo-file-system";
import { completeUpload, fetchClipJob, initiateUpload } from "../api/endpoints";
import type { ApiError } from "../api/types";
import type { OutboxRow } from "../domain/models";
import {
  backoffDue,
  classifyHttpFailure,
  isTransientTransportKind,
  nextRetryAt,
  toCatalogErrorKind,
} from "../domain/outbox";
import { clipExceedsLaunchCeiling, compressionContract } from "../domain/compression";
import { getOutbox, listRecoverable, upsertOutbox } from "./outbox";
import { mintClipId } from "../domain/mappers/ids";

const inFlight = new Set<string>();

const PIPELINE_STATES = new Set([
  "pending",
  "presigning",
  "uploading",
  "uploaded",
  "requesting_analysis",
  "failed_retryable",
  "analyzing",
]);

function rejectIfOverCeiling(row: OutboxRow): OutboxRow | null {
  const kind = clipExceedsLaunchCeiling(row);
  if (!kind) return null;
  return { ...row, state: "failed_permanent", errorKind: kind };
}

function fromApiError(error: ApiError, fallback: "upload_failed_retryable" | "analysis_failed" | "unknown") {
  if (error.code) {
    const mapped = toCatalogErrorKind(error.code, fallback);
    if (mapped !== fallback || error.code === fallback) return mapped;
  }
  return toCatalogErrorKind(error.kind, fallback);
}

function withRetry(row: OutboxRow, errorKind: string): OutboxRow {
  const attemptCount = row.attemptCount + 1;
  return {
    ...row,
    state: "failed_retryable",
    errorKind,
    attemptCount,
    nextRetryAt: nextRetryAt(attemptCount),
  };
}

function withPermanent(row: OutboxRow, errorKind: string): OutboxRow {
  return { ...row, state: "failed_permanent", errorKind, nextRetryAt: null };
}

function applyHttpFailure(row: OutboxRow, error: ApiError, fallback: "upload_failed_retryable" | "analysis_failed"): OutboxRow {
  const state = classifyHttpFailure(error.status ?? 0);
  const errorKind = fromApiError(error, fallback);
  if (state === "failed_permanent") return withPermanent(row, errorKind);
  return withRetry(row, errorKind);
}

export async function runOutboxRow(localId: string): Promise<OutboxRow | null> {
  if (inFlight.has(localId)) return getOutbox(localId);
  inFlight.add(localId);
  try {
    return await runUnlocked(localId);
  } finally {
    inFlight.delete(localId);
  }
}

async function runUnlocked(localId: string): Promise<OutboxRow | null> {
  const existing = await getOutbox(localId);
  if (!existing) return null;
  if (existing.state === "ready" || existing.state === "cancelled" || existing.state === "failed_permanent") {
    return existing;
  }
  const ceiling = rejectIfOverCeiling(existing);
  if (ceiling) {
    await upsertOutbox(ceiling);
    return ceiling;
  }
  if (existing.state === "analyzing" && existing.clipId) {
    return settleJob(existing);
  }
  if (
    existing.clipId &&
    (existing.state === "uploaded" || existing.state === "requesting_analysis" || existing.state === "failed_retryable")
  ) {
    return completePipeline(existing);
  }
  return initiatePipeline(existing);
}

async function initiatePipeline(existing: OutboxRow): Promise<OutboxRow> {
  let row: OutboxRow = { ...existing, state: "presigning", errorKind: null };
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
    row = applyHttpFailure(row, initiated.error, "upload_failed_retryable");
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
    row = withRetry({ ...row, clipId: null }, "upload_failed_retryable");
    await upsertOutbox(row);
    return row;
  }

  row = { ...row, state: "requesting_analysis", bytesUploaded: row.sizeBytes };
  await upsertOutbox(row);
  return completePipeline(row);
}

async function completePipeline(existing: OutboxRow): Promise<OutboxRow> {
  if (!existing.clipId) return initiatePipeline(existing);
  let row: OutboxRow = { ...existing, state: "requesting_analysis", errorKind: null };
  await upsertOutbox(row);

  const completed = await completeUpload(existing.clipId);
  if (!completed.ok) {
    if (completed.error.status === 409) {
      row = { ...row, state: "analyzing", errorKind: null };
      await upsertOutbox(row);
      return row;
    }
    row = applyHttpFailure(row, completed.error, "upload_failed_retryable");
    await upsertOutbox(row);
    return row;
  }

  row = { ...row, state: "analyzing" };
  await upsertOutbox(row);
  return row;
}

async function settleJob(row: OutboxRow): Promise<OutboxRow> {
  if (!row.clipId) return row;
  const polled = await fetchClipJob(row.clipId);
  if (!polled.ok) {
    if (isTransientTransportKind(polled.error.kind)) return row;
    const next = withPermanent(row, fromApiError(polled.error, "analysis_failed"));
    await upsertOutbox(next);
    return next;
  }
  if (polled.data.status === "completed") {
    const next: OutboxRow = { ...row, state: "ready", errorKind: null };
    await upsertOutbox(next);
    return next;
  }
  if (polled.data.status === "failed") {
    const next = withPermanent(row, toCatalogErrorKind(polled.data.failureReason, "analysis_failed"));
    await upsertOutbox(next);
    return next;
  }
  return row;
}

export async function pollJob(clipId: string) {
  return fetchClipJob(clipId);
}

/** Foreground drain. Does not touch imported originals. */
export async function drainRecoverable(userId: string): Promise<void> {
  const recoverable = await listRecoverable(userId);
  const now = Date.now();
  for (const row of recoverable) {
    if (!PIPELINE_STATES.has(row.state)) continue;
    if (row.state === "failed_retryable" && !backoffDue(row.nextRetryAt, now)) continue;
    await runOutboxRow(row.localId);
  }
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
