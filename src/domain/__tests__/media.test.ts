import { describe, expect, it } from "vitest";
import {
  formatClipLength,
  formatFileSize,
  isLocalMediaUri,
  mayDeleteWorkingFile,
  mediaViewState,
  parseReviewParams,
  reviewHref,
} from "../media";

const good = {
  uri: "file:///tmp/clip.mp4",
  duration: "8.4",
  size: "18874368",
  kind: "recorded",
  capturedAt: "2026-09-05T10:00:00.000Z",
};

describe("media rules", () => {
  it("never permits deleting a skater's own library file", () => {
    expect(mayDeleteWorkingFile("recorded")).toBe(true);
    expect(mayDeleteWorkingFile("imported")).toBe(false);
  });

  it("formats size and length without inventing precision", () => {
    expect(formatFileSize(18874368)).toBe("18 MB");
    expect(formatFileSize(4096)).toBe("4 KB");
    expect(formatFileSize(0)).toBe("—");
    expect(formatFileSize(Number.NaN)).toBe("—");
    expect(formatClipLength(8)).toBe("00:08");
  });

  it("accepts a complete clip description", () => {
    expect(parseReviewParams(good)).toEqual({
      uri: "file:///tmp/clip.mp4",
      durationSeconds: 8.4,
      sizeBytes: 18874368,
      mediaKind: "recorded",
      capturedAt: "2026-09-05T10:00:00.000Z",
    });
  });

  it("refuses an incomplete or malformed one instead of showing an empty frame", () => {
    expect(parseReviewParams({})).toBeNull();
    expect(parseReviewParams({ ...good, uri: "  " })).toBeNull();
    expect(parseReviewParams({ ...good, duration: "0" })).toBeNull();
    expect(parseReviewParams({ ...good, duration: "abc" })).toBeNull();
    expect(parseReviewParams({ ...good, size: "-1" })).toBeNull();
    expect(parseReviewParams({ ...good, kind: "derivative" })).toBeNull();
    expect(parseReviewParams({ ...good, capturedAt: "yesterday" })).toBeNull();
  });

  it("round-trips through the href it builds", () => {
    const params = parseReviewParams(good);
    expect(params).not.toBeNull();
    const href = reviewHref(params!);
    const query = Object.fromEntries(new URLSearchParams(href.split("?")[1] ?? ""));
    expect(parseReviewParams(query)).toEqual(params);
  });

  it("survives a uri with query characters", () => {
    const tricky = { ...good, uri: "file:///tmp/a b&c?d=1.mov" };
    const params = parseReviewParams(tricky)!;
    const query = Object.fromEntries(new URLSearchParams(reviewHref(params).split("?")[1] ?? ""));
    expect(parseReviewParams(query)?.uri).toBe("file:///tmp/a b&c?d=1.mov");
  });

  it("loads, retries, or falls back instead of mounting a broken player", () => {
    expect(isLocalMediaUri("file:///tmp/clip.mp4")).toBe(true);
    expect(isLocalMediaUri("https://cdn.example/clip.mp4")).toBe(false);

    expect(mediaViewState({ uri: null, fileExists: null, playerFailed: false })).toBe("missing");
    expect(mediaViewState({ uri: "file:///tmp/clip.mp4", fileExists: null, playerFailed: false })).toBe(
      "loading",
    );
    expect(mediaViewState({ uri: "file:///tmp/clip.mp4", fileExists: false, playerFailed: false })).toBe(
      "failed",
    );
    expect(
      mediaViewState({ uri: "https://cdn.example/clip.mp4", fileExists: null, playerFailed: true }),
    ).toBe("failed");
    expect(
      mediaViewState({ uri: "https://cdn.example/clip.mp4", fileExists: null, playerFailed: false }),
    ).toBe("ready");
  });
});
