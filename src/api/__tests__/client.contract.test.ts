import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../client";
import { endSession, fetchClipJob, fetchSession, initiateUpload, syncAttempts } from "../endpoints";

const originalUrl = process.env.EXPO_PUBLIC_API_URL;

function response(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.EXPO_PUBLIC_API_URL = originalUrl;
});

describe("API contract failure shapes", () => {
  it("preserves rate-limit retry metadata and conflict status", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response(429, { code: "rate_limited" }, { "Retry-After": "17" }))
      .mockResolvedValueOnce(response(409, { detail: "already_completed" })));

    await expect(apiRequest("/limited")).resolves.toEqual({
      ok: false,
      error: { kind: "rate_limited", status: 429, code: "rate_limited", retryAfterSeconds: 17 },
    });
    await expect(apiRequest("/conflict")).resolves.toEqual({
      ok: false,
      error: { kind: "client", status: 409, code: "already_completed" },
    });
  });

  it("maps aborts and fetch failures to non-success transport results", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    vi.stubGlobal("fetch", vi.fn()
      .mockRejectedValueOnce(new DOMException("timed out", "AbortError"))
      .mockRejectedValueOnce(new TypeError("network unavailable")));

    await expect(apiRequest("/timeout")).resolves.toEqual({ ok: false, error: { kind: "cancelled" } });
    await expect(apiRequest("/offline")).resolves.toEqual({ ok: false, error: { kind: "offline" } });
  });

  it("rejects incomplete upload, sync, and completed-job payloads", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response(201, { clip_id: "clip-1", upload_url: "https://upload.test" }))
      .mockResolvedValueOnce(response(200, { accepted: ["attempt-1"] }))
      .mockResolvedValueOnce(response(200, { job_id: "clip-1", status: "completed" })));

    await expect(initiateUpload({
      durationSeconds: 4,
      widthPx: 1080,
      heightPx: 1080,
      contentType: "video/mp4",
      sizeBytes: 100,
      capturedAt: "2026-09-01T10:00:00Z",
    })).resolves.toEqual({ ok: false, error: { kind: "contract" } });
    await expect(syncAttempts([])).resolves.toEqual({ ok: false, error: { kind: "contract" } });
    await expect(fetchClipJob("clip-1")).resolves.toEqual({ ok: false, error: { kind: "contract" } });
  });

  it("omits captured_at for legacy rows while preserving present capture times", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    const fetch = vi.fn().mockResolvedValue(response(201, {
      clip_id: "clip-1",
      upload_url: "https://upload.test",
      upload_expires_at: "2026-09-02T10:00:00Z",
      storage_key: "clips/clip-1",
    }));
    vi.stubGlobal("fetch", fetch);

    await initiateUpload({
      durationSeconds: 4, widthPx: 1080, heightPx: 1080, contentType: "video/mp4", sizeBytes: 100,
    });

    const init = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).not.toHaveProperty("captured_at");
  });

  it("accepts legacy session payloads and preserves an already-ended server session", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(response(200, {
      id: "session-1",
      started_at: "2026-09-01T09:00:00Z",
      ended_at: "2026-09-01T10:00:00Z",
    })));
    vi.stubGlobal("fetch", fetch);

    await expect(fetchSession("session-1")).resolves.toMatchObject({
      ok: true,
      data: { spotLabel: null, focusTrick: null },
    });
    await expect(endSession("session-1", "2026-09-01T11:00:00Z")).resolves.toMatchObject({
      ok: true,
      data: { endedAt: "2026-09-01T10:00:00Z" },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
