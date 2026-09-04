import type { AttemptOutcome } from "./models";

export function sessionDurationLabel(startedAt: string, nowMs = Date.now()): string | null {
  const started = Date.parse(startedAt);
  if (!Number.isFinite(started)) return null;
  const mins = Math.max(0, Math.round((nowMs - started) / 60_000));
  return `${mins} min session`;
}

/** Confirmation screen: three facts maximum (spec 7.8). */
export function confirmationFacts(input: {
  trick: string;
  outcome: AttemptOutcome;
  attemptNumber: number | null;
  durationLabel: string | null;
}): readonly string[] {
  const facts = [input.trick, input.outcome === "landed" ? "Landed" : "Missed"];
  if (input.attemptNumber != null && input.attemptNumber > 0) {
    facts.push(`Attempt ${input.attemptNumber}`);
  } else if (input.durationLabel) {
    facts.push(input.durationLabel);
  }
  return facts.slice(0, 3);
}
