import { create } from "zustand";
import type { SelectedTrick, SkateSession } from "../domain/models";
import { kv, kvKeys } from "./kv";

interface SessionSlice {
  hydrating: boolean;
  session: SkateSession | null;
  trick: SelectedTrick | null;
  pendingEnd: string | null;
  setHydrating: (value: boolean) => void;
  setSession: (session: SkateSession | null) => void;
  setTrick: (trick: SelectedTrick | null) => void;
  setPendingEnd: (endedAt: string | null) => void;
  hydrateFromKv: () => void;
}

export const useSessionStore = create<SessionSlice>((set) => ({
  hydrating: true,
  session: null,
  trick: null,
  pendingEnd: null,
  setHydrating: (hydrating) => set({ hydrating }),
  setSession: (session) => {
    if (session) kv.set(kvKeys.activeSessionId, session.id);
    else kv.delete(kvKeys.activeSessionId);
    set({ session });
  },
  setTrick: (trick) => {
    if (trick) kv.set(kvKeys.selectedTrick, JSON.stringify(trick));
    else kv.delete(kvKeys.selectedTrick);
    set({ trick });
  },
  setPendingEnd: (pendingEnd) => set({ pendingEnd }),
  hydrateFromKv: () => {
    const raw = kv.get(kvKeys.selectedTrick);
    let trick: SelectedTrick | null = null;
    if (raw) {
      try {
        trick = JSON.parse(raw) as SelectedTrick;
      } catch {
        kv.delete(kvKeys.selectedTrick);
      }
    }
    set({ trick, hydrating: false });
  },
}));
