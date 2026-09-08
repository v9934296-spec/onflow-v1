import type { Attempt } from "./models";
import { backoffDue, nextRetryAt, toCatalogErrorKind, type CatalogErrorKind } from "./outbox";

export const ATTEMPT_QUEUE_SCHEMA = 2 as const;
export const ATTEMPT_FLUSH_LIMIT = 8;

export type AttemptQueueState = "queued" | "dead";

/** One locally persisted outcome. `idempotencyKey` is the attempt id — the server's immutable key. */
export interface AttemptQueueRow {
  readonly schemaVersion: typeof ATTEMPT_QUEUE_SCHEMA;
  readonly attempt: Attempt;
  readonly idempotencyKey: string;
  readonly flushCount: number;
  readonly nextRetryAt: string | null;
  readonly lastErrorKind: CatalogErrorKind | null;
  readonly state: AttemptQueueState;
}

export function queueRowFromAttempt(attempt: Attempt): AttemptQueueRow {
  return {
    schemaVersion: ATTEMPT_QUEUE_SCHEMA,
    attempt,
    idempotencyKey: attempt.id,
    flushCount: 0,
    nextRetryAt: null,
    lastErrorKind: null,
    state: "queued",
  };
}

export function liveAttempts(rows: readonly AttemptQueueRow[]): Attempt[] {
  return rows.filter((row) => row.state !== "dead").map((row) => row.attempt);
}

export function deadRows(rows: readonly AttemptQueueRow[]): AttemptQueueRow[] {
  return rows.filter((row) => row.state === "dead");
}

export function dueRows(rows: readonly AttemptQueueRow[], nowMs = Date.now()): AttemptQueueRow[] {
  const seen = new Set<string>();
  const due: AttemptQueueRow[] = [];
  for (const row of rows) {
    if (row.state === "dead") continue;
    if (seen.has(row.idempotencyKey)) continue;
    if (!backoffDue(row.nextRetryAt, nowMs)) continue;
    seen.add(row.idempotencyKey);
    due.push(row);
  }
  return due;
}

export function applyTransportFailure(
  row: AttemptQueueRow,
  rawKind: string,
  nowMs = Date.now(),
): AttemptQueueRow {
  const flushCount = row.flushCount + 1;
  const lastErrorKind = toCatalogErrorKind(rawKind, "offline");
  const dead = flushCount >= ATTEMPT_FLUSH_LIMIT || lastErrorKind === "auth_expired";
  return {
    ...row,
    flushCount,
    lastErrorKind,
    nextRetryAt: dead ? null : nextRetryAt(flushCount, nowMs),
    state: dead ? "dead" : "queued",
  };
}

/** Server already holds a different immutable record, or the payload cannot be stored. */
export function applyRejection(row: AttemptQueueRow, reason: string): AttemptQueueRow {
  if (reason === "duplicate_in_batch") {
    return { ...row, nextRetryAt: nextRetryAt(row.flushCount + 1), lastErrorKind: "attempt_conflict" };
  }
  return {
    ...row,
    flushCount: row.flushCount + 1,
    nextRetryAt: null,
    lastErrorKind: toCatalogErrorKind(reason, "attempt_conflict"),
    state: "dead",
  };
}

export function reviveDead(row: AttemptQueueRow): AttemptQueueRow {
  return {
    ...row,
    flushCount: 0,
    nextRetryAt: null,
    lastErrorKind: null,
    state: "queued",
  };
}

export function earliestRetryAt(rows: readonly AttemptQueueRow[]): string | null {
  let soonest: number | null = null;
  for (const row of rows) {
    if (row.state === "dead" || !row.nextRetryAt) continue;
    const at = Date.parse(row.nextRetryAt);
    if (!Number.isFinite(at)) continue;
    if (soonest == null || at < soonest) soonest = at;
  }
  return soonest == null ? null : new Date(soonest).toISOString();
}

export function syncSummary(rows: readonly AttemptQueueRow[]): {
  queued: number;
  dead: number;
  nextRetryAt: string | null;
} {
  return {
    queued: rows.filter((row) => row.state !== "dead").length,
    dead: rows.filter((row) => row.state === "dead").length,
    nextRetryAt: earliestRetryAt(rows),
  };
}
