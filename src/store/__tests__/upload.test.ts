import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OutboxRow } from "../../domain/models";
import { mintClipId, mintLocalId, mintTrickId, mintUserId } from "../../domain/mappers/ids";

const rows = new Map<string, OutboxRow>();

vi.mock("expo-file-system", () => ({
  uploadAsync: vi.fn(async () => ({ status: 200 })),
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));

vi.mock("../outbox", () => ({
  getOutbox: vi.fn(async (id: string) => rows.get(id) ?? null),
  upsertOutbox: vi.fn(async (row: OutboxRow) => {
    rows.set(row.localId, row);
  }),
  listRecoverable: vi.fn(async () => [...rows.values()]),
}));

const api = vi.hoisted(() => ({
  initiateUpload: vi.fn(),
  completeUpload: vi.fn(),
  fetchClipJob: vi.fn(),
  refreshUpload: vi.fn(),
  reportUploadPutFailure: vi.fn(async () => {}),
}));
vi.mock("../../api/endpoints", () => api);

import { retryOutboxRow, runOutboxRow, setOutboxOutcome } from "../upload";

function row(partial: Partial<OutboxRow>): OutboxRow {
  return {
    schemaVersion: 1,
    localId: mintLocalId("local-1"),
    ownerUserId: mintUserId("user-1"),
    clipId: null,
    sessionId: null,
    state: "pending",
    mediaKind: "recorded",
    localUri: "file:///clip.mov",
    mimeType: "video/quicktime",
    durationSeconds: 6,
    sizeBytes: 4_000,
    capturedAt: "2026-10-06T12:00:00Z",
    bytesUploaded: null,
    attemptCount: 0,
    nextRetryAt: null,
    errorKind: null,
    trick: {
      trickId: mintTrickId("kickflip"),
      canonicalName: "Kickflip",
      stance: "Switch",
      direction: null,
    },
    ...partial,
  };
}

const initiated = (clipId: string) => ({
  ok: true as const,
  data: {
    clip_id: clipId,
    upload_url: "https://r2.example/put",
    upload_method: "PUT",
    upload_expires_at: "2026-10-06T13:00:00Z",
    storage_key: `clips/user-1/${clipId}.mov`,
  },
});

beforeEach(() => {
  rows.clear();
  vi.clearAllMocks();
});

describe("upload pipeline (v1 → services/api contract)", () => {
  it("sends the clip's own trick and stance in the backend's wire shape", async () => {
    api.initiateUpload.mockResolvedValue(initiated("clip-a"));
    api.completeUpload.mockResolvedValue({ ok: true, data: {} });
    rows.set("local-1", row({}));

    const done = await runOutboxRow("local-1");

    expect(api.initiateUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        clientHintTrickId: "kickflip",
        stance: "switch",
        contentType: "video/quicktime",
        sizeBytes: 4_000,
      }),
    );
    expect(api.completeUpload).toHaveBeenCalledWith("clip-a");
    expect(done?.state).toBe("analyzing");
    expect(done?.clipId).toBe("clip-a");
  });

  it("omits trick and stance for rows written before the snapshot existed", async () => {
    api.initiateUpload.mockResolvedValue(initiated("clip-b"));
    api.completeUpload.mockResolvedValue({ ok: true, data: {} });
    rows.set("local-1", row({ trick: undefined }));

    await runOutboxRow("local-1");

    const sent = api.initiateUpload.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sent.clientHintTrickId).toBeUndefined();
    expect(sent.stance).toBeUndefined();
  });

  it("retrying a failed job re-completes the same clip — no new initiate, no new charge", async () => {
    api.completeUpload.mockResolvedValue({ ok: true, data: {} });
    rows.set(
      "local-1",
      row({ clipId: mintClipId("clip-c"), state: "failed_permanent", errorKind: "analysis_failed" }),
    );

    const next = await retryOutboxRow("local-1");

    expect(api.initiateUpload).not.toHaveBeenCalled();
    expect(api.completeUpload).toHaveBeenCalledTimes(1);
    expect(api.completeUpload).toHaveBeenCalledWith("clip-c");
    expect(next?.state).toBe("analyzing");
  });

  it("re-uploads once when the server no longer holds the failed clip's object", async () => {
    api.completeUpload
      .mockResolvedValueOnce({ ok: false, error: { kind: "client", status: 404 } })
      .mockResolvedValueOnce({ ok: true, data: {} });
    api.initiateUpload.mockResolvedValue(initiated("clip-d2"));
    rows.set(
      "local-1",
      row({ clipId: mintClipId("clip-d"), state: "failed_permanent", errorKind: "analysis_failed" }),
    );

    const next = await retryOutboxRow("local-1");

    expect(api.initiateUpload).toHaveBeenCalledTimes(1);
    expect(api.completeUpload.mock.calls.map((c) => c[0])).toEqual(["clip-d", "clip-d2"]);
    expect(next?.clipId).toBe("clip-d2");
    expect(next?.state).toBe("analyzing");
  });

  it("does not loop when the fresh upload also 404s", async () => {
    api.completeUpload.mockResolvedValue({ ok: false, error: { kind: "client", status: 404 } });
    api.initiateUpload.mockResolvedValue(initiated("clip-e2"));
    rows.set(
      "local-1",
      row({ clipId: mintClipId("clip-e"), state: "failed_permanent", errorKind: "analysis_failed" }),
    );

    const next = await retryOutboxRow("local-1");

    expect(api.initiateUpload).toHaveBeenCalledTimes(1);
    expect(api.completeUpload).toHaveBeenCalledTimes(2);
    expect(next?.state).toBe("failed_retryable");
  });

  it("does not retry unreadable footage", async () => {
    rows.set(
      "local-1",
      row({ clipId: mintClipId("clip-f"), state: "failed_permanent", errorKind: "clip_unreadable" }),
    );

    const next = await retryOutboxRow("local-1");

    expect(api.completeUpload).not.toHaveBeenCalled();
    expect(api.initiateUpload).not.toHaveBeenCalled();
    expect(next?.state).toBe("failed_permanent");
  });

  it("maps a worker video_unreadable failure to a permanent, non-retryable row", async () => {
    api.fetchClipJob.mockResolvedValue({
      ok: true,
      data: { status: "failed", failureReason: "video_unreadable" },
    });
    rows.set("local-1", row({ clipId: mintClipId("clip-g"), state: "analyzing" }));

    const settled = await runOutboxRow("local-1");

    expect(settled?.state).toBe("failed_permanent");
    expect(settled?.errorKind).toBe("clip_unreadable");
  });

  it("persists the skater's call on the clip's row for reopen after relaunch", async () => {
    rows.set("local-1", row({ clipId: mintClipId("clip-h"), state: "ready" }));
    await setOutboxOutcome("local-1", "landed");
    expect(rows.get("local-1")?.outcome).toBe("landed");
    expect(rows.get("local-1")?.state).toBe("ready");
  });
  it("rejects local:// pseudo upload URLs instead of reporting analysis started", async () => {
    api.initiateUpload.mockResolvedValue({
      ok: true,
      data: { ...initiated("clip-local").data, upload_url: "local://upload/clip-local" },
    });
    rows.set("local-1", row({}));
    const result = await runOutboxRow("local-1");
    expect(result?.state).toBe("failed_permanent");
    expect(api.completeUpload).not.toHaveBeenCalled();
  });

  it("reports only the HTTP status when a signed storage PUT fails", async () => {
    const fs = await import("expo-file-system");
    vi.mocked(fs.uploadAsync).mockResolvedValueOnce({ status: 403 } as never);
    api.initiateUpload.mockResolvedValue(initiated("clip-status"));
    rows.set("local-1", row({}));

    const failed = await runOutboxRow("local-1");

    expect(failed?.state).toBe("failed_retryable");
    expect(api.reportUploadPutFailure).toHaveBeenCalledWith("clip-status", "presigned_put:http_403");
    expect(api.completeUpload).not.toHaveBeenCalled();
  });

  it("never sends an exception message or signed URL to telemetry", async () => {
    const fs = await import("expo-file-system");
    vi.mocked(fs.uploadAsync).mockRejectedValueOnce(
      new TypeError("Request failed https://r2.example/put?X-Amz-Signature=secret"),
    );
    api.initiateUpload.mockResolvedValue(initiated("clip-exception"));
    rows.set("local-1", row({}));

    const failed = await runOutboxRow("local-1");

    expect(failed?.state).toBe("failed_retryable");
    expect(api.reportUploadPutFailure).toHaveBeenCalledWith(
      "clip-exception",
      "presigned_put:exception_TypeError",
    );
    expect(api.completeUpload).not.toHaveBeenCalled();
  });

  it("resumes a failed PUT with a refreshed signed URL and the original clip id", async () => {
    const fs = await import("expo-file-system");
    vi.mocked(fs.uploadAsync)
      .mockResolvedValueOnce({ status: 503 } as never)
      .mockResolvedValueOnce({ status: 200 } as never);
    api.initiateUpload.mockResolvedValue(initiated("clip-retry"));
    api.refreshUpload.mockResolvedValue({
      ok: true,
      data: { ...initiated("clip-retry").data, upload_url: "https://r2.example/retry" },
    });
    api.completeUpload.mockResolvedValue({ ok: true, data: {} });
    rows.set("local-1", row({}));
    const failed = await runOutboxRow("local-1");
    expect(failed?.state).toBe("failed_retryable");
    expect(failed?.clipId).toBe("clip-retry");
    const resumed = await retryOutboxRow("local-1");
    expect(resumed?.state).toBe("analyzing");
    expect(resumed?.clipId).toBe("clip-retry");
    expect(api.initiateUpload).toHaveBeenCalledTimes(1);
    expect(api.refreshUpload).toHaveBeenCalledWith("clip-retry");
    expect(api.completeUpload).toHaveBeenCalledTimes(1);
  });

  it("stops retrying product quota errors and preserves the paywall signal", async () => {
    api.initiateUpload.mockResolvedValue({
      ok: false,
      error: { status: 429, kind: "quota", code: "quota_exhausted" },
    });
    rows.set("local-1", row({}));
    const result = await runOutboxRow("local-1");
    expect(result?.state).toBe("failed_permanent");
    expect(result?.errorKind).toBe("quota_exhausted");
    expect(api.completeUpload).not.toHaveBeenCalled();
  });

  it("does not treat an ordinary rate-limit 429 as an exhausted subscription", async () => {
    api.initiateUpload.mockResolvedValue({
      ok: false,
      error: { status: 429, kind: "rate_limited", code: "hourly_analysis_cap_reached" },
    });
    rows.set("local-1", row({}));
    const result = await runOutboxRow("local-1");
    expect(result?.state).toBe("failed_retryable");
    expect(result?.errorKind).toBe("rate_limited");
  });

});
