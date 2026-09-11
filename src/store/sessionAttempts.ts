import { create } from "zustand";
import { fetchSessionAttempts, syncAttempts } from "../api/endpoints";
import {
  applyRejection,
  applyTransportFailure,
  dueRows,
  earliestRetryAt,
  liveAttempts,
  queueRowFromAttempt,
  reviveDead,
  type AttemptQueueRow,
} from "../domain/attemptQueue";
import { mergeAttempts } from "../domain/attempts";
import type { Attempt } from "../domain/models";
import { kv, kvUserKeys } from "./kv";

/**
 * Attempts for the active session, plus a persisted retry queue. The outcome
 * is written to disk before any request leaves the phone. `attempt.id` is the
 * idempotency key the server already treats as immutable.
 */
interface SessionAttemptsSlice {
  userId: string | null;
  sessionId: string | null;
  confirmed: Attempt[];
  pending: Attempt[];
  queue: AttemptQueueRow[];
  loading: boolean;

  load: (userId: string, sessionId: string | null) => Promise<void>;
  record: (userId: string, attempt: Attempt) => Promise<boolean>;
  flush: (userId: string, opts?: { force?: boolean }) => Promise<void>;
  retryDead: (userId: string, idempotencyKey?: string) => Promise<void>;
  dismissDead: (userId: string, idempotencyKey: string) => void;
}

interface PersistedQueue {
  readonly schemaVersion: 1 | 2;
  readonly attempts?: Attempt[];
  readonly rows?: AttemptQueueRow[];
}

function readQueue(userId: string): AttemptQueueRow[] {
  const raw = kv.get(kvUserKeys.pendingAttempts(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PersistedQueue;
    if (parsed.schemaVersion === 2 && Array.isArray(parsed.rows)) {
      return parsed.rows.filter((row) => row?.attempt && row.idempotencyKey);
    }
    if (parsed.schemaVersion === 1 && Array.isArray(parsed.attempts)) {
      return parsed.attempts.map(queueRowFromAttempt);
    }
    return [];
  } catch {
    kv.delete(kvUserKeys.pendingAttempts(userId));
    return [];
  }
}

function writeQueue(userId: string, rows: readonly AttemptQueueRow[]): void {
  if (rows.length === 0) {
    kv.delete(kvUserKeys.pendingAttempts(userId));
    return;
  }
  const record: PersistedQueue = { schemaVersion: 2, rows: [...rows] };
  kv.set(kvUserKeys.pendingAttempts(userId), JSON.stringify(record));
}

function applyQueue(
  set: (partial: Partial<SessionAttemptsSlice>) => void,
  userId: string,
  rows: AttemptQueueRow[],
) {
  writeQueue(userId, rows);
  set({ queue: rows, pending: liveAttempts(rows) });
}

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry(userId: string, rows: readonly AttemptQueueRow[]): void {
  if (retryTimer) clearTimeout(retryTimer);
  const at = earliestRetryAt(rows);
  if (!at) return;
  const wait = Math.max(0, Date.parse(at) - Date.now());
  retryTimer = setTimeout(() => {
    void useSessionAttemptsStore.getState().flush(userId);
  }, wait);
}

export const useSessionAttemptsStore = create<SessionAttemptsSlice>((set, get) => ({
  userId: null,
  sessionId: null,
  confirmed: [],
  pending: [],
  queue: [],
  loading: false,

  load: async (userId, sessionId) => {
    const switchedUser = get().userId !== userId;
    const switchedSession = get().sessionId !== sessionId;
    const queue = switchedUser ? readQueue(userId) : get().queue;
    set({
      userId,
      sessionId,
      queue,
      pending: liveAttempts(queue),
      confirmed: switchedSession ? [] : get().confirmed,
      loading: sessionId != null,
    });
    if (sessionId) {
      const res = await fetchSessionAttempts(sessionId);
      if (get().userId !== userId || get().sessionId !== sessionId) return;
      if (res.ok) set({ confirmed: res.data });
    }
    set({ loading: false });
    await get().flush(userId);
  },

  record: async (userId, attempt) => {
    if (get().userId !== userId) {
      const queue = readQueue(userId);
      set({ userId, queue, pending: liveAttempts(queue) });
    }
    const row = queueRowFromAttempt(attempt);
    const queue = [...get().queue.filter((item) => item.idempotencyKey !== row.idempotencyKey), row];
    applyQueue(set, userId, queue);
    await get().flush(userId);
    return !get().pending.some((item) => item.id === attempt.id);
  },

  flush: async (userId, opts) => {
    if (flushing) return;
    if (get().userId !== userId) return;
    const due = opts?.force
      ? get().queue.filter((row) => row.state !== "dead")
      : dueRows(get().queue);
    if (due.length === 0) {
      scheduleRetry(userId, get().queue);
      return;
    }
    flushing = true;
    try {
      const res = await syncAttempts(due.map((row) => row.attempt));
      if (get().userId !== userId) return;
      if (!res.ok) {
        const next = get().queue.map((row) =>
          due.some((item) => item.idempotencyKey === row.idempotencyKey)
            ? applyTransportFailure(row, res.error.kind)
            : row,
        );
        applyQueue(set, userId, next);
        scheduleRetry(userId, next);
        return;
      }
      const accepted = new Set(res.data.accepted);
      const rejected = new Map((res.data.rejected ?? []).map((row) => [row.id, row.reason]));
      const sessionId = get().sessionId;
      const moved: Attempt[] = [];
      const next: AttemptQueueRow[] = [];
      for (const row of get().queue) {
        if (accepted.has(row.attempt.id)) {
          if (row.attempt.sessionId === sessionId) moved.push(row.attempt);
          continue;
        }
        const reason = rejected.get(row.attempt.id);
        if (reason) {
          next.push(applyRejection(row, reason));
          continue;
        }
        next.push(row);
      }
      applyQueue(set, userId, next);
      if (moved.length > 0) set({ confirmed: mergeAttempts(get().confirmed, moved) });
      if ([...rejected.values()].some((reason) => reason !== "duplicate_in_batch") && sessionId) {
        const refreshed = await fetchSessionAttempts(sessionId);
        if (refreshed.ok && get().sessionId === sessionId) set({ confirmed: refreshed.data });
      }
      scheduleRetry(userId, next);
    } finally {
      flushing = false;
    }
  },

  retryDead: async (userId, idempotencyKey) => {
    const next = get().queue.map((row) => {
      if (row.state !== "dead") return row;
      if (idempotencyKey && row.idempotencyKey !== idempotencyKey) return row;
      return reviveDead(row);
    });
    applyQueue(set, userId, next);
    await get().flush(userId, { force: true });
  },

  dismissDead: (userId, idempotencyKey) => {
    applyQueue(
      set,
      userId,
      get().queue.filter((row) => row.idempotencyKey !== idempotencyKey),
    );
  },
}));
