import { describe, expect, it } from "vitest";
import {
  AGE_STEP_ENABLED,
  completionErrors,
  dedupeBrands,
  emptyDraft,
  greetingContext,
  isFeatureAbsent,
  isOnboardingComplete,
  normalizeDraft,
  onboardingSteps,
  profileErrorKind,
  rankTricksForProfile,
  resolveEntryRoute,
  resumeStep,
  setPrimaryStyle,
  stepAfter,
  stepPosition,
  toggleStyle,
  type SkaterProfile,
  type SkaterProfileDraft,
} from "../skaterProfile";

const full: SkaterProfileDraft = {
  naturalStance: "goofy",
  skateStyles: ["street", "park"],
  primarySkateStyle: "park",
  experienceLevel: "intermediate",
  ageRange: null,
  city: "Milpitas",
  homePark: "Milpitas Skatepark",
  favoriteBrands: ["Baker"],
};

describe("skater profile rules", () => {
  it("normalizes optional text and brands the way the server will", () => {
    const draft = normalizeDraft({
      ...emptyDraft(),
      city: "  Milpitas  ",
      homePark: "   ",
      favoriteBrands: ["Baker", " baker ", "", "BAKER", "Thunder"],
    });
    expect(draft.city).toBe("Milpitas");
    expect(draft.homePark).toBeNull();
    expect(draft.favoriteBrands).toEqual(["Baker", "Thunder"]);
  });

  it("caps lengths and brand count", () => {
    const draft = normalizeDraft({
      ...emptyDraft(),
      city: "x".repeat(140),
      homePark: "y".repeat(200),
      favoriteBrands: Array.from({ length: 25 }, (_, i) => `Brand ${i}`),
    });
    expect(draft.city).toHaveLength(100);
    expect(draft.homePark).toHaveLength(150);
    expect(draft.favoriteBrands).toHaveLength(20);
    expect(dedupeBrands(["z".repeat(80)])[0]).toHaveLength(60);
  });

  it("keeps the primary inside the selected styles or promotes the first", () => {
    const draft = normalizeDraft({
      ...emptyDraft(),
      skateStyles: ["street", "street", "freestyle" as never, "park"],
      primarySkateStyle: "vert",
    });
    expect(draft.skateStyles).toEqual(["street", "park"]);
    expect(draft.primarySkateStyle).toBe("street");
  });

  it("makes the first pick primary and promotes the next when the primary is removed", () => {
    let draft = emptyDraft();
    draft = toggleStyle(draft, "park");
    expect(draft.primarySkateStyle).toBe("park");
    draft = toggleStyle(draft, "street");
    expect(draft.primarySkateStyle).toBe("park");
    draft = setPrimaryStyle(draft, "street");
    expect(draft.primarySkateStyle).toBe("street");
    draft = setPrimaryStyle(draft, "vert"); // not selected — ignored
    expect(draft.primarySkateStyle).toBe("street");
    draft = toggleStyle(draft, "street");
    expect(draft.skateStyles).toEqual(["park"]);
    expect(draft.primarySkateStyle).toBe("park");
    draft = toggleStyle(draft, "park");
    expect(draft.primarySkateStyle).toBeNull();
  });

  it("requires stance, styles, primary and level; age only while the step is enabled", () => {
    expect(completionErrors(emptyDraft())).toEqual([
      "naturalStance",
      "skateStyles",
      "primarySkateStyle",
      "experienceLevel",
    ]);
    expect(completionErrors(full)).toEqual([]);
    expect(completionErrors(full, { requireAgeRange: true })).toEqual(["ageRange"]);
    expect(AGE_STEP_ENABLED).toBe(false);
  });

  it("treats only a server timestamp as completion", () => {
    const profile: SkaterProfile = { ...full, onboardingCompletedAt: null };
    expect(isOnboardingComplete(null)).toBe(false);
    expect(isOnboardingComplete(profile)).toBe(false);
    expect(isOnboardingComplete({ ...profile, onboardingCompletedAt: "2026-09-05T00:00:00Z" })).toBe(true);
  });

  it("routes by phase, profile status and completion", () => {
    expect(resolveEntryRoute({ phase: "loading", profileStatus: "loaded", completed: true })).toBe("loading");
    expect(resolveEntryRoute({ phase: "signed_out", profileStatus: "loaded", completed: true })).toBe("sign-in");
    expect(resolveEntryRoute({ phase: "signed_in", profileStatus: "unknown", completed: false })).toBe("loading");
    expect(resolveEntryRoute({ phase: "signed_in", profileStatus: "loading", completed: false })).toBe("loading");
    expect(resolveEntryRoute({ phase: "signed_in", profileStatus: "unavailable", completed: false })).toBe("home");
    expect(resolveEntryRoute({ phase: "signed_in", profileStatus: "loaded", completed: false })).toBe("onboarding");
    expect(resolveEntryRoute({ phase: "signed_in", profileStatus: "loaded", completed: true })).toBe("home");
  });

  it("hides the age step while paused and numbers only the question steps", () => {
    const steps = onboardingSteps();
    expect(steps).toEqual(["greeting", "stance", "styles", "experience", "spots", "brands", "confirm"]);
    expect(onboardingSteps(true)).toContain("age");
    expect(stepPosition("stance", steps)).toEqual({ index: 1, total: 5 });
    expect(stepPosition("brands", steps)).toEqual({ index: 5, total: 5 });
    expect(stepPosition("greeting", steps)).toBeNull();
    expect(stepAfter("brands", steps)).toBe("confirm");
    expect(stepAfter("confirm", steps)).toBeNull();
  });

  it("resumes at a known step and restarts at greeting otherwise", () => {
    const steps = onboardingSteps();
    expect(resumeStep("spots", steps)).toBe("spots");
    expect(resumeStep("age", steps)).toBe("greeting");
    expect(resumeStep(null, steps)).toBe("greeting");
    expect(resumeStep("nonsense", steps)).toBe("greeting");
  });

  it("ranks by style without dropping a trick, and is the identity with an empty map", () => {
    const tricks = [
      { name: "Kickflip", category: "flip" },
      { name: "Rock to fakie", category: "transition" },
      { name: "Boardslide", category: "grind" },
    ];
    const profile = { skateStyles: ["park" as const, "street" as const], primarySkateStyle: "park" as const };
    const map = { transition: ["park" as const], grind: ["street" as const] };
    expect(rankTricksForProfile(tricks, profile, map).map((t) => t.name)).toEqual([
      "Rock to fakie",
      "Boardslide",
      "Kickflip",
    ]);
    expect(rankTricksForProfile(tricks, profile, {}).map((t) => t.name)).toEqual(tricks.map((t) => t.name));
    expect(rankTricksForProfile(tricks, null, map)).toHaveLength(3);
  });

  it("reads a 404 as feature-absent and maps failures onto catalog kinds", () => {
    expect(isFeatureAbsent("client", 404)).toBe(true);
    expect(isFeatureAbsent("client", 422)).toBe(false);
    expect(profileErrorKind("offline", undefined)).toBe("offline");
    expect(profileErrorKind("unauthorized", 401)).toBe("auth_expired");
    expect(profileErrorKind("client", 422)).toBe("profile_invalid");
    expect(profileErrorKind("server", 500)).toBe("profile_save_failed");
    expect(profileErrorKind("contract", undefined)).toBe("contract_error");
  });

  it("offers Home only what it may say", () => {
    expect(greetingContext(null)).toEqual({ style: null, spot: null });
    expect(greetingContext({ ...full, onboardingCompletedAt: "x" })).toEqual({
      style: "park",
      spot: "Milpitas Skatepark",
    });
    expect(greetingContext({ ...full, homePark: null, onboardingCompletedAt: "x" }).spot).toBe("Milpitas");
  });
});
