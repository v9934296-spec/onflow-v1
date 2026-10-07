import { beforeEach, describe, expect, it, vi } from "vitest";

const loadSession = vi.fn();
const clearSession = vi.fn();
const saveSession = vi.fn();
const fetchMe = vi.fn();
const signInWithApple = vi.fn();

vi.mock("../secureSession", () => ({
  loadSession: (...args: unknown[]) => loadSession(...args),
  clearSession: (...args: unknown[]) => clearSession(...args),
  saveSession: (...args: unknown[]) => saveSession(...args),
}));

vi.mock("../../api/endpoints", () => ({
  fetchMe: (...args: unknown[]) => fetchMe(...args),
  signInWithApple: (...args: unknown[]) => signInWithApple(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("auth store", () => {
  it("hydrates to signed_out when secure storage is empty", async () => {
    loadSession.mockResolvedValue(null);
    const { useAuthStore } = await import("../authStore");
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().phase).toBe("signed_out");
    expect(useAuthStore.getState().userId).toBeNull();
  });

  it("clears the session when the server rejects the token", async () => {
    loadSession.mockResolvedValue({ token: "t", userId: "u1" });
    fetchMe.mockResolvedValue({ ok: false, error: { kind: "unauthorized", status: 401 } });
    const { useAuthStore } = await import("../authStore");
    await useAuthStore.getState().hydrate();
    expect(clearSession).toHaveBeenCalled();
    expect(useAuthStore.getState().phase).toBe("signed_out");
  });

  it("keeps a cached user id when the API is unreachable but the token is present", async () => {
    loadSession.mockResolvedValue({ token: "t", userId: "u1" });
    fetchMe.mockResolvedValue({ ok: false, error: { kind: "configuration" } });
    const { useAuthStore } = await import("../authStore");
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().phase).toBe("signed_in");
    expect(useAuthStore.getState().userId).toBe("u1");
  });

  it("persists a successful Apple sign-in", async () => {
    signInWithApple.mockResolvedValue({
      ok: true,
      data: { token: "jwt", user_id: "apple-user" },
    });
    const { useAuthStore } = await import("../authStore");
    const ok = await useAuthStore.getState().completeApple("apple-id-token");
    expect(ok).toBe(true);
    expect(saveSession).toHaveBeenCalledWith("jwt", "apple-user");
    expect(useAuthStore.getState().userId).toBe("apple-user");
  });

  it("signs out and clears secure storage", async () => {
    loadSession.mockResolvedValue({ token: "t", userId: "u1" });
    const { useAuthStore } = await import("../authStore");
    useAuthStore.setState({ phase: "signed_in", userId: "u1" });
    await useAuthStore.getState().signOut();
    expect(clearSession).toHaveBeenCalled();
    expect(useAuthStore.getState().phase).toBe("signed_out");
  });
});
