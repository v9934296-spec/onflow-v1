import { create } from "zustand";
import { loadSession, clearSession, saveSession } from "./secureSession";
import { setTokenProvider, setUnauthorizedHandler } from "../api/client";
import { fetchMe, signInWithApple } from "../api/endpoints";

interface AuthSlice {
  phase: "loading" | "signed_out" | "signed_in";
  userId: string | null;
  hydrate: () => Promise<void>;
  completeApple: (idToken: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthSlice>((set, get) => ({
  phase: "loading",
  userId: null,
  hydrate: async () => {
    setTokenProvider(async () => (await loadSession())?.token ?? null);
    setUnauthorizedHandler(() => {
      void get().signOut();
    });
    const session = await loadSession();
    if (!session) {
      set({ phase: "signed_out", userId: null });
      return;
    }
    const me = await fetchMe();
    if (!me.ok) {
      set({ phase: "signed_out", userId: null });
      return;
    }
    set({ phase: "signed_in", userId: me.data.user_id });
    const { restoreActiveSession } = await import("./sessionActions");
    await restoreActiveSession();
  },
  completeApple: async (idToken) => {
    const res = await signInWithApple(idToken);
    if (!res.ok) return false;
    await saveSession(res.data.token, res.data.user_id);
    set({ phase: "signed_in", userId: res.data.user_id });
    return true;
  },
  signOut: async () => {
    await clearSession();
    set({ phase: "signed_out", userId: null });
  },
}));
