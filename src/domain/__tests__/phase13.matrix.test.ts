import { describe, expect, it } from "vitest";
import { clipExceedsLaunchCeiling, compressionContract } from "../compression";
import {
  classifyHttpFailure,
  isCurrentOutboxSchema,
  outboxOwnedBy,
  resumeHref,
  toCatalogErrorKind,
} from "../outbox";
import { mapClipJob } from "../mappers/clipJob";
import { mapAttempt } from "../mappers/records";
import { mapScore, scoreForDisplay } from "../mappers/score";
import { groupScoredClipsByTrick, mapTimelineSession } from "../history";
import { confirmationFacts } from "../saveConfirmation";
import { unsafeBrand } from "../types/brand";
import type { Score } from "../models";

describe("phase 13 matrix — automatable rules", () => {
  it("rejects clips over 30s or 100MB before initiate", () => {
    expect(
      clipExceedsLaunchCeiling({
        durationSeconds: compressionContract.maxDurationSeconds + 1,
        sizeBytes: 1,
      }),
    ).toBe("clip_too_long");
    expect(
      clipExceedsLaunchCeiling({
        durationSeconds: 1,
        sizeBytes: compressionContract.maxBytes + 1,
      }),
    ).toBe("clip_too_large");
  });

  it("ignores an older outbox schema instead of coercing it", () => {
    expect(isCurrentOutboxSchema(1)).toBe(true);
    expect(isCurrentOutboxSchema(0)).toBe(false);
  });

  it("seals outbox rows to the owning account", () => {
    expect(outboxOwnedBy("owner", "owner")).toBe(true);
    expect(outboxOwnedBy("owner", "other")).toBe(false);
  });

  it("resumes by local id so a server orphan is not the skater's clip", () => {
    expect(resumeHref("local-9")).toBe("/analyzing?localId=local-9");
    expect(resumeHref("local-9")).not.toMatch(/clipId/);
  });

  it("omits scores outside 0–10 and treats null as absence", () => {
    expect(mapScore(11)).toBeNull();
    expect(mapScore(-1)).toBeNull();
    expect(mapScore(null)).toBeNull();
  });

  it("omits the score when readiness is insufficient", () => {
    expect(scoreForDisplay("insufficient", unsafeBrand<Score>(8))).toBeNull();
  });

  it("treats a completed job with no result as absence, not a fake score", () => {
    const analysis = mapClipJob({ job_id: "job-empty", status: "completed" });
    expect(analysis.score).toBeNull();
    expect(analysis.mechanics).toEqual([]);
    expect(analysis.readiness).toBeNull();
  });

  it("keeps the skater outcome distinct from an engine unclear read", () => {
    const analysis = mapClipJob({
      job_id: "job-1",
      status: "completed",
      result: { review_readiness: "usable", landed: "unclear" },
    });
    const attempt = mapAttempt({
      id: "a1",
      session_id: "s1",
      trick_id: "kickflip",
      canonical_name: "Kickflip",
      outcome: "landed",
      logged_at: "2026-09-04T12:00:00Z",
    });
    expect(analysis.engineLanded).toBe("unclear");
    expect(attempt.outcome).toBe("landed");
  });

  it("lists two providers as separate rows and never averages them", () => {
    const groups = groupScoredClipsByTrick([
      {
        key: "g",
        jobId: "g",
        localId: null,
        clipId: "g",
        sessionId: null,
        label: "Kickflip",
        state: "ready",
        updatedAt: "2026-09-02T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: unsafeBrand<Score>(8),
        providerModel: "gemini",
        unread: false,
      },
      {
        key: "p",
        jobId: "p",
        localId: null,
        clipId: "p",
        sessionId: null,
        label: "Kickflip",
        state: "ready",
        updatedAt: "2026-09-01T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: unsafeBrand<Score>(3),
        providerModel: "pegasus",
        unread: false,
      },
    ]);
    expect(groups[0]?.rows.map((row) => row.score)).toEqual([8, 3]);
    expect(groups[0] && "average" in groups[0]).toBe(false);
    expect(groups[0] && "best" in groups[0]).toBe(false);
  });

  it("drops best_pte_score from the session view", () => {
    const session = mapTimelineSession({
      session_id: "s1",
      ended_at: "2026-09-01T12:00:00Z",
      focus_trick: "Kickflip",
      clips_count: 1,
      attempt_count: 1,
      best_pte_score: 9.9,
    });
    expect(session).not.toHaveProperty("best");
    expect(JSON.stringify(session)).not.toContain("9.9");
  });

  it("maps 403 to a permanent failure and 429 to a retryable cap", () => {
    expect(classifyHttpFailure(403)).toBe("failed_permanent");
    expect(classifyHttpFailure(429)).toBe("failed_retryable");
    expect(toCatalogErrorKind("quota")).toBe("quota_exhausted");
    expect(toCatalogErrorKind("tier_gate")).toBe("tier_gate");
    expect(toCatalogErrorKind("rate_limited")).toBe("rate_limited");
  });

  it("caps save confirmation at three facts", () => {
    expect(
      confirmationFacts({
        trick: "Kickflip",
        outcome: "landed",
        attemptNumber: 2,
        durationLabel: "9 min session",
      }),
    ).toHaveLength(3);
  });

});
