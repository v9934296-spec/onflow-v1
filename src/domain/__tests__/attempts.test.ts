import { describe, expect, it } from "vitest";
import {
  attemptNumberOf,
  attemptsForSession,
  elapsedSeconds,
  formatDuration,
  formatTimeOfDay,
  mergeAttempts,
  nextAttemptNumber,
  trickTallies,
} from "../attempts";
import { mintAttemptId, mintSessionId, mintTrickId } from "../mappers/ids";
import type { Attempt } from "../models";

function attempt(id: string, trick: string, outcome: "landed" | "missed", at: string, session = "s1"): Attempt {
  return {
    id: mintAttemptId(id),
    sessionId: mintSessionId(session),
    trickId: mintTrickId(trick),
    canonicalName: trick.toUpperCase(),
    outcome,
    loggedAt: at,
  };
}

const kf1 = attempt("a1", "kickflip", "missed", "2026-09-05T10:00:00Z");
const kf2 = attempt("a2", "kickflip", "landed", "2026-09-05T10:01:00Z");
const tf1 = attempt("a3", "treflip", "missed", "2026-09-05T10:02:00Z");
const other = attempt("a4", "kickflip", "landed", "2026-09-05T10:03:00Z", "s2");

describe("attempt arithmetic", () => {
  it("merges pending and confirmed by id without double counting", () => {
    const merged = mergeAttempts([kf1, kf2], [kf2, tf1]);
    expect(merged.map((a) => a.id)).toEqual(["a1", "a2", "a3"]);
  });

  it("numbers attempts per trick within a session", () => {
    const session = attemptsForSession(mergeAttempts([kf1, kf2, tf1], [other]), "s1");
    expect(session).toHaveLength(3);
    expect(nextAttemptNumber(session, "kickflip")).toBe(3);
    expect(nextAttemptNumber(session, "treflip")).toBe(2);
    expect(nextAttemptNumber(session, "hardflip")).toBe(1);
    expect(attemptNumberOf(session, kf2)).toBe(2);
    expect(attemptNumberOf(session, tf1)).toBe(1);
  });

  it("tallies only what was recorded, most recent trick first", () => {
    expect(trickTallies([kf1, kf2, tf1])).toEqual([
      { trickId: "treflip", canonicalName: "TREFLIP", attempts: 1, landed: 0, lastLoggedAt: tf1.loggedAt },
      { trickId: "kickflip", canonicalName: "KICKFLIP", attempts: 2, landed: 1, lastLoggedAt: kf2.loggedAt },
    ]);
    expect(trickTallies([])).toEqual([]);
  });

  it("formats session time like a clock, never as a statistic", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(102)).toBe("01:42");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(-5)).toBe("00:00");
    const start = "2026-09-05T10:00:00Z";
    expect(elapsedSeconds(start, Date.parse(start) + 102_500)).toBe(102);
    expect(elapsedSeconds("nonsense", 0)).toBe(0);
  });

  it("formats wall-clock time deterministically", () => {
    expect(formatTimeOfDay("2026-09-05T10:07:00Z")).toMatch(/^\d{2}:\d{2}$/);
    expect(formatTimeOfDay("not a date")).toBe("--:--");
  });
});
