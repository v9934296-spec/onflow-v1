import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config", () => ({
  isApiConfigured: () => true,
  getApiBaseUrl: () => "https://api.onflow.test",
}));

import { apiRequest } from "../client";

function failure(status: number, detail: string) {
  return {
    ok: false,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify({ detail }),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("structured API quota and throttle errors", () => {
  it("recognizes monthly quota 429 as a paywall condition", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => failure(429, "quota_exhausted")));
    const r = await apiRequest("/api/v1/clips/initiate-upload", { auth: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatchObject({
      kind: "quota", code: "quota_exhausted", status: 429,
    });
    vi.unstubAllGlobals();
  });

  it("keeps ordinary abuse throttling retryable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => failure(429, "hourly_analysis_cap_reached")));
    const r = await apiRequest("/api/v1/clips/initiate-upload", { auth: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatchObject({
      kind: "rate_limited", code: "hourly_analysis_cap_reached", status: 429,
    });
    vi.unstubAllGlobals();
  });

  it("recognizes expired-trial 403 without scraping prose", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => failure(403, "tier_gate")));
    const r = await apiRequest("/api/v1/clips/initiate-upload", { auth: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatchObject({
      kind: "quota", code: "tier_gate", status: 403,
    });
    vi.unstubAllGlobals();
  });
});
