import { describe, expect, it } from "vitest";
import { skaterProfileResponseSchema, skaterProfileSchema } from "../runtime";

describe("skater profile runtime schema", () => {
  it("accepts null before a profile exists", () => {
    expect(skaterProfileResponseSchema.safeParse(null).success).toBe(true);
  });

  it("accepts a complete profile and tolerates unknown extra fields", () => {
    const parsed = skaterProfileSchema.safeParse({
      natural_stance: "regular",
      skate_styles: ["street", "park"],
      primary_skate_style: "street",
      experience_level: "beginner",
      age_range: "18_24",
      city: null,
      home_park: "Fremont",
      favorite_brands: [],
      onboarding_completed_at: "2026-09-05T10:00:00Z",
      future_field: "ignored",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unsupported enum instead of substituting a preference", () => {
    expect(skaterProfileSchema.safeParse({ natural_stance: "mongo" }).success).toBe(false);
    expect(skaterProfileSchema.safeParse({ skate_styles: ["street", "freestyle"] }).success).toBe(false);
    expect(skaterProfileSchema.safeParse({ experience_level: "pro" }).success).toBe(false);
    expect(skaterProfileSchema.safeParse({ age_range: "12" }).success).toBe(false);
  });
});
