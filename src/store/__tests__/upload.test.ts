import { beforeEach, describe, expect, it, vi } from "vitest";
import { compressionContract } from "../../domain/compression";
import { mintClipId, mintLocalId, mintUserId } from "../../domain/mappers/ids";
import type { OutboxRow } from "../../domain/models";
import { kv, kvKeys } from "../kv";
import { resetOutboxStoreForTests, upsertOutbox } from "../outbox";

const initiateUpload = vi.fn();
const completeUpload = vi.fn();
const fetchClipJob = vi.fn();

vi.mock("../../api/endpoints", () => ({
  initiateUpload: (...args: unknown[]) => initiateUpload(...args),
  completeUpload: (...args: unknown[]) => completeUpload(...args),
  fetchClipJob: (...args: unknown[]) => fetchClipJob(...args),
}));

vi.mock("expo-file-system", () => ({
  uploadAsync: vi.fn().mockResolvedValue({ status: 200 }),
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));

function row(partial: Partial<OutboxRow> = {}): OutboxRow {
  return {
    schemaVersion: 1,
    localId: mintLocalId("upload-1"),
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

beforeEach(() => {
  kv.delete(kvKeys.outbox);
  resetOutboxStoreForTests();
  vi.clearAllMocks();
});

describe("upload pipeline", () => {
  it("marks oversize clips permanent before hitting the network", async () => {
    const { runOutboxRow } = await import("../upload");
    const oversized = row({ sizeBytes: compressionContract.maxBytes + 1 });
    await upsertOutbox(oversized);
    const result = await runOutboxRow(oversized.localId);
    expect(result?.state).toBe("failed_permanent");
    expect(result?.errorKind).toBe("clip_too_large");
    expect(initiateUpload).not.toHaveBeenCalled();
  });

  it("runs initiate → local put → complete and lands in analyzing", async () => {
    const { runOutboxRow } = await import("../upload");
    initiateUpload.mockResolvedValue({
      ok: true,
      data: { clip_id: "server-clip", upload_url: "local://disk/key", storage_key: "key" },
    });
    completeUpload.mockResolvedValue({ ok: true, data: { status: "pending" } });

    const initial = row();
    await upsertOutbox(initial);
    const after = await runOutboxRow(initial.localId);
    expect(initiateUpload).toHaveBeenCalled();
    expect(completeUpload).toHaveBeenCalledWith(mintClipId("server-clip"));
    expect(after?.state).toBe("analyzing");
    expect(after?.clipId).toEqual(mintClipId("server-clip"));
  });

  it("treats complete-upload 409 as already analyzing", async () => {
    const { runOutboxRow } = await import("../upload");
    const clipId = mintClipId("existing");
    const mid = row({
      state: "requesting_analysis",
      clipId,
      bytesUploaded: 1000,
    });
    await upsertOutbox(mid);
    completeUpload.mockResolvedValue({
      ok: false,
      error: { kind: "client", status: 409, code: "conflict" },
    });

    const after = await runOutboxRow(mid.localId);
    expect(after?.state).toBe("analyzing");
  });

  it("settles analyzing jobs to ready when the server reports completed", async () => {
    const { runOutboxRow } = await import("../upload");
    const clipId = mintClipId("done");
    await upsertOutbox(
      row({
        state: "analyzing",
        clipId,
        bytesUploaded: 1000,
      }),
    );
    fetchClipJob.mockResolvedValue({
      ok: true,
      data: { status: "completed", failureReason: null },
    });

    const after = await runOutboxRow(mintLocalId("upload-1"));
    expect(after?.state).toBe("ready");
  });
});
