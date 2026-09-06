import { create } from "zustand";
import type { SelectedTrick, SkateSession } from "../domain/models";
import { kv, kvKeys } from "./kv";

export interface PendingSessionEnd {
  readonly sessionId: string;
  readonly endedAt: string;
}

interface SessionSlice {
  hydrating: boolean;
  session: SkateSession | null;
  trick: SelectedTrick | null;
  /** A session ended on this phone that the server has not confirmed yet. Persisted. */
  pendingEnd: PendingSessionEnd | null;
  setHydrating: (value: boolean) => void;
  setSession: (session: SkateSession | null) => void;
  setTrick: (trick: SelectedTrick | null) => void;
  setPendingEnd: (pending: PendingSessionEnd | null) => void;
  hydrateFromKv: () => void;
}

function readJson<T>(key: string): T | null {
  const raw = kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    kv.delete(key);
    return null;
  }
}

export const useSessionStore = create<SessionSlice>((set) => ({
  hydrating: true,
  session: null,
  trick: null,
  pendingEnd: null,
  setHydrating: (hydrating) => set({ hydrating }),
  setSession: (session) => {
    if (session) {
      kv.set(kvKeys.activeSessionId, session.id);
      kv.set(kvKeys.activeSession, JSON.stringify(session));
    } else {
      kv.delete(kvKeys.activeSessionId);
      kv.delete(kvKeys.activeSession);
    }
    set({ session });
  },
  setTrick: (trick) => {
    if (trick) kv.set(kvKeys.selectedTrick, JSON.stringify(trick));
    else kv.delete(kvKeys.selectedTrick);
    set({ trick });
  },
  setPendingEnd: (pendingEnd) => {
    if (pendingEnd) kv.set(kvKeys.pendingSessionEnd, JSON.stringify(pendingEnd));
    else kv.delete(kvKeys.pendingSessionEnd);
    set({ pendingEnd });
  },
  hydrateFromKv: () => {
    set({
      trick: readJson<SelectedTrick>(kvKeys.selectedTrick),
      session: readJson<SkateSession>(kvKeys.activeSession),
      pendingEnd: readJson<PendingSessionEnd>(kvKeys.pendingSessionEnd),
      hydrating: false,
    });
  },
}));
