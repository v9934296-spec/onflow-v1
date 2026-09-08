import type { OutboxRow, OutboxState } from "./models";

const RETRYABLE: ReadonlySet<OutboxState> = new Set(["failed_retryable"]);
const TERMINAL: ReadonlySet<OutboxState> = new Set([
  "ready",
  "failed_permanent",
  "cancelled",
]);

/** Machine kinds that have catalog copy. Free-text failure strings never pass through. */
export const CATALOG_ERROR_KINDS = [
  "offline",
  "rate_limited",
  "quota_exhausted",
  "tier_gate",
  "auth_expired",
  "upload_failed_retryable",
  "upload_failed_permanent",
  "clip_too_long",
  "clip_too_large",
  "clip_unsupported_type",
  "clip_unreadable",
  "analysis_failed",
  "contract_error",
  "session_missing",
  "session_already_ended",
  "capture_after_session_end",
  "attempt_conflict",
  "store_unavailable",
  "entitlement_syncing",
  "low_storage",
  "profile_save_failed",
  "profile_invalid",
  "unknown",
] as const;

export type CatalogErrorKind = (typeof CATALOG_ERROR_KINDS)[number];

const CATALOG_KIND_SET = new Set<string>(CATALOG_ERROR_KINDS);

export function isCatalogErrorKind(raw: string): raw is CatalogErrorKind {
  return CATALOG_KIND_SET.has(raw);
}

export function toCatalogErrorKind(
  raw: string | null | undefined,
  fallback: CatalogErrorKind = "unknown",
): CatalogErrorKind {
  if (!raw) return fallback;
  if (isCatalogErrorKind(raw)) return raw;
  switch (raw) {
    case "unauthorized":
      return "auth_expired";
    case "quota":
      return "quota_exhausted";
    case "contract":
      return "contract_error";
    case "server":
      return "upload_failed_retryable";
    case "offline":
      return "offline";
    case "rate_limited":
      return "rate_limited";
    case "client":
    case "configuration":
    case "cancelled":
      return fallback;
    default:
      return fallback;
  }
}

export function analyzingFailureKind(
  rowErrorKind: string | null,
  jobFailureReason: string | null,
): CatalogErrorKind {
  if (rowErrorKind) return toCatalogErrorKind(rowErrorKind, "unknown");
  if (jobFailureReason) return toCatalogErrorKind(jobFailureReason, "analysis_failed");
  return "analysis_failed";
}

export function isTransientTransportKind(kind: string): boolean {
  return kind === "offline" || kind === "rate_limited" || kind === "server" || kind === "cancelled";
}

export function backoffDue(nextRetryAtIso: string | null, nowMs = Date.now()): boolean {
  if (!nextRetryAtIso) return true;
  const at = Date.parse(nextRetryAtIso);
  return !Number.isFinite(at) || at <= nowMs;
}

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

/** Resume a recoverable draft through Analyzing, never by filming a new clip. */
export function resumeHref(localId: string): `/analyzing?localId=${string}` {
  return `/analyzing?localId=${localId}`;
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
