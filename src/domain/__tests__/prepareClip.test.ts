import { describe, expect, it } from "vitest";
import { compressionContract } from "../compression";
import { initiatePixelSize, isWorkspaceUri, workspaceFileName } from "../prepareClip";

describe("clip workspace helpers", () => {
  it("keeps mov extensions and sanitizes the token", () => {
    expect(workspaceFileName("local/1", "file:///clip.MOV")).toBe("local_1.mov");
    expect(workspaceFileName("abc", "file:///clip.mp4?cache=1")).toBe("abc.mp4");
  });

  it("recognizes only the app-private workspace folder", () => {
    expect(isWorkspaceUri("file:///tmp/onflow-clips/abc.mp4")).toBe(true);
    expect(isWorkspaceUri("ph://asset/100")).toBe(false);
    expect(isWorkspaceUri("file:///DCIM/100APPLE/clip.mp4")).toBe(false);
  });

  it("marks dimensions probed only when both edges were measured", () => {
    expect(initiatePixelSize({ widthPx: 1920, heightPx: 1080 })).toEqual({
      widthPx: 1920,
      heightPx: 1080,
      probed: true,
    });
    expect(initiatePixelSize({ widthPx: 1080, heightPx: null })).toEqual({
      widthPx: compressionContract.longEdgePx,
      heightPx: compressionContract.longEdgePx,
      probed: false,
    });
    expect(initiatePixelSize({})).toEqual({
      widthPx: compressionContract.longEdgePx,
      heightPx: compressionContract.longEdgePx,
      probed: false,
    });
  });
});
