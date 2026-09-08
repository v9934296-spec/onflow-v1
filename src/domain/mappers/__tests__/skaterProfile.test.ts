import { describe, expect, it } from "vitest";
import { mapSkaterProfile, toSkaterProfilePatch } from "../skaterProfile";
import { emptyDraft } from "../../skaterProfile";

describe("skater profile mapper", () => {
  it("maps wire fields and defaults absent ones to empty, never to a guess", () => {
    expect(mapSkaterProfile({})).toEqual({
      naturalStance: null,
      skateStyles: [],
      primarySkateStyle: null,
      experienceLevel: null,
      ageRange: null,
      city: null,
      homePark: null,
      favoriteBrands: [],
      onboardingCompletedAt: null,
    });
    expect(
      mapSkaterProfile({
        natural_stance: "goofy",
        skate_styles: ["vert"],
        primary_skate_style: "vert",
        experience_level: "advanced",
        age_range: "25_34",
        home_park: "Lake Cunningham",
        favorite_brands: ["Powell"],
        onboarding_completed_at: "2026-09-05T10:00:00Z",
      }),
    ).toMatchObject({
      naturalStance: "goofy",
      primarySkateStyle: "vert",
      ageRange: "25_34",
      homePark: "Lake Cunningham",
      onboardingCompletedAt: "2026-09-05T10:00:00Z",
    });
  });

  it("never sends the completion timestamp and adds the flag only when completing", () => {
    const draft = { ...emptyDraft(), naturalStance: "regular" as const };
    const partial = toSkaterProfilePatch(draft, false);
    expect(partial).not.toHaveProperty("complete_onboarding");
    expect(partial).not.toHaveProperty("onboarding_completed_at");
    expect(toSkaterProfilePatch(draft, true).complete_onboarding).toBe(true);
  });
});
