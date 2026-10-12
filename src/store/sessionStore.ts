import { create } from "zustand";
import type { SelectedTrick, SkateSession } from "../domain/models";
import { kv, kvUserKeys } from "./kv";
import { useAuthStore } from "./authStore";

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
  clearInMemory: () => void;
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
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    if (session) {
      kv.set(kvUserKeys.activeSessionId(userId), session.id);
      kv.set(kvUserKeys.activeSession(userId), JSON.stringify(session));
    } else {
      kv.delete(kvUserKeys.activeSessionId(userId));
      kv.delete(kvUserKeys.activeSession(userId));
    }
    set({ session });
  },
  setTrick: (trick) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    if (trick) kv.set(kvUserKeys.selectedTrick(userId), JSON.stringify(trick));
    else kv.delete(kvUserKeys.selectedTrick(userId));
    set({ trick });
  },
  setPendingEnd: (pendingEnd) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    if (pendingEnd) kv.set(kvUserKeys.pendingSessionEnd(userId), JSON.stringify(pendingEnd));
    else kv.delete(kvUserKeys.pendingSessionEnd(userId));
    set({ pendingEnd });
  },
  hydrateFromKv: () => {
    const userId = useAuthStore.getState().userId;
    set({
      trick: userId ? readJson<SelectedTrick>(kvUserKeys.selectedTrick(userId)) : null,
      session: userId ? readJson<SkateSession>(kvUserKeys.activeSession(userId)) : null,
      pendingEnd: userId ? readJson<PendingSessionEnd>(kvUserKeys.pendingSessionEnd(userId)) : null,
      hydrating: false,
    });
  },
  clearInMemory: () => set({ session: null, trick: null, pendingEnd: null, hydrating: false }),
}));
