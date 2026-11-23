import { beforeEach, describe, expect, it, vi } from "vitest";
import { fail, ok } from "../../api/types";
import { mintLocalId, mintSessionId, mintUserId } from "../../domain/mappers/ids";
import type { OutboxRow } from "../../domain/models";
import { upsertOutbox } from "../outbox";

const api = vi.hoisted(() => ({
  initiateUpload: vi.fn(),
  completeUpload: vi.fn(),
  fetchClipJob: vi.fn(),
}));

vi.mock("../../api/endpoints", () => api);
vi.mock("expo-file-system", () => ({
  uploadAsync: vi.fn().mockResolvedValue({ status: 200 }),
  FileSystemUploadType: { BINARY_CONTENT: "binary" },
}));

import { getOutbox } from "../outbox";
import { runOutboxRow } from "../upload";

function row(id: string, capturedAt?: string): OutboxRow {
  return {
    schemaVersion: 1,
    localId: mintLocalId(id),
    ownerUserId: mintUserId("user-1"),
    clipId: null,
    sessionId: mintSessionId("session-1"),
    state: "pending",
    mediaKind: "recorded",
    localUri: "file://attempt.mp4",
    mimeType: "video/mp4",
    durationSeconds: 8,
    sizeBytes: 100,
    ...(capturedAt ? { capturedAt } : {}),
    bytesUploaded: null,
    attemptCount: 0,
    nextRetryAt: null,
    errorKind: null,
  } as OutboxRow;
}

const completedJob = {
  clipId: "clip-1",
  jobId: "clip-1",
  status: "completed" as const,
  readiness: "usable" as const,
  score: null,
  engineLanded: null,
  calledTrick: null,
  reviewSummary: null,
  uncertaintyNotes: [],
  processingNotes: [],
  primaryIssueLabel: null,
  bestCue: null,
  quality: { videoReadable: null, motionDetected: null },
  mechanics: [],
  videoPlaybackUrl: null,
  thumbnailUrl: null,
  providerModel: null,
  failureReason: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  api.initiateUpload.mockResolvedValue(ok({
    clip_id: "clip-1",
    upload_url: "local://upload",
    upload_expires_at: "2026-09-02T10:00:00Z",
    storage_key: "clips/clip-1",
  }));
  api.completeUpload.mockResolvedValue(ok(null));
  api.fetchClipJob.mockResolvedValue(ok(completedJob));
});

describe("capture-to-result pipeline", () => {
  it("moves a reviewed clip through upload, analysis, and a ready result", async () => {
    const draft = row("online-flow", "2026-09-01T10:00:00Z");
    await upsertOutbox(draft);

    await runOutboxRow(draft.localId);
    expect(await getOutbox(draft.localId)).toMatchObject({ state: "analyzing", clipId: "clip-1" });
    await runOutboxRow(draft.localId);

    expect(await getOutbox(draft.localId)).toMatchObject({ state: "ready", capturedAt: draft.capturedAt });
    expect(api.initiateUpload).toHaveBeenCalledWith(expect.objectContaining({ capturedAt: draft.capturedAt }));
  });

  it("keeps an offline capture for retry, then completes after a flaky connection recovers", async () => {
    const draft = row("flaky-flow", "2026-09-01T10:00:00Z");
    api.initiateUpload.mockResolvedValueOnce(fail({ kind: "offline" }));
    await upsertOutbox(draft);

    await runOutboxRow(draft.localId);
    expect(await getOutbox(draft.localId)).toMatchObject({ state: "failed_retryable", attemptCount: 1 });

    await runOutboxRow(draft.localId);
    expect(await getOutbox(draft.localId)).toMatchObject({ state: "analyzing", clipId: "clip-1" });
  });

  it("reconciles a 409 completion conflict by polling the existing analysis", async () => {
    const draft = row("conflict-flow", "2026-09-01T10:00:00Z");
    api.completeUpload.mockResolvedValueOnce(fail({ kind: "client", status: 409 }));
    await upsertOutbox(draft);

    await runOutboxRow(draft.localId);
    expect(await getOutbox(draft.localId)).toMatchObject({ state: "analyzing", errorKind: null });
    await runOutboxRow(draft.localId);

    expect(await getOutbox(draft.localId)).toMatchObject({ state: "ready" });
  });

  it("keeps legacy rows without captured_at eligible for the server reconciliation window", async () => {
    const legacy = row("legacy-flow");
    await upsertOutbox(legacy);

    await runOutboxRow(legacy.localId);

    expect(api.initiateUpload).toHaveBeenCalledWith(expect.objectContaining({ capturedAt: undefined }));
    expect(await getOutbox(legacy.localId)).toMatchObject({ state: "analyzing" });
  });
});
