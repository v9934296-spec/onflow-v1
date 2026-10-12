import { beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({
  getInfoAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  copyAsync: vi.fn(),
  deleteAsync: vi.fn(),
}));
vi.mock("expo-file-system", () => ({
  documentDirectory: "file:///documents/",
  ...fs,
}));

import { persistOwnedClip } from "../ownedMedia";

beforeEach(() => {
  vi.resetAllMocks();
  fs.getInfoAsync.mockResolvedValue({ exists: true, size: 800 });
});

describe("durable clip handoff", () => {
  it("copies accepted footage into documents and verifies bytes before queuing", async () => {
    const uri = await persistOwnedClip("file:///cache/camera.mov", "clip-1", "video/quicktime", 800);
    expect(uri).toBe("file:///documents/onflow/queued-clips/clip-1.mov");
    expect(fs.makeDirectoryAsync).toHaveBeenCalledWith("file:///documents/onflow/queued-clips/", { intermediates: true });
    expect(fs.copyAsync).toHaveBeenCalledWith({
      from: "file:///cache/camera.mov",
      to: uri,
    });
    expect(fs.deleteAsync).not.toHaveBeenCalled();
  });

  it("refuses a missing source and never queues cache URI", async () => {
    fs.getInfoAsync.mockResolvedValueOnce({ exists: false });
    expect(await persistOwnedClip("file:///cache/lost.mp4", "clip-2", "video/mp4", 800)).toBeNull();
    expect(fs.copyAsync).not.toHaveBeenCalled();
  });

  it("refuses a truncated copy without deleting the imported original", async () => {
    fs.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 800 }).mockResolvedValueOnce({ exists: true, size: 700 });
    expect(await persistOwnedClip("file:///camera-roll/import.mp4", "clip-3", "video/mp4", 800)).toBeNull();
    expect(fs.deleteAsync).toHaveBeenCalledWith("file:///documents/onflow/queued-clips/clip-3.mp4", { idempotent: true });
    expect(fs.deleteAsync).not.toHaveBeenCalledWith("file:///camera-roll/import.mp4", expect.anything());
  });

  it("refuses copy failures without deleting the source", async () => {
    fs.copyAsync.mockRejectedValueOnce(new Error("full disk"));
    expect(await persistOwnedClip("file:///cache/input.mp4", "clip-4", "video/mp4", 800)).toBeNull();
    expect(fs.deleteAsync).not.toHaveBeenCalledWith("file:///cache/input.mp4", expect.anything());
  });
});
