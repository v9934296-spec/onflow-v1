import { beforeEach, describe, expect, it } from "vitest";
import { useSkaterProfileStore } from "../skaterProfileStore";
import { kv, kvUserKeys } from "../kv";

/**
 * No EXPO_PUBLIC_API_URL in tests, so every request fails with
 * `configuration` before touching the network. That is exactly the offline
 * shape these rules have to survive.
 */
const store = () => useSkaterProfileStore.getState();

beforeEach(() => {
  store().purge("u1");
  store().purge("u2");
});

describe("skater profile store", () => {
  it("persists the draft per user and restores the step", async () => {
    await store().load("u1");
    store().updateDraft({ naturalStance: "goofy", skateStyles: ["park"], primarySkateStyle: "park" });
    store().setDraftStep("styles");
    expect(kv.get(kvUserKeys.onboardingDraft("u1"))).toContain("goofy");

    await store().load("u1");
    expect(store().draft.naturalStance).toBe("goofy");
    expect(store().draftStep).toBe("styles");
  });

  it("never lets one account read another account's draft", async () => {
    await store().load("u1");
    store().updateDraft({ city: "Milpitas" });
    await store().load("u2");
    expect(store().draft.city).toBeNull();
    expect(store().draftStep).toBeNull();
  });

  it("purges exactly the named account", async () => {
    await store().load("u1");
    store().updateDraft({ city: "A" });
    await store().load("u2");
    store().updateDraft({ city: "B" });
    store().purge("u1");
    expect(kv.get(kvUserKeys.onboardingDraft("u1"))).toBeNull();
    expect(kv.get(kvUserKeys.onboardingDraft("u2"))).not.toBeNull();
    // u2 is the active account and stays loaded.
    expect(store().draft.city).toBe("B");
  });

  it("blocks completion client-side when a required answer is missing and keeps the draft", async () => {
    await store().load("u1");
    store().updateDraft({ naturalStance: "regular" });
    expect(await store().completeOnboarding()).toBe(false);
    expect(store().error).toBe("profile_invalid");
    expect(store().draft.naturalStance).toBe("regular");
  });

  it("keeps every answer and reports a retryable error when the save fails", async () => {
    await store().load("u1");
    store().updateDraft({
      naturalStance: "regular",
      skateStyles: ["street"],
      primarySkateStyle: "street",
      experienceLevel: "beginner",
      favoriteBrands: ["Baker"],
    });
    expect(await store().completeOnboarding()).toBe(false);
    expect(store().error).toBe("profile_save_failed");
    expect(store().saving).toBe(false);
    expect(store().draft.favoriteBrands).toEqual(["Baker"]);
    expect(store().profile).toBeNull();
    expect(kv.get(kvUserKeys.onboardingDraft("u1"))).toContain("Baker");
  });

  it("does not treat an unreachable endpoint as a reason to block the skater", async () => {
    await store().load("u1");
    expect(store().status).toBe("unavailable");
    expect(store().profile).toBeNull();
  });
});
