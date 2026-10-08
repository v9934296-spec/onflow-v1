import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const originalUrl = process.env.EXPO_PUBLIC_API_URL;

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.EXPO_PUBLIC_API_URL = originalUrl;
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

  it("saves an outcome through the online sync path after persisting it locally", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.body) return new Response(JSON.stringify({ attempts: [] }));
      const body = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ accepted: body.attempts.map((row: Attempt) => row.id), rejected: [] }));
    }));
    await store().load("u1", "s1");

    expect(await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"))).toBe(true);
    expect(store().pending).toEqual([]);
    expect(store().confirmed.map((row) => row.id)).toEqual(["a1"]);
  });

  it("reconciles an immutable conflict using the server's accepted record", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    const serverAttempt = {
      id: "a1", session_id: "s1", trick_id: "kickflip", canonical_name: "Kickflip",
      outcome: "missed", logged_at: "2026-09-05T10:00:01Z",
    };
    let fetches = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      fetches += 1;
      if (fetches === 2) return new Response(JSON.stringify({ accepted: [], rejected: [{ id: "a1", reason: "immutable_conflict" }] }));
      return new Response(JSON.stringify({ attempts: fetches === 3 ? [serverAttempt] : [] }));
    }));
    await store().load("u1", "s1");
    await store().record("u1", attempt("a1", "s1", "2026-09-05T10:00:00Z"));

    expect(store().pending).toEqual([]);
    expect(store().confirmed).toMatchObject([{ id: "a1", outcome: "missed" }]);
  });
});
