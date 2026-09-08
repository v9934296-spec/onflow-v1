import { describe, expect, it } from "vitest";
import { asErrorKind, errorCopy, type ErrorKind } from "../errors";
import { CATALOG_ERROR_KINDS } from "../../../domain/outbox";

const KINDS: ErrorKind[] = [
  "offline",
  "rate_limited",
  "quota_exhausted",
  "tier_gate",
  "auth_expired",
  "upload_failed_retryable",
  "upload_failed_permanent",
  "clip_too_long",
  "clip_too_large",
  "clip_unsupported_type",
  "clip_unreadable",
  "analysis_failed",
  "contract_error",
  "session_missing",
  "session_already_ended",
  "capture_after_session_end",
  "attempt_conflict",
  "store_unavailable",
  "entitlement_syncing",
  "low_storage",
  "profile_save_failed",
  "profile_invalid",
  "unknown",
];

describe("error copy catalog", () => {
  it("gives every kind a recovery action (truth rule 8)", () => {
    for (const kind of KINDS) {
      expect(errorCopy[kind].primaryAction.length).toBeGreaterThan(0);
      expect(errorCopy[kind].body.length).toBeGreaterThan(0);
    }
  });

  it("covers every catalog kind and refuses free-text wire strings", () => {
    expect([...KINDS].sort()).toEqual([...CATALOG_ERROR_KINDS].sort());
    expect(asErrorKind("provider_unavailable")).toBe("unknown");
    expect(asErrorKind("analysis_failed")).toBe("analysis_failed");
  });
});
