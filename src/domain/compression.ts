/**
 * EXP-001 candidate contract.
 *
 * These numbers are a starting point for the physical iPhone run, not a closed
 * measurement. Capture encoding waits on filling `docs/exp-001-compression.md`.
 */
export const compressionContract = {
  container: "mp4",
  codec: "h264",
  mimeType: "video/mp4" as const,
  maxDurationSeconds: 30,
  maxBytes: 100 * 1024 * 1024,
  longEdgePx: 1080,
  maxFps: 60,
  /** Candidate. 6 Mbps × 30s ≈ 22.5 MB, well under 100 MB. Device-verify. */
  targetBitrateBps: 6_000_000,
  preserveAudio: true,
  stripLocation: true,
  status: "UNVERIFIED_PENDING_DEVICE" as const,
};

/** Spec §13: reject over 30s or 100MB before initiate-upload. Equal to the ceiling is allowed. */
export function clipExceedsLaunchCeiling(input: {
  durationSeconds: number;
  sizeBytes: number;
}): "clip_too_long" | "clip_too_large" | null {
  if (input.durationSeconds > compressionContract.maxDurationSeconds) return "clip_too_long";
  if (input.sizeBytes > compressionContract.maxBytes) return "clip_too_large";
  return null;
}
