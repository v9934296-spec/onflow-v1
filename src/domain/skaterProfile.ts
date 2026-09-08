/**
 * Skater personalization — domain rules.
 *
 * The server owns one profile per user. Everything here is pure: enum
 * vocabularies, draft normalization, completion rules, onboarding step order,
 * the entry-routing decision, and the narrow ways a profile is allowed to
 * shape the product. No words live here; `ui/copy/personalization.ts` owns
 * labels.
 */

export const NATURAL_STANCES = ["regular", "goofy"] as const;
export const SKATE_STYLES = ["street", "park", "vert"] as const;
export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
/** Full server vocabulary. The client picker is paused (see AGE_STEP_ENABLED). */
export const AGE_RANGES = ["under_13", "13_17", "18_24", "25_34", "35_44", "45_plus"] as const;

export type NaturalStance = (typeof NATURAL_STANCES)[number];
export type SkateStyle = (typeof SKATE_STYLES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type AgeRange = (typeof AGE_RANGES)[number];

export interface SkaterProfile {
  /** The skater's natural stance. Not a trick modifier — see `stanceExplainer`. */
  readonly naturalStance: NaturalStance | null;
  readonly skateStyles: readonly SkateStyle[];
  readonly primarySkateStyle: SkateStyle | null;
  readonly experienceLevel: ExperienceLevel | null;
  readonly ageRange: AgeRange | null;
  readonly city: string | null;
  readonly homePark: string | null;
  readonly favoriteBrands: readonly string[];
  /** Server-generated. Only this marks onboarding complete. */
  readonly onboardingCompletedAt: string | null;
}

export type SkaterProfileDraft = Omit<SkaterProfile, "onboardingCompletedAt">;

export const PROFILE_LIMITS = {
  city: 100,
  homePark: 150,
  brand: 60,
  brands: 20,
  styles: 3,
} as const;

/**
 * Owner decision 2026-09-05: the age-range step is paused until product/legal
 * decide how `under_13` is handled. While paused, `ageRange` is not required
 * for client-side completion and the step is not shown. The backend must
 * agree before it ships; see docs/personalization-001-client.md.
 */
export const AGE_STEP_ENABLED = false;

export function emptyDraft(): SkaterProfileDraft {
  return {
    naturalStance: null,
    skateStyles: [],
    primarySkateStyle: null,
    experienceLevel: null,
    ageRange: null,
    city: null,
    homePark: null,
    favoriteBrands: [],
  };
}

export function draftFromProfile(profile: SkaterProfile | null): SkaterProfileDraft {
  if (!profile) return emptyDraft();
  return {
    naturalStance: profile.naturalStance,
    skateStyles: profile.skateStyles,
    primarySkateStyle: profile.primarySkateStyle,
    experienceLevel: profile.experienceLevel,
    ageRange: profile.ageRange,
    city: profile.city,
    homePark: profile.homePark,
    favoriteBrands: profile.favoriteBrands,
  };
}

function cleanText(raw: string | null | undefined, max: number): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** Trim, drop empties, cap length, dedupe case-insensitively keeping the first spelling. */
export function dedupeBrands(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    const cleaned = cleanText(entry, PROFILE_LIMITS.brand);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= PROFILE_LIMITS.brands) break;
  }
  return out;
}

function uniqueStyles(raw: readonly string[]): SkateStyle[] {
  const out: SkateStyle[] = [];
  for (const entry of raw) {
    if (!isSkateStyle(entry) || out.includes(entry)) continue;
    out.push(entry);
  }
  return out.slice(0, PROFILE_LIMITS.styles);
}

export function isSkateStyle(raw: string): raw is SkateStyle {
  return (SKATE_STYLES as readonly string[]).includes(raw);
}

/** Applies every client-side rule the server also enforces, so a rejected PATCH is a contract bug, not a UI gap. */
export function normalizeDraft(draft: SkaterProfileDraft): SkaterProfileDraft {
  const skateStyles = uniqueStyles(draft.skateStyles);
  const primarySkateStyle =
    draft.primarySkateStyle && skateStyles.includes(draft.primarySkateStyle)
      ? draft.primarySkateStyle
      : (skateStyles[0] ?? null);
  return {
    naturalStance: draft.naturalStance,
    skateStyles,
    primarySkateStyle,
    experienceLevel: draft.experienceLevel,
    ageRange: draft.ageRange,
    city: cleanText(draft.city, PROFILE_LIMITS.city),
    homePark: cleanText(draft.homePark, PROFILE_LIMITS.homePark),
    favoriteBrands: dedupeBrands(draft.favoriteBrands),
  };
}

export type RequiredProfileField =
  | "naturalStance"
  | "skateStyles"
  | "primarySkateStyle"
  | "experienceLevel"
  | "ageRange";

export function completionErrors(
  draft: SkaterProfileDraft,
  options: { requireAgeRange: boolean } = { requireAgeRange: AGE_STEP_ENABLED },
): RequiredProfileField[] {
  const missing: RequiredProfileField[] = [];
  if (!draft.naturalStance) missing.push("naturalStance");
  if (draft.skateStyles.length === 0) missing.push("skateStyles");
  if (!draft.primarySkateStyle || !draft.skateStyles.includes(draft.primarySkateStyle)) {
    missing.push("primarySkateStyle");
  }
  if (!draft.experienceLevel) missing.push("experienceLevel");
  if (options.requireAgeRange && !draft.ageRange) missing.push("ageRange");
  return missing;
}

/** Only a server-confirmed timestamp counts. Drafts never do. */
export function isOnboardingComplete(profile: SkaterProfile | null): boolean {
  return Boolean(profile?.onboardingCompletedAt);
}

