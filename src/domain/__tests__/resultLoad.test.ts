import { describe, expect, it } from "vitest";
import { mintClipId, mintJobId } from "../mappers/ids";
import type { AnalysisResult } from "../models";
import {
  RESULT_POLL_CAP_MS,
  RESULT_SLOW_MS,
  completedResult,
  interpretResultLoad,
  jobPollDelayMs,
} from "../resultLoad";

function job(status: AnalysisResult["status"], extra: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    clipId: mintClipId("clip-1"),
    jobId: mintJobId("clip-1"),
    status,
    readiness: status === "completed" ? "usable" : null,
    score: null,
    engineLanded: null,
    calledTrick: status === "completed" ? "Kickflip" : null,
    reviewSummary: status === "completed" ? "Late pop." : null,
    uncertaintyNotes: [],
    processingNotes: [],
    primaryIssueLabel: null,
    bestCue: null,
    quality: { videoReadable: null, motionDetected: null },
    mechanics: [],
    videoPlaybackUrl: status === "completed" ? "https://cdn.example/clip.mp4" : null,
    thumbnailUrl: null,
    providerModel: null,
    failureReason: null,
    ...extra,
  };
}

describe("result load", () => {
  it("treats a missing cache as loading, not a contract error", () => {
    expect(completedResult(undefined)).toBeNull();
    expect(completedResult(job("processing"))).toBeNull();
    expect(completedResult(job("completed"))?.status).toBe("completed");

    const miss = interpretResultLoad({ clipId: "clip-1", poll: null, elapsedMs: 0 });
    expect(miss.phase).toBe("loading");
    expect(miss.keepPolling).toBe(true);
    expect(miss.errorKind).toBeNull();
  });

  it("stays on a slow job instead of failing, then times out honestly", () => {
    const slow = interpretResultLoad({
      clipId: "clip-1",
      poll: { ok: true, data: job("processing") },
      elapsedMs: RESULT_SLOW_MS,
    });
    expect(slow.phase).toBe("slow");
    expect(slow.keepPolling).toBe(true);

    const capped = interpretResultLoad({
      clipId: "clip-1",
      poll: { ok: true, data: job("processing") },
      elapsedMs: RESULT_POLL_CAP_MS,
    });
    expect(capped).toEqual({
      phase: "failed",
      analysis: null,
      errorKind: "analysis_failed",
      keepPolling: false,
    });
  });

  it("surfaces retryable poll failures and completed jobs", () => {
    const offline = interpretResultLoad({
      clipId: "clip-1",
      poll: { ok: false, errorKind: "offline" },
      elapsedMs: 1_000,
    });
    expect(offline.phase).toBe("failed");
    expect(offline.errorKind).toBe("offline");
    expect(offline.keepPolling).toBe(false);

    const ready = interpretResultLoad({
      clipId: "clip-1",
      poll: { ok: true, data: job("completed") },
      elapsedMs: 2_000,
    });
    expect(ready.phase).toBe("ready");
    expect(ready.analysis?.calledTrick).toBe("Kickflip");

    const failedJob = interpretResultLoad({
      clipId: "clip-1",
      poll: { ok: true, data: job("failed", { failureReason: "analysis_failed" }) },
      elapsedMs: 2_000,
    });
    expect(failedJob.errorKind).toBe("analysis_failed");
  });

  it("polls faster at first, then backs off", () => {
    expect(jobPollDelayMs(0)).toBe(2_000);
    expect(jobPollDelayMs(31_000)).toBe(5_000);
  });
});
