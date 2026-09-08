import { create } from "zustand";
import { fetchSkaterProfile, patchSkaterProfile } from "../api/endpoints";
import { toSkaterProfilePatch } from "../domain/mappers/skaterProfile";
import type { CatalogErrorKind } from "../domain/outbox";
import {
  completionErrors,
  emptyDraft,
  isFeatureAbsent,
  isOnboardingComplete,
  normalizeDraft,
  profileErrorKind,
  type OnboardingStep,
  type ProfileStatus,
  type SkaterProfile,
  type SkaterProfileDraft,
} from "../domain/skaterProfile";
import { kv, kvUserKeys } from "./kv";

/**
 * Skater profile — the last server-confirmed profile plus a locally persisted
 * onboarding draft. The draft is recovery state, never the source of truth:
 * only a server-returned `onboardingCompletedAt` lets the router treat
 * onboarding as done. Everything persisted is keyed by user so sign-out purges
 * exactly one account's data and another account can never read it.
 */
interface SkaterProfileSlice {
  userId: string | null;
  status: ProfileStatus;
  profile: SkaterProfile | null;
  /** True when `profile` came from MMKV during a failed or pending load. */
  fromCache: boolean;
  draft: SkaterProfileDraft;
  draftStep: OnboardingStep | null;
  error: CatalogErrorKind | null;
  saving: boolean;

  load: (userId: string) => Promise<void>;
  updateDraft: (patch: Partial<SkaterProfileDraft>) => void;
  setDraftStep: (step: OnboardingStep) => void;
  /** Sends the consolidated draft with `complete_onboarding`. Retains the draft on failure. */
  completeOnboarding: () => Promise<boolean>;
  /** Optimistic edit with rollback to the last server-confirmed profile. */
  saveProfile: (next: SkaterProfileDraft) => Promise<boolean>;
  clearError: () => void;
  purge: (userId: string) => void;
}

interface PersistedDraft {
  readonly schemaVersion: 1;
  readonly draft: SkaterProfileDraft;
  readonly step: OnboardingStep | null;
}

function readProfile(userId: string): SkaterProfile | null {
  const raw = kv.get(kvUserKeys.skaterProfile(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SkaterProfile;
  } catch {
    kv.delete(kvUserKeys.skaterProfile(userId));
    return null;
  }
}

function writeProfile(userId: string, profile: SkaterProfile): void {
  kv.set(kvUserKeys.skaterProfile(userId), JSON.stringify(profile));
}

function readDraft(userId: string): PersistedDraft | null {
  const raw = kv.get(kvUserKeys.onboardingDraft(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (parsed.schemaVersion !== 1) return null;
    return parsed;
  } catch {
    kv.delete(kvUserKeys.onboardingDraft(userId));
    return null;
  }
}

function writeDraft(userId: string, draft: SkaterProfileDraft, step: OnboardingStep | null): void {
  const record: PersistedDraft = { schemaVersion: 1, draft, step };
  kv.set(kvUserKeys.onboardingDraft(userId), JSON.stringify(record));
}

function clearDraft(userId: string): void {
  kv.delete(kvUserKeys.onboardingDraft(userId));
}

const initial = {
  userId: null,
  status: "unknown" as ProfileStatus,
  profile: null,
  fromCache: false,
  draft: emptyDraft(),
  draftStep: null,
  error: null,
  saving: false,
};

export const useSkaterProfileStore = create<SkaterProfileSlice>((set, get) => ({
  ...initial,

  load: async (userId) => {
    const cached = readProfile(userId);
    const persisted = readDraft(userId);
    set({
      userId,
      profile: cached,
      fromCache: cached != null,
      status: cached ? "loaded" : "loading",
      draft: persisted?.draft ?? emptyDraft(),
      draftStep: persisted?.step ?? null,
      error: null,
    });

    const res = await fetchSkaterProfile();
    if (get().userId !== userId) return;

    if (res.ok) {
      const profile = res.data;
      if (profile) writeProfile(userId, profile);
      if (isOnboardingComplete(profile)) clearDraft(userId);
      set({
        profile,
        fromCache: false,
        status: "loaded",
        error: null,
        ...(isOnboardingComplete(profile) ? { draft: emptyDraft(), draftStep: null } : {}),
      });
      return;
    }

    if (isFeatureAbsent(res.error.kind, res.error.status)) {
      set({ status: cached ? "loaded" : "unavailable", error: null });
      return;
    }
    // Unauthorized is handled by the client's handler (sign-out → purge).
    set({
      status: cached ? "loaded" : "unavailable",
      error: profileErrorKind(res.error.kind, res.error.status),
    });
  },

  updateDraft: (patch) => {
    const { userId, draft, draftStep } = get();
    const next = { ...draft, ...patch };
    set({ draft: next });
    if (userId) writeDraft(userId, next, draftStep);
  },

  setDraftStep: (step) => {
    const { userId, draft } = get();
    set({ draftStep: step });
    if (userId) writeDraft(userId, draft, step);
  },

  completeOnboarding: async () => {
    const { userId, draft } = get();
    if (!userId) return false;
    const normalized = normalizeDraft(draft);
    if (completionErrors(normalized).length > 0) {
      set({ error: "profile_invalid" });
      return false;
    }
    set({ saving: true, error: null });
    const res = await patchSkaterProfile(toSkaterProfilePatch(normalized, true));
    if (get().userId !== userId) return false;
    if (!res.ok) {
      set({ saving: false, error: profileErrorKind(res.error.kind, res.error.status) });
      return false;
    }
    if (!isOnboardingComplete(res.data)) {
      // Server accepted but did not mark completion: a contract mismatch, not success.
      set({ saving: false, error: "contract_error" });
      return false;
    }
    writeProfile(userId, res.data);
    clearDraft(userId);
    set({
      saving: false,
      profile: res.data,
      fromCache: false,
      status: "loaded",
      draft: emptyDraft(),
      draftStep: null,
      error: null,
    });
    return true;
  },

  saveProfile: async (next) => {
    const { userId, profile: previous } = get();
    if (!userId) return false;
    const normalized = normalizeDraft(next);
    if (isOnboardingComplete(previous) && completionErrors(normalized).length > 0) {
      set({ error: "profile_invalid" });
      return false;
    }
    // Optimistic only because `previous` is server-confirmed and restorable.
    set({
      saving: true,
      error: null,
      profile: { ...normalized, onboardingCompletedAt: previous?.onboardingCompletedAt ?? null },
    });
    const res = await patchSkaterProfile(toSkaterProfilePatch(normalized, false));
    if (get().userId !== userId) return false;
    if (!res.ok) {
      set({
        saving: false,
        profile: previous,
        error: profileErrorKind(res.error.kind, res.error.status),
      });
      return false;
    }
    writeProfile(userId, res.data);
    set({ saving: false, profile: res.data, fromCache: false, error: null });
    return true;
  },

  clearError: () => set({ error: null }),

  purge: (userId) => {
    kv.delete(kvUserKeys.skaterProfile(userId));
    kv.delete(kvUserKeys.onboardingDraft(userId));
    if (get().userId === userId) set({ ...initial, draft: emptyDraft() });
  },
}));
