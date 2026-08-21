import { mintAttemptId, mintSessionId, mintTrickId } from "./ids";
import type { Attempt, AttemptOutcome, CatalogTrick, SkateSession } from "../models";

export function mapAttempt(input: {
  id: string;
  session_id: string;
  trick_id: string;
  canonical_name: string;
  outcome: AttemptOutcome;
  logged_at: string;
}): Attempt {
  return {
    id: mintAttemptId(input.id),
    sessionId: mintSessionId(input.session_id),
    trickId: mintTrickId(input.trick_id),
    canonicalName: input.canonical_name,
    outcome: input.outcome,
    loggedAt: input.logged_at,
  };
}

export function mapSession(input: {
  id: string;
  started_at: string;
  ended_at?: string | null;
  spot_label?: string | null;
  focus_trick?: string | null;
}): SkateSession {
  return {
    id: mintSessionId(input.id),
    startedAt: input.started_at,
    endedAt: input.ended_at ?? null,
    spotLabel: input.spot_label ?? null,
    focusTrick: input.focus_trick ?? null,
  };
}

export function mapCatalogTrick(input: {
  id: string;
  name: string;
  category: string;
  aliases?: string[];
  difficulty_tier: number;
}): CatalogTrick {
  return {
    trickId: mintTrickId(input.id),
    name: input.name,
    category: input.category,
    aliases: input.aliases ?? [],
    difficultyTier: input.difficulty_tier,
  };
}
