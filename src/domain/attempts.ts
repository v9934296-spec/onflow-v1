import type { Attempt } from "./models";

/**
 * Attempt arithmetic for the session screen. Attempts are numbered per trick
 * within a session — `KICKFLIP · ATTEMPT 07` is the seventh kickflip this
 * session, not the seventh clip. All inputs are already-validated domain
 * records; pending (unsynced) and confirmed (server) attempts are merged by id
 * so a queued attempt counts immediately and never double-counts once synced.
 */

export function mergeAttempts(confirmed: readonly Attempt[], pending: readonly Attempt[]): Attempt[] {
  const byId = new Map<string, Attempt>();
  for (const attempt of confirmed) byId.set(attempt.id, attempt);
  for (const attempt of pending) if (!byId.has(attempt.id)) byId.set(attempt.id, attempt);
  return [...byId.values()].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

export function attemptsForSession(attempts: readonly Attempt[], sessionId: string): Attempt[] {
  return attempts.filter((attempt) => attempt.sessionId === sessionId);
}

export function attemptsForTrick(attempts: readonly Attempt[], trickId: string): Attempt[] {
  return attempts.filter((attempt) => attempt.trickId === trickId);
}

/** The number the next attempt of this trick will carry. */
export function nextAttemptNumber(attempts: readonly Attempt[], trickId: string): number {
  return attemptsForTrick(attempts, trickId).length + 1;
}

/** 1-based position of an attempt among its trick's attempts, by log time. */
export function attemptNumberOf(attempts: readonly Attempt[], attempt: Attempt): number {
  const sameTrick = attemptsForTrick(attempts, attempt.trickId).sort((a, b) =>
    a.loggedAt.localeCompare(b.loggedAt),
  );
  const index = sameTrick.findIndex((row) => row.id === attempt.id);
  return index < 0 ? sameTrick.length + 1 : index + 1;
}

export interface TrickTally {
  readonly trickId: string;
  readonly canonicalName: string;
  readonly attempts: number;
  readonly landed: number;
  readonly lastLoggedAt: string;
}

/** Per-trick counts, most recently active trick first. Only what was recorded. */
export function trickTallies(attempts: readonly Attempt[]): TrickTally[] {
  const byTrick = new Map<string, TrickTally>();
  for (const attempt of attempts) {
    const current = byTrick.get(attempt.trickId);
    byTrick.set(attempt.trickId, {
      trickId: attempt.trickId,
      canonicalName: attempt.canonicalName,
      attempts: (current?.attempts ?? 0) + 1,
      landed: (current?.landed ?? 0) + (attempt.outcome === "landed" ? 1 : 0),
      lastLoggedAt:
        current && current.lastLoggedAt > attempt.loggedAt ? current.lastLoggedAt : attempt.loggedAt,
    });
  }
  return [...byTrick.values()].sort((a, b) => b.lastLoggedAt.localeCompare(a.lastLoggedAt));
}

export function elapsedSeconds(startedAtIso: string, nowMs: number = Date.now()): number {
  const started = Date.parse(startedAtIso);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((nowMs - started) / 1000));
}

/** `MM:SS` under an hour, `H:MM:SS` after. */
export function formatDuration(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Local wall-clock `HH:MM`, 24-hour. Deterministic; no locale lookup. */
export function formatTimeOfDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
