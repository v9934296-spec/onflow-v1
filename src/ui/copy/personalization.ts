import type {
  AgeRange,
  ExperienceLevel,
  NaturalStance,
  SkateStyle,
} from "../../domain/skaterProfile";

/** ui/ owns the words. Domain enums are keys, never labels. */

export const stanceCopy: Record<NaturalStance, { label: string; detail: string }> = {
  regular: { label: "Regular", detail: "Left foot forward" },
  goofy: { label: "Goofy", detail: "Right foot forward" },
};

export const styleCopy: Record<SkateStyle, { label: string; detail: string }> = {
  street: { label: "Street", detail: "Ledges, rails, stairs, flat" },
  park: { label: "Park", detail: "Bowls, quarters, hips, plazas" },
  vert: { label: "Vert", detail: "Halfpipe, big transition" },
};

export const experienceCopy: Record<ExperienceLevel, { label: string; detail: string }> = {
  beginner: { label: "Beginner", detail: "Ollies, shuvits, first flip tricks" },
  intermediate: { label: "Intermediate", detail: "Flip tricks on lock, working on new ones" },
  advanced: { label: "Advanced", detail: "Hard tricks, chasing consistency" },
};

/** Kept for display of a server-provided value; the picker is paused. */
export const ageRangeCopy: Record<AgeRange, string> = {
  under_13: "Under 13",
  "13_17": "13–17",
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_plus": "45+",
};

/**
 * Natural stance explains the trick modifier; it never preselects it. A goofy
 * skater's normal stance is still called Regular when calling a trick.
 */
export function stanceExplainer(natural: NaturalStance | null): string | null {
  if (!natural) return null;
  return `Regular here means your natural ${stanceCopy[natural].label.toLowerCase()} stance.`;
}

export const onboardingCopy = {
  greeting: {
    title: "WELCOME TO ONFLOW",
    body: "A few answers shape which tricks you see first and how coaching talks to you. About a minute. It stays private.",
    action: "Let's go",
  },
  stance: {
    title: "YOUR STANCE",
    body: "The way you naturally stand on the board. Calling a trick Regular later means this.",
  },
  styles: {
    title: "WHAT YOU SKATE",
    body: "Pick everything that applies. Your first pick is primary — change it any time.",
  },
  experience: {
    title: "WHERE YOU'RE AT",
    body: "Sets how coaching talks to you. Not a score, and you can change it.",
  },
  spots: {
    title: "YOUR SPOTS",
    body: "Optional. Only you see these.",
    city: "City",
    homePark: "Home park",
  },
  brands: {
    title: "BRANDS YOU RIDE",
    body: "Optional. Private in this version.",
    placeholder: "Add a brand",
    add: "Add",
  },
  confirm: {
    title: "YOU'RE SET",
    body: "Everything here can be changed under Profile.",
    action: "Start skating",
  },
  next: "Continue",
  back: "Back",
  skip: "Skip",
} as const;
