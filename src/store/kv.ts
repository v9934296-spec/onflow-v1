type MemoryKv = Map<string, string>;

const memory: MemoryKv = new Map();

let native:
  | { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; delete: (k: string) => void }
  | null
  | undefined;

function adapter() {
  if (native === undefined) {
    try {
      // Native only. Tests stay on the in-memory map.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MMKV } = require("react-native-mmkv") as {
        MMKV: new () => {
          getString: (k: string) => string | undefined;
          set: (k: string, v: string) => void;
          delete: (k: string) => void;
        };
      };
      native = new MMKV();
    } catch {
      native = null;
    }
  }
  return native;
}

export const kv = {
  get(key: string): string | null {
    const mmkv = adapter();
    if (mmkv) return mmkv.getString(key) ?? null;
    return memory.get(key) ?? null;
  },
  set(key: string, value: string): void {
    const mmkv = adapter();
    if (mmkv) {
      mmkv.set(key, value);
      return;
    }
    memory.set(key, value);
  },
  delete(key: string): void {
    const mmkv = adapter();
    if (mmkv) {
      mmkv.delete(key);
      return;
    }
    memory.delete(key);
  },
};

export const kvKeys = {
  activeSessionId: "onflow.activeSessionId",
  activeSession: "onflow.activeSession",
  selectedTrick: "onflow.selectedTrick",
  onboardingDone: "onflow.onboardingDone",
  outbox: "onflow.outbox.v1",
  trickCatalog: "onflow.trickCatalog",
  recentTrickIds: "onflow.recentTrickIds",
  /** A session the skater ended while the server was unreachable. */
  pendingSessionEnd: "onflow.pendingSessionEnd.v1",
} as const;

/**
 * Per-account keys. Sign-out purges the profile and draft; pending attempts
 * stay sealed to their owner like outbox rows and sync when that account
 * returns.
 */
export const kvUserKeys = {
  skaterProfile: (userId: string) => `onflow.skaterProfile.v1.${userId}`,
  onboardingDraft: (userId: string) => `onflow.onboardingDraft.v1.${userId}`,
  pendingAttempts: (userId: string) => `onflow.pendingAttempts.v1.${userId}`,
} as const;
