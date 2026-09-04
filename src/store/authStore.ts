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
      if (me.error.kind === "unauthorized") {
        await clearSession();
        set({ phase: "signed_out", userId: null });
        return;
      }
      set({ phase: "signed_in", userId: session.userId });
      const { restoreActiveSession } = await import("./sessionActions");
      await restoreActiveSession();
      const { configureBilling } = await import("./billing");
      await configureBilling(session.userId);
      return;
    }
    set({ phase: "signed_in", userId: me.data.user_id });
    const { restoreActiveSession } = await import("./sessionActions");
    await restoreActiveSession();
    const { configureBilling } = await import("./billing");
    await configureBilling(me.data.user_id);
  },
  completeApple: async (idToken) => {
    const res = await signInWithApple(idToken);
    if (!res.ok) return false;
    await saveSession(res.data.token, res.data.user_id);
    set({ phase: "signed_in", userId: res.data.user_id });
    const { configureBilling } = await import("./billing");
    await configureBilling(res.data.user_id);
    return true;
  },
  signOut: async () => {
    await clearSession();
    set({ phase: "signed_out", userId: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require("react-native-purchases").default as { logOut?: () => Promise<unknown> };
      await Purchases.logOut?.();
    } catch {
      /* native module absent in tests */
    }
  },
}));
