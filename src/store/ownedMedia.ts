import * as FileSystem from "expo-file-system";

/**
 * CameraView recordings and picker URIs can live in temporary cache.
 * Copy accepted footage to the app's documents directory BEFORE queueing.
 * Never delete the original, especially for imported camera-roll media.
 */
export async function persistOwnedClip(
  sourceUri: string,
  localId: string,
  mimeType: "video/mp4" | "video/quicktime",
  expectedSizeBytes: number,
): Promise<string | null> {
  const documents = FileSystem.documentDirectory;
  if (!documents || !sourceUri || !Number.isFinite(expectedSizeBytes) || expectedSizeBytes <= 0) {
    return null;
  }
  const extension = mimeType === "video/quicktime" ? "mov" : "mp4";
  const dir = `${documents}onflow/queued-clips/`;
  const safeId = encodeURIComponent(localId);
  const target = `${dir}${safeId}.${extension}`;
  try {
    const original = await FileSystem.getInfoAsync(sourceUri, { size: true });
    if (!original.exists || (original.size != null && original.size !== expectedSizeBytes)) {
      return null;
    }
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    if (sourceUri !== target) {
      await FileSystem.copyAsync({ from: sourceUri, to: target });
    }
    const copy = await FileSystem.getInfoAsync(target, { size: true });
    if (!copy.exists || copy.size !== expectedSizeBytes) {
      await FileSystem.deleteAsync(target, { idempotent: true });
      return null;
    }
    return target;
  } catch {
    // Copy failed: preserve the source and refuse to queue a non-durable URI.
    try {
      if (sourceUri !== target) await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {
      // Best effort only.
    }
    return null;
  }
}
