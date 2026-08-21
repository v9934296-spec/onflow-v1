import type { OutboxRow, OutboxState } from "../domain/models";

const RETRYABLE: ReadonlySet<OutboxState> = new Set(["failed_retryable"]);
const TERMINAL: ReadonlySet<OutboxState> = new Set([
  "ready",
  "failed_permanent",
  "cancelled",
]);

export function canRetry(row: OutboxRow): boolean {
  return RETRYABLE.has(row.state);
}

export function isTerminal(row: OutboxRow): boolean {
  return TERMINAL.has(row.state);
}

export function classifyHttpFailure(status: number): OutboxState {
  if (status === 401 || status === 403 || status === 413 || status === 422) {
    return "failed_permanent";
  }
  return "failed_retryable";
}

export function nextRetryAt(attemptCount: number, nowMs = Date.now()): string {
  const delayMs = Math.min(60_000, 2_000 * 2 ** Math.max(0, attemptCount - 1));
  return new Date(nowMs + delayMs).toISOString();
}

export function progressFraction(row: OutboxRow): number | null {
  if (row.state !== "uploading") return null;
  if (row.sizeBytes <= 0 || row.bytesUploaded == null) return null;
  return Math.min(1, Math.max(0, row.bytesUploaded / row.sizeBytes));
}

export function analyzingPhase(
  state: OutboxState,
  jobStatus: "pending" | "processing" | "completed" | "failed" | null,
): "UPLOADING" | "QUEUED" | "REVIEWING CLIP" | "READY" | "FAILED" {
  if (state === "uploading" || state === "presigning") return "UPLOADING";
  if (state === "failed_retryable" || state === "failed_permanent") return "FAILED";
  if (jobStatus === "failed" || state === "ready") {
    return jobStatus === "failed" ? "FAILED" : "READY";
  }
  if (jobStatus === "processing") return "REVIEWING CLIP";
  if (jobStatus === "completed") return "READY";
  return "QUEUED";
}
