import { create } from "zustand";
import { fetchSessionAttempts, syncAttempts } from "../api/endpoints";
import { mergeAttempts } from "../domain/attempts";
import type { Attempt } from "../domain/models";
import { kv, kvUserKeys } from "./kv";

/**
 * Attempts for the active session, plus a persisted queue of attempts the
 * server has not accepted yet. The skater's outcome is the record, so it is
 * written to disk before any request leaves the phone; a dropped connection
 * never loses it. Pending attempts are sealed per user like outbox rows.
 */
interface SessionAttemptsSlice {
  userId: string | null;
  sessionId: string | null;
  /** Server-confirmed attempts for `sessionId`. */
  confirmed: Attempt[];
  /** Not yet accepted by the server, across sessions, for `userId`. */
  pending: Attempt[];
  loading: boolean;

  load: (userId: string, sessionId: string | null) => Promise<void>;
  /** Persists first, then tries to sync. Resolves true when the server accepted it. */
  record: (userId: string, attempt: Attempt) => Promise<boolean>;
  flush: (userId: string) => Promise<void>;
}

interface PersistedPending {
  readonly schemaVersion: 1;
  readonly attempts: Attempt[];
}

function readPending(userId: string): Attempt[] {
  const raw = kv.get(kvUserKeys.pendingAttempts(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PersistedPending;
    return parsed.schemaVersion === 1 && Array.isArray(parsed.attempts) ? parsed.attempts : [];
  } catch {
    kv.delete(kvUserKeys.pendingAttempts(userId));
    return [];
  }
}

function writePending(userId: string, attempts: readonly Attempt[]): void {
  if (attempts.length === 0) {
    kv.delete(kvUserKeys.pendingAttempts(userId));
    return;
  }
  const record: PersistedPending = { schemaVersion: 1, attempts: [...attempts] };
  kv.set(kvUserKeys.pendingAttempts(userId), JSON.stringify(record));
}

let flushing = false;

export const useSessionAttemptsStore = create<SessionAttemptsSlice>((set, get) => ({
  userId: null,
  sessionId: null,
  confirmed: [],
  pending: [],
  loading: false,

  load: async (userId, sessionId) => {
    const switchedUser = get().userId !== userId;
    const switchedSession = get().sessionId !== sessionId;
    set({
      userId,
      sessionId,
      pending: switchedUser ? readPending(userId) : get().pending,
      confirmed: switchedSession ? [] : get().confirmed,
      loading: sessionId != null,
    });
    if (sessionId) {
      const res = await fetchSessionAttempts(sessionId);
      if (get().userId !== userId || get().sessionId !== sessionId) return;
      // On failure the previous confirmed list stands; pending still counts.
      if (res.ok) set({ confirmed: res.data });
    }
    set({ loading: false });
    await get().flush(userId);
  },

  record: async (userId, attempt) => {
    if (get().userId !== userId) {
      set({ userId, pending: readPending(userId) });
    }
    const pending = [...get().pending.filter((row) => row.id !== attempt.id), attempt];
    writePending(userId, pending);
    set({ pending });
    await get().flush(userId);
    return !get().pending.some((row) => row.id === attempt.id);
  },

  flush: async (userId) => {
    if (flushing) return;
    const pending = get().pending;
    if (get().userId !== userId || pending.length === 0) return;
    flushing = true;
    try {
      const res = await syncAttempts(pending);
      if (get().userId !== userId) return;
      if (!res.ok || !Array.isArray(res.data?.accepted)) return; // keep everything; try again later
      const accepted = new Set(res.data.accepted);
      const rejected = new Set((res.data.rejected ?? []).map((row) => row.id));
      const remaining = get().pending.filter((row) => !accepted.has(row.id) && !rejected.has(row.id));
      const sessionId = get().sessionId;
      const moved = pending.filter((row) => accepted.has(row.id) && row.sessionId === sessionId);
      writePending(userId, remaining);
      set({ pending: remaining, confirmed: mergeAttempts(get().confirmed, moved) });
      // A rejection means the server already holds a different record (BE-001). Its version wins.
      if (rejected.size > 0 && sessionId) {
        const refreshed = await fetchSessionAttempts(sessionId);
        if (refreshed.ok && get().sessionId === sessionId) set({ confirmed: refreshed.data });
      }
    } finally {
      flushing = false;
    }
  },
}));
