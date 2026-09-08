import { apiRequest } from "./client";
import {
  accountMeSchema,
  appleAuthSchema,
  attemptSchema,
  clipJobSchema,
  sessionSchema,
  trickListSchema,
} from "./schemas/runtime";
import { mapAttempt, mapCatalogTrick, mapSession } from "../domain/mappers/records";
import { mapClipJob } from "../domain/mappers/clipJob";
import { mapSkaterProfile, type SkaterProfilePatchWire } from "../domain/mappers/skaterProfile";
import type { AnalysisResult, Attempt, CatalogTrick, SkateSession } from "../domain/models";
import type { SkaterProfile } from "../domain/skaterProfile";
import { skaterProfileResponseSchema, skaterProfileSchema } from "./schemas/runtime";
import type { ApiResult } from "./types";
import { fail, ok } from "./types";

function validated<T>(
  parsed: { success: true; data: T } | { success: false },
): ApiResult<T> {
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(parsed.data);
}

export async function signInWithApple(idToken: string) {
  const res = await apiRequest<unknown>("/api/v1/auth/apple", {
    method: "POST",
    json: { id_token: idToken },
    auth: false,
  });
  if (!res.ok) return res;
  return validated(appleAuthSchema.safeParse(res.data));
}

export async function fetchMe() {
  const res = await apiRequest<unknown>("/api/v1/account/me");
  if (!res.ok) return res;
  return validated(accountMeSchema.safeParse(res.data));
}

/**
 * Skater profile (docs/personalization-001-client.md). Not yet in
 * `openapi/openapi.json` — the snapshot is refreshed from the deployed API,
 * never hand-edited. Until then zod is the contract check. A 404 here means
 * the endpoint is not deployed; the store treats that as feature-absent.
 */
export async function fetchSkaterProfile(): Promise<ApiResult<SkaterProfile | null>> {
  const res = await apiRequest<unknown>("/api/v1/account/skater-profile", { timeoutMs: 10_000 });
  if (!res.ok) return res;
  const parsed = skaterProfileResponseSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(parsed.data ? mapSkaterProfile(parsed.data) : null);
}

export async function patchSkaterProfile(
  body: SkaterProfilePatchWire,
): Promise<ApiResult<SkaterProfile>> {
  const res = await apiRequest<unknown>("/api/v1/account/skater-profile", {
    method: "PATCH",
    json: body,
  });
  if (!res.ok) return res;
  const parsed = skaterProfileSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(mapSkaterProfile(parsed.data));
}

export async function createSession(): Promise<ApiResult<SkateSession>> {
  const res = await apiRequest<unknown>("/api/v1/sessions", { method: "POST", json: {} });
  if (!res.ok) return res;
  const parsed = sessionSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(mapSession(parsed.data));
}

export async function fetchSession(id: string): Promise<ApiResult<SkateSession>> {
  const res = await apiRequest<unknown>(`/api/v1/sessions/${id}`);
  if (!res.ok) return res;
  const parsed = sessionSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(mapSession(parsed.data));
}

export async function endSession(id: string, endedAt: string): Promise<ApiResult<SkateSession>> {
  const current = await fetchSession(id);
  if (!current.ok) return current;
  if (current.data.endedAt) {
    return ok(current.data);
  }
  const res = await apiRequest<unknown>(`/api/v1/sessions/${id}`, {
    method: "PATCH",
    json: { ended_at: endedAt },
  });
  if (!res.ok) return res;
  const parsed = sessionSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(mapSession(parsed.data));
}

export async function fetchTricks(): Promise<ApiResult<CatalogTrick[]>> {
  const res = await apiRequest<unknown>("/api/v1/tricks");
  if (!res.ok) return res;
  const parsed = trickListSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  return ok(parsed.data.tricks.map(mapCatalogTrick));
}

export async function initiateUpload(input: {
  sessionId?: string;
  durationSeconds: number;
  widthPx: number;
  heightPx: number;
  contentType: "video/mp4" | "video/quicktime";
  sizeBytes: number;
  capturedAt: string;
  clientHintTrickId?: string;
}) {
  return apiRequest<{
    clip_id: string;
    upload_url: string;
    upload_method: string;
    upload_expires_at: string;
    storage_key: string;
  }>("/api/v1/clips/initiate-upload", {
    method: "POST",
    json: {
      session_id: input.sessionId,
      duration_seconds: input.durationSeconds,
      width_px: input.widthPx,
      height_px: input.heightPx,
      content_type: input.contentType,
      size_bytes: input.sizeBytes,
      captured_at: input.capturedAt,
      client_hint_trick_id: input.clientHintTrickId,
    },
  });
}

export async function completeUpload(clipId: string) {
  return apiRequest<unknown>(`/api/v1/clips/${clipId}/complete-upload`, { method: "POST" });
}

export async function fetchClipJob(jobId: string): Promise<ApiResult<AnalysisResult>> {
  const res = await apiRequest<unknown>(`/api/v1/clips/jobs/${jobId}`);
  if (!res.ok) return res;
  const parsed = clipJobSchema.safeParse(res.data);
  if (!parsed.success) return fail({ kind: "contract" });
  if (parsed.data.status === "completed" && parsed.data.result == null) {
    return fail({ kind: "contract" });
  }
  return ok(mapClipJob(parsed.data));
}

export async function syncAttempts(attempts: Attempt[]): Promise<ApiResult<{ accepted: string[]; rejected: { id: string; reason: string }[] }>> {
  return apiRequest("/api/v1/session-attempts/sync", {
    method: "POST",
    json: {
      attempts: attempts.map((a) => ({
        id: a.id,
        session_id: a.sessionId,
        trick_id: a.trickId,
        canonical_name: a.canonicalName,
        outcome: a.outcome,
        logged_at: a.loggedAt,
      })),
    },
  });
}

export async function fetchSessionAttempts(sessionId: string): Promise<ApiResult<Attempt[]>> {
  const res = await apiRequest<{ attempts: unknown[] }>(`/api/v1/sessions/${sessionId}/attempts`);
  if (!res.ok) return res;
  const attempts: Attempt[] = [];
  for (const raw of res.data.attempts) {
    const parsed = attemptSchema.safeParse(raw);
    if (!parsed.success) return fail({ kind: "contract" });
    attempts.push(mapAttempt(parsed.data));
  }
  return ok(attempts);
}

export async function deleteAccount() {
  return apiRequest<unknown>("/api/v1/account", { method: "DELETE" });
}

export async function exportAccount() {
  return apiRequest<unknown>("/api/v1/account/export");
}

export async function syncBilling(hasPro: boolean) {
  return apiRequest<unknown>("/api/v1/billing/sync", {
    method: "POST",
    json: { has_pro: hasPro },
  });
}
