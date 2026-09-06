import type {
  AgeRange,
  ExperienceLevel,
  NaturalStance,
  SkateStyle,
  SkaterProfile,
  SkaterProfileDraft,
} from "../skaterProfile";

/** Validated wire shape. Constructed only after runtime schema checks in api/. */
export interface SkaterProfileWire {
  natural_stance?: NaturalStance | null;
  skate_styles?: SkateStyle[];
  primary_skate_style?: SkateStyle | null;
  experience_level?: ExperienceLevel | null;
  age_range?: AgeRange | null;
  city?: string | null;
  home_park?: string | null;
  favorite_brands?: string[];
  onboarding_completed_at?: string | null;
}

export interface SkaterProfilePatchWire {
  natural_stance: NaturalStance | null;
  skate_styles: SkateStyle[];
  primary_skate_style: SkateStyle | null;
  experience_level: ExperienceLevel | null;
  age_range: AgeRange | null;
  city: string | null;
  home_park: string | null;
  favorite_brands: string[];
  complete_onboarding?: true;
}

export function mapSkaterProfile(wire: SkaterProfileWire): SkaterProfile {
  return {
    naturalStance: wire.natural_stance ?? null,
    skateStyles: wire.skate_styles ?? [],
    primarySkateStyle: wire.primary_skate_style ?? null,
    experienceLevel: wire.experience_level ?? null,
    ageRange: wire.age_range ?? null,
    city: wire.city ?? null,
    homePark: wire.home_park ?? null,
    favoriteBrands: wire.favorite_brands ?? [],
    onboardingCompletedAt: wire.onboarding_completed_at ?? null,
  };
}

/** The client never sends `onboarding_completed_at`; the server owns it. */
export function toSkaterProfilePatch(
  draft: SkaterProfileDraft,
  complete: boolean,
): SkaterProfilePatchWire {
  const body: SkaterProfilePatchWire = {
    natural_stance: draft.naturalStance,
    skate_styles: [...draft.skateStyles],
    primary_skate_style: draft.primarySkateStyle,
    experience_level: draft.experienceLevel,
    age_range: draft.ageRange,
    city: draft.city,
    home_park: draft.homePark,
    favorite_brands: [...draft.favoriteBrands],
  };
  if (complete) body.complete_onboarding = true;
  return body;
}