/** The first selection becomes primary; removing the primary promotes the next. */
export function toggleStyle(draft: SkaterProfileDraft, style: SkateStyle): SkaterProfileDraft {
  const has = draft.skateStyles.includes(style);
  const skateStyles = has
    ? draft.skateStyles.filter((s) => s !== style)
    : [...draft.skateStyles, style].slice(0, PROFILE_LIMITS.styles);
  const primarySkateStyle =
    draft.primarySkateStyle && skateStyles.includes(draft.primarySkateStyle)
      ? draft.primarySkateStyle
      : (skateStyles[0] ?? null);
  return { ...draft, skateStyles, primarySkateStyle };
}

export function setPrimaryStyle(draft: SkaterProfileDraft, style: SkateStyle): SkaterProfileDraft {
  if (!draft.skateStyles.includes(style)) return draft;
  return { ...draft, primarySkateStyle: style };
}

// ---------------------------------------------------------------------------
// Onboarding steps

export const ONBOARDING_STEPS = [
  "greeting",
  "stance",
  "styles",
  "experience",
  "age",
  "spots",
  "brands",
  "confirm",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function onboardingSteps(ageStepEnabled: boolean = AGE_STEP_ENABLED): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((step) => step !== "age" || ageStepEnabled);
}

export function stepAfter(step: OnboardingStep, steps: readonly OnboardingStep[]): OnboardingStep | null {
  const index = steps.indexOf(step);
  return index >= 0 ? (steps[index + 1] ?? null) : null;
}

export function stepBefore(step: OnboardingStep, steps: readonly OnboardingStep[]): OnboardingStep | null {
  const index = steps.indexOf(step);
  return index > 0 ? (steps[index - 1] ?? null) : null;
}

/** 1-based position among the question steps (greeting and confirm excluded). */
export function stepPosition(
  step: OnboardingStep,
  steps: readonly OnboardingStep[],
): { index: number; total: number } | null {
  const questions: readonly OnboardingStep[] = steps.filter((s) => s !== "greeting" && s !== "confirm");
  const index = questions.indexOf(step);
  if (index < 0) return null;
  return { index: index + 1, total: questions.length };
}

/** Where an interrupted onboarding resumes. Unknown or stale steps restart at greeting. */
export function resumeStep(raw: string | null, steps: readonly OnboardingStep[]): OnboardingStep {
  return raw && (steps as readonly string[]).includes(raw) ? (raw as OnboardingStep) : "greeting";
}

// ---------------------------------------------------------------------------
// Entry routing

export type ProfileStatus = "unknown" | "loading" | "loaded" | "unavailable";

export type EntryRoute = "loading" | "sign-in" | "onboarding" | "home";

/**
 * The root router's decision. `unavailable` (endpoint not deployed, or
 * unreachable with no cache) never blocks a skater from Home; onboarding is
 * retried on the next successful load.
 */
export function resolveEntryRoute(input: {
  phase: "loading" | "signed_out" | "signed_in";
  profileStatus: ProfileStatus;
  completed: boolean;
}): EntryRoute {
  if (input.phase === "loading") return "loading";
  if (input.phase === "signed_out") return "sign-in";
  if (input.profileStatus === "unknown" || input.profileStatus === "loading") return "loading";
  if (input.profileStatus === "unavailable") return "home";
  return input.completed ? "home" : "onboarding";
}

/** Maps a transport failure onto catalog copy for profile saves and loads. */
export function profileErrorKind(
  apiKind: string,
  status: number | undefined,
): "offline" | "rate_limited" | "auth_expired" | "profile_invalid" | "profile_save_failed" | "contract_error" {
  if (apiKind === "offline" || apiKind === "cancelled") return "offline";
  if (apiKind === "rate_limited") return "rate_limited";
  if (apiKind === "unauthorized") return "auth_expired";
  if (apiKind === "contract") return "contract_error";
  if (status === 422 || status === 400) return "profile_invalid";
  return "profile_save_failed";
}

/** A 404 on GET means the endpoint is not deployed yet — a feature flag, not an error. */
export function isFeatureAbsent(apiKind: string, status: number | undefined): boolean {
  return apiKind === "client" && status === 404;
}

// ---------------------------------------------------------------------------
// Product use of the profile

/**
 * Catalog category → styles. Populated once the live `GET /tricks` category
 * vocabulary is confirmed; until then ranking is the identity and no trick is
 * ever hidden by preference.
 */
export const CATEGORY_STYLE_MAP: Readonly<Record<string, readonly SkateStyle[]>> = {};

/** Stable partition: primary-style tricks, then other selected styles, then the rest. Never removes a trick. */
export function rankTricksForProfile<T extends { readonly category: string }>(
  tricks: readonly T[],
  profile: Pick<SkaterProfile, "skateStyles" | "primarySkateStyle"> | null,
  categoryStyles: Readonly<Record<string, readonly SkateStyle[]>> = CATEGORY_STYLE_MAP,
): T[] {
  if (!profile || profile.skateStyles.length === 0) return [...tricks];
  const rank = (trick: T): number => {
    const styles = categoryStyles[trick.category] ?? [];
    if (profile.primarySkateStyle && styles.includes(profile.primarySkateStyle)) return 0;
    if (styles.some((s) => profile.skateStyles.includes(s))) return 1;
    return 2;
  };
  return tricks
    .map((trick, index) => ({ trick, index, rank: rank(trick) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((row) => row.trick);
}

/** What Home may say. Spot is private contextual copy only; never sent anywhere. */
export function greetingContext(profile: SkaterProfile | null): {
  style: SkateStyle | null;
  spot: string | null;
} {
  return {
    style: profile?.primarySkateStyle ?? null,
    spot: profile?.homePark ?? profile?.city ?? null,
  };
}
