import { formatDuration } from "./attempts";

export type MediaKind = "recorded" | "imported";

/**
 * Media ownership (spec §11.2, guardrails 8).
 *
 * A working file OnFlow recorded itself may be deleted when the skater
 * rejects it. A file chosen from the camera roll is the skater's — rejecting
 * it drops our reference and nothing else. This is a rule, not a preference,
 * so it lives here and is asserted by test rather than decided inside a
 * screen.
 */
export function mayDeleteWorkingFile(kind: MediaKind): boolean {
  return kind === "recorded";
}

/** Whole MB above a megabyte, otherwise KB. Never a fake precision. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatClipLength(seconds: number): string {
  return formatDuration(seconds);
}

export interface ReviewParams {
  readonly uri: string;
  readonly durationSeconds: number;
  readonly sizeBytes: number;
  readonly mediaKind: MediaKind;
  readonly capturedAt: string;
}

/**
 * Route params are strings from the router and are never trusted. A clip that
 * cannot be described completely is not reviewed — the caller sends the
 * skater back to capture rather than showing an empty frame.
 */
export function parseReviewParams(raw: {
  uri?: string;
  duration?: string;
  size?: string;
  kind?: string;
  capturedAt?: string;
}): ReviewParams | null {
  const uri = (raw.uri ?? "").trim();
  if (!uri) return null;
  const durationSeconds = Number.parseFloat(raw.duration ?? "");
  const sizeBytes = Number.parseInt(raw.size ?? "", 10);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return null;
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return null;
  if (raw.kind !== "recorded" && raw.kind !== "imported") return null;
  const capturedAt = (raw.capturedAt ?? "").trim();
  if (!capturedAt || Number.isNaN(Date.parse(capturedAt))) return null;
  return { uri, durationSeconds, sizeBytes, mediaKind: raw.kind, capturedAt };
}

export function reviewHref(params: ReviewParams): string {
  const query = new URLSearchParams({
    uri: params.uri,
    duration: String(params.durationSeconds),
    size: String(params.sizeBytes),
    kind: params.mediaKind,
    capturedAt: params.capturedAt,
  });
  return `/review?${query.toString()}`;
}
