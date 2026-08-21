import { describe, expect, it } from "vitest";
import { analyzingPhase, classifyHttpFailure, progressFraction } from "../outbox";
import { mintLocalId, mintUserId } from "../mappers/ids";
import type { OutboxRow } from "../models";

function row(partial: Partial<OutboxRow>): OutboxRow {
  return {
    schemaVersion: 1,
    localId: mintLocalId("local-1"),
    ownerUserId: mintUserId("user-1"),
    clipId: null,
    sessionId: null,
    state: "pending",
    mediaKind: "recorded",
    localUri: "file://clip.mp4",
    mimeType: "video/mp4",
    durationSeconds: 8,
    sizeBytes: 1000,
    capturedAt: "2026-08-01T12:00:00Z",
    bytesUploaded: null,
    attemptCount: 0,
    nextRetryAt: null,
    errorKind: null,
    ...partial,
  };
}

describe("outbox rules", () => {
  it("computes determinate progress only from observed bytes", () => {
    expect(progressFraction(row({ state: "analyzing" }))).toBeNull();
    expect(progressFraction(row({ state: "uploading", bytesUploaded: 250 }))).toBe(0.25);
  });

  it("treats auth and validation failures as permanent", () => {
    expect(classifyHttpFailure(401)).toBe("failed_permanent");
    expect(classifyHttpFailure(403)).toBe("failed_permanent");
    expect(classifyHttpFailure(422)).toBe("failed_permanent");
    expect(classifyHttpFailure(429)).toBe("failed_retryable");
    expect(classifyHttpFailure(503)).toBe("failed_retryable");
  });

  it("names analyzing phases from real state, never a percentage", () => {
    expect(analyzingPhase("uploading", null)).toBe("UPLOADING");
    expect(analyzingPhase("analyzing", "pending")).toBe("QUEUED");
    expect(analyzingPhase("analyzing", "processing")).toBe("REVIEWING CLIP");
  });
});
