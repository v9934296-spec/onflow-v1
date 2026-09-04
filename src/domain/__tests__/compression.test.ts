import { describe, expect, it } from "vitest";
import { clipExceedsLaunchCeiling, compressionContract } from "../compression";

describe("launch clip ceilings", () => {
  it("rejects a clip over 30 seconds before initiate-upload", () => {
    expect(
      clipExceedsLaunchCeiling({
        durationSeconds: compressionContract.maxDurationSeconds + 0.01,
        sizeBytes: 1_000,
      }),
    ).toBe("clip_too_long");
  });

  it("rejects a clip over 100MB before initiate-upload", () => {
    expect(
      clipExceedsLaunchCeiling({
        durationSeconds: 8,
        sizeBytes: compressionContract.maxBytes + 1,
      }),
    ).toBe("clip_too_large");
  });

  it("allows a clip that sits on the ceiling", () => {
    expect(
      clipExceedsLaunchCeiling({
        durationSeconds: compressionContract.maxDurationSeconds,
        sizeBytes: compressionContract.maxBytes,
      }),
    ).toBeNull();
  });
});
