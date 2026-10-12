import { describe, expect, it } from "vitest";
import { mintClipId, mintJobId } from "../mappers/ids";
import type { AnalysisResult } from "../models";
import {
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

  it("never calls a server-running review failed merely because it is slow", () => {
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
      elapsedMs: 24 * 60 * 60_000,
    });
    expect(capped).toEqual({
      phase: "slow",
      analysis: null,
      errorKind: null,
      keepPolling: true,
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
    const gatewayFlake = interpretResultLoad({
      clipId: "clip-1",
      poll: { ok: false, errorKind: "server" },
      elapsedMs: 7 * 60_000,
    });
    expect(gatewayFlake.phase).toBe("slow");
    expect(gatewayFlake.keepPolling).toBe(true);

  });

  it("polls faster at first, then backs off", () => {
    expect(jobPollDelayMs(0)).toBe(2_000);
    expect(jobPollDelayMs(31_000)).toBe(5_000);
  });
});
