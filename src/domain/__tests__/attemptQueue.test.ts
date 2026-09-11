import { describe, expect, it } from "vitest";
import {
  ATTEMPT_FLUSH_LIMIT,
  applyRejection,
  applyTransportFailure,
  dueRows,
  liveAttempts,
  queueRowFromAttempt,
  reviveDead,
  syncSummary,
} from "../attemptQueue";
import { mintAttemptId, mintSessionId, mintTrickId } from "../mappers/ids";
import type { Attempt } from "../models";

function attempt(id = "a1"): Attempt {
  return {
    id: mintAttemptId(id),
    sessionId: mintSessionId("s1"),
    trickId: mintTrickId("kickflip"),
    canonicalName: "Kickflip",
    outcome: "landed",
    loggedAt: "2026-09-05T10:00:00Z",
  };
}

describe("attempt sync queue", () => {
  it("uses the attempt id as the idempotency key", () => {
    const row = queueRowFromAttempt(attempt("local-1"));
    expect(row.idempotencyKey).toBe(row.attempt.id);
    expect(row.state).toBe("queued");
  });

  it("holds a row until backoff elapses", () => {
    const waiting = {
      ...queueRowFromAttempt(attempt()),
      nextRetryAt: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(dueRows([waiting], Date.now())).toEqual([]);
    expect(dueRows([waiting], Date.now() + 61_000)).toHaveLength(1);
  });

  it("dedupes the same idempotency key in one flush", () => {
    const row = queueRowFromAttempt(attempt("dup"));
    expect(dueRows([row, row], Date.now())).toHaveLength(1);
  });

  it("moves a row to the dead letter after the flush ceiling", () => {
    let row = queueRowFromAttempt(attempt());
    for (let i = 0; i < ATTEMPT_FLUSH_LIMIT; i += 1) {
      row = applyTransportFailure(row, "offline", Date.now());
    }
    expect(row.state).toBe("dead");
    expect(liveAttempts([row])).toEqual([]);
    expect(syncSummary([row]).dead).toBe(1);
  });

  it("treats immutable server rejections as dead, not silent drops", () => {
    const dead = applyRejection(queueRowFromAttempt(attempt()), "outcome_immutable");
    expect(dead.state).toBe("dead");
    expect(dead.lastErrorKind).toBe("attempt_conflict");
  });

  it("keeps a duplicate-in-batch rejection retryable", () => {
    const row = applyRejection(queueRowFromAttempt(attempt()), "duplicate_in_batch");
    expect(row.state).toBe("queued");
    expect(row.nextRetryAt).not.toBeNull();
  });

  it("revives a dead letter as a fresh queued row", () => {
    const revived = reviveDead(applyRejection(queueRowFromAttempt(attempt()), "forbidden"));
    expect(revived.state).toBe("queued");
    expect(revived.flushCount).toBe(0);
  });
});
