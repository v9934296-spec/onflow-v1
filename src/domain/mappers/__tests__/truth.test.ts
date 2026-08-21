import { describe, expect, it } from "vitest";
import { mapClipJob } from "../clipJob";
import { mapScore, scoreForDisplay } from "../score";
import { mapAttempt } from "../records";
import { unsafeBrand } from "../../types/brand";
import type { Score } from "../../models";

describe("truth rules", () => {
  it("never converts a missing score to zero", () => {
    expect(mapScore(null)).toBeNull();
    expect(mapScore(undefined)).toBeNull();
    const analysis = mapClipJob({
      job_id: "clip-1",
      status: "completed",
      result: {
        review_readiness: "usable",
        land_score: null,
        normalized_review: { score: null },
      },
    });
    expect(analysis.score).toBeNull();
  });

  it("omits the score entirely when readiness is insufficient", () => {
    expect(scoreForDisplay("insufficient", unsafeBrand<Score>(7))).toBeNull();
    const analysis = mapClipJob({
      job_id: "clip-1",
      status: "completed",
      result: {
        review_readiness: "insufficient",
        normalized_review: { score: 4 },
      },
    });
    expect(analysis.score).toBeNull();
    expect(analysis.readiness).toBe("insufficient");
  });

  it("shows a limited score only when the payload has one", () => {
    expect(scoreForDisplay("limited", unsafeBrand<Score>(6))).toBe(6);
    expect(scoreForDisplay("limited", null)).toBeNull();
  });

  it("rejects scores outside 0–10 instead of clamping them into a lie", () => {
    expect(mapScore(11)).toBeNull();
    expect(mapScore(-1)).toBeNull();
  });

  it("does not invent per-component evidence tags", () => {
    const analysis = mapClipJob({
      job_id: "clip-1",
      status: "completed",
      result: {
        review_readiness: "usable",
        quality_signals: {
          video_readable: true,
          motion_detected: true,
          mechanics_dimensions: [
            { name: "Pop", assessment: "late", evidence: "tail still down at peak" },
          ],
        },
      },
    });
    expect(analysis.mechanics[0]).toMatchObject({
      name: "Pop",
      assessment: "late",
      evidence: "tail still down at peak",
    });
    expect(analysis.mechanics[0] && "tag" in analysis.mechanics[0]).toBe(false);
  });

  it("omits mechanics when the video is unreadable or has no motion", () => {
    const unread = mapClipJob({
      job_id: "clip-1",
      status: "completed",
      result: {
        review_readiness: "insufficient",
        quality_signals: {
          video_readable: false,
          motion_detected: true,
          mechanics_dimensions: [{ name: "Pop", assessment: "guess" }],
        },
      },
    });
    expect(unread.mechanics).toEqual([]);
  });

  it("does not treat engine unclear as a skater outcome", () => {
    const analysis = mapClipJob({
      job_id: "clip-1",
      status: "completed",
      result: { review_readiness: "usable", landed: "unclear" },
    });
    expect(analysis.engineLanded).toBe("unclear");
    const attempt = mapAttempt({
      id: "a1",
      session_id: "s1",
      trick_id: "kickflip",
      canonical_name: "Kickflip",
      outcome: "landed",
      logged_at: "2026-08-01T12:00:00Z",
    });
    expect(attempt.outcome).toBe("landed");
  });

  it("maps job_id onto both clip and job identity", () => {
    const analysis = mapClipJob({ job_id: "abc", status: "pending" });
    expect(analysis.clipId).toBe("abc");
    expect(analysis.jobId).toBe("abc");
  });
});
