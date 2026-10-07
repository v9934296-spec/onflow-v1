import { beforeEach, describe, expect, it } from "vitest";
import { mintLocalId, mintUserId } from "../../domain/mappers/ids";
import type { OutboxRow } from "../../domain/models";
import { kv, kvKeys } from "../kv";
import {
  cancelOutbox,
  getOutbox,
  listRecoverable,
  resetOutboxStoreForTests,
  upsertOutbox,
} from "../outbox";

function row(partial: Partial<OutboxRow> = {}): OutboxRow {
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

beforeEach(() => {
  kv.delete(kvKeys.outbox);
  resetOutboxStoreForTests();
});

describe("outbox store", () => {
  it("persists rows to kv and reloads on a fresh hydrate", async () => {
    const pending = row({ localId: mintLocalId("persist-me") });
    await upsertOutbox(pending);
    resetOutboxStoreForTests();
    expect(await getOutbox(pending.localId)).toEqual(pending);
  });

  it("drops corrupt kv payload instead of serving partial state", async () => {
    kv.set(kvKeys.outbox, "{not-json");
    resetOutboxStoreForTests();
    expect(await getOutbox("missing")).toBeNull();
    expect(kv.get(kvKeys.outbox)).toBeNull();
  });

  it("ignores rows with the wrong schema version on hydrate", async () => {
    kv.set(
      kvKeys.outbox,
      JSON.stringify([
        { schemaVersion: 99, localId: "bad", ownerUserId: "user-1", state: "pending" },
        row({ localId: mintLocalId("good") }),
      ]),
    );
    resetOutboxStoreForTests();
    expect(await getOutbox(mintLocalId("bad"))).toBeNull();
    expect(await getOutbox(mintLocalId("good"))).not.toBeNull();
  });

  it("lists only recoverable pipeline rows for a user", async () => {
    await upsertOutbox(row({ ownerUserId: mintUserId("u1"), state: "pending" }));
    await upsertOutbox(row({ localId: mintLocalId("ready"), ownerUserId: mintUserId("u1"), state: "ready" }));
    await upsertOutbox(row({ localId: mintLocalId("other"), ownerUserId: mintUserId("u2"), state: "uploading" }));
    const recoverable = await listRecoverable(mintUserId("u1"));
    expect(recoverable).toHaveLength(1);
    expect(recoverable[0]?.state).toBe("pending");
  });

  it("cancels a row without deleting the file reference fields", async () => {
    const initial = row();
    await upsertOutbox(initial);
    await cancelOutbox(initial.localId);
    const cancelled = await getOutbox(initial.localId);
    expect(cancelled?.state).toBe("cancelled");
    expect(cancelled?.localUri).toBe(initial.localUri);
  });
});
