import { beforeEach, describe, expect, it, vi } from "vitest";
import { mintSessionId, mintTrickId } from "../../domain/mappers/ids";
import { kv, kvUserKeys } from "../kv";

const auth = vi.hoisted(() => ({ userId: "alpha" }));
vi.mock("../authStore", () => ({
  useAuthStore: { getState: () => ({ userId: auth.userId }) },
}));

import { useSessionStore } from "../sessionStore";

const alphaSession = {
  id: mintSessionId("session-alpha"),
  startedAt: "2026-10-01T12:00:00Z",
  endedAt: null,
  spotLabel: null,
  focusTrick: null,
};
const alphaTrick = {
  trickId: mintTrickId("kickflip"),
  canonicalName: "Kickflip",
  stance: "goofy",
  direction: null,
};

beforeEach(() => {
  for (const userId of ["alpha", "beta"]) {
    kv.delete(kvUserKeys.activeSessionId(userId));
    kv.delete(kvUserKeys.activeSession(userId));
    kv.delete(kvUserKeys.selectedTrick(userId));
    kv.delete(kvUserKeys.pendingSessionEnd(userId));
  }
  auth.userId = "alpha";
  useSessionStore.getState().clearInMemory();
});

describe("account-scoped skate session", () => {
  it("isolates session and selected trick when a different account signs in", () => {
    useSessionStore.getState().setSession(alphaSession);
    useSessionStore.getState().setTrick(alphaTrick);
    expect(kv.get(kvUserKeys.activeSessionId("alpha"))).toBe("session-alpha");

    auth.userId = "beta";
    useSessionStore.getState().clearInMemory();
    useSessionStore.getState().hydrateFromKv();
    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().trick).toBeNull();

    auth.userId = "alpha";
    useSessionStore.getState().hydrateFromKv();
    expect(useSessionStore.getState().session?.id).toBe("session-alpha");
    expect(useSessionStore.getState().trick?.canonicalName).toBe("Kickflip");
  });

  it("keeps a pending session end belonging only to its owner", () => {
    useSessionStore.getState().setPendingEnd({
      sessionId: "session-alpha",
      endedAt: "2026-10-01T12:20:00Z",
    });
    auth.userId = "beta";
    useSessionStore.getState().hydrateFromKv();
    expect(useSessionStore.getState().pendingEnd).toBeNull();
  });
});
