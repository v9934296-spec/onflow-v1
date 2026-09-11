import { mayDeleteWorkingFile, type MediaKind } from "./media";

/**
 * Leave without destroying work.
 *
 * `allow` — back/cancel is safe.
 * `confirm` — the skater must opt in before anything is discarded.
 * `block` — stay put (in-progress capture, or a write already in flight).
 */
export type LeaveDecision = "allow" | "confirm" | "block";

export type CriticalScreen = "capture" | "review" | "analyzing" | "result";

export function leaveDecision(input: {
  readonly screen: CriticalScreen;
  readonly recording?: boolean;
  readonly busy?: boolean;
  readonly outcomeRecorded?: boolean;
  readonly mediaKind?: MediaKind;
}): LeaveDecision {
  if (input.screen === "capture") return input.recording ? "block" : "allow";
  if (input.screen === "analyzing") return "allow";
  if (input.screen === "result") {
    if (input.busy) return "block";
    return input.outcomeRecorded ? "allow" : "confirm";
  }
  if (input.busy) return "block";
  return input.mediaKind && mayDeleteWorkingFile(input.mediaKind) ? "confirm" : "allow";
}

/** Analyzing leave never cancels the outbox row. The job keeps running. */
export function analyzingLeaveCancelsJob(): false {
  return false;
}
