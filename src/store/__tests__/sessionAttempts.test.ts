import { beforeEach, describe, expect, it } from "vitest";
import { useSessionAttemptsStore } from "../sessionAttempts";
import { kv, kvUserKeys } from "../kv";
import { attemptsForSession, mergeAttempts, nextAttemptNumber } from "../../domain/attempts";
import { mintAttemptId, mintSessionId, mintTrickId } from "../../domain/mappers/ids";
import type { Attempt } from "../../domain/models";

/** No EXPO_PUBLIC_API_URL in tests: every request fails before the network, i.e. offline. */
const store = () => useSessionAttemptsStore.getState();

function attempt(id: string, session: string, at: string): Attempt {
  return {
    id: mintAttemptId(id),
    sessionId: mintSessionId(session),
    trickId: mintTrickId("kickflip"),
    canonicalName: "Kickflip",
    outcome: "landed",
    loggedAt: at,
  };
}

beforeEach(() => {
  kv.delete(kvUserKeys.pendingAttempts("u1"));
  kv.delete(kvUserKeys.pendingAttempts("u2"));
  useSessionAttemptsStore.setState({
    userId: null,
    sessionId: null,
    confirmed: [],
    pending: [],
    queue: [],
  });
});

describe("session attempts queue", () => {
  it("persists the outcome before the request and keeps it when the server is unreachable", async () => {
    await store().load("u1", "s1");
    const synced = await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"));
    expect(synced).toBe(false);
    expect(store().pending.map((a) => a.id)).toEqual(["a1"]);
    expect(kv.get(kvUserKeys.pendingAttempts("u1"))).toContain("a1");
  });

  it("counts a queued attempt immediately", async () => {
    await store().load("u1", "s1");
    await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"));
    await store().record("u1", attempt("a2", "s1", "2026-09-05T10:01:00Z"));
    const visible = attemptsForSession(mergeAttempts(store().confirmed, store().pending), "s1");
    expect(nextAttemptNumber(visible, "kickflip")).toBe(3);
  });

  it("restores the queue for the same user and hides it from another", async () => {
    await store().load("u1", "s1");
    await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"));
    useSessionAttemptsStore.setState({ userId: null, pending: [], queue: [] });
    await store().load("u1", "s1");
    expect(store().pending).toHaveLength(1);
    await store().load("u2", "s1");
    expect(store().pending).toHaveLength(0);
  });

  it("migrates a schema-1 pending list onto idempotent queue rows", async () => {
    kv.set(
      kvUserKeys.pendingAttempts("u1"),
      JSON.stringify({
        schemaVersion: 1,
        attempts: [attempt("legacy", "s1", "2026-09-05T09:00:00Z")],
      }),
    );
    await store().load("u1", "s1");
    expect(store().queue[0]?.idempotencyKey).toBe("legacy");
    expect(store().pending.map((row) => row.id)).toEqual(["legacy"]);
  });

  it("writes retry metadata after a failed flush and keeps the outcome", async () => {
    await store().load("u1", "s1");
    await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"));
    const raw = kv.get(kvUserKeys.pendingAttempts("u1"));
    expect(raw).toContain("\"schemaVersion\":2");
    expect(store().queue[0]?.flushCount).toBeGreaterThanOrEqual(1);
    expect(store().queue[0]?.idempotencyKey).toBe(store().pending[0]?.id);
    expect(store().pending.map((row) => row.id)).toEqual(["a1"]);
  });

  it("keeps a previous session's queued attempts while a new session is active", async () => {
    await store().load("u1", "s1");
    await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"));
    await store().load("u1", "s2");
    expect(store().pending.map((a) => a.sessionId)).toEqual(["s1"]);
    expect(attemptsForSession(mergeAttempts(store().confirmed, store().pending), "s2")).toEqual([]);
  });
});
