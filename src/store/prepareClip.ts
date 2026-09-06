import * as FileSystem from "expo-file-system";
import { clipExceedsLaunchCeiling } from "../domain/compression";
import { isWorkspaceUri, WORKSPACE_DIR_NAME, workspaceFileName } from "../domain/prepareClip";
import { mimeFromUri } from "../domain/tricks";

export type PreparedClip = {
  uri: string;
  mimeType: "video/mp4" | "video/quicktime";
  sizeBytes: number;
  mediaKind: "recorded" | "imported" | "derivative";
  widthPx: number | null;
  heightPx: number | null;
};

export type PrepareClipError = "clip_too_long" | "clip_too_large" | "clip_unreadable";

/**
 * Copies the clip into an app-private cache so upload does not depend on the
 * picker URI staying alive. Does not encode, downscale, strip GPS, or write
 * back to the camera roll. Copy failure falls back to the original URI.
 */
export async function prepareClipForUpload(input: {
  uri: string;
  durationSeconds: number;
  mediaKind: "recorded" | "imported";
  widthPx?: number | null;
  heightPx?: number | null;
}): Promise<PreparedClip | { error: PrepareClipError }> {
  const info = await FileSystem.getInfoAsync(input.uri);
  if (!info.exists) return { error: "clip_unreadable" };
  const sizeBytes = "size" in info && typeof info.size === "number" ? info.size : 0;
  if (sizeBytes <= 0) return { error: "clip_unreadable" };
  const ceiling = clipExceedsLaunchCeiling({
    durationSeconds: input.durationSeconds,
    sizeBytes,
  });
  if (ceiling) return { error: ceiling };

  const mimeType = mimeFromUri(input.uri);
  const widthPx = input.widthPx ?? null;
  const heightPx = input.heightPx ?? null;
  const cacheRoot = FileSystem.cacheDirectory;
  if (!cacheRoot) {
    return { uri: input.uri, mimeType, sizeBytes, mediaKind: input.mediaKind, widthPx, heightPx };
  }

  const dir = `${cacheRoot}${WORKSPACE_DIR_NAME}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  const dest = `${dir}${workspaceFileName(`${Date.now()}`, input.uri)}`;
  try {
    await FileSystem.copyAsync({ from: input.uri, to: dest });
    const copyInfo = await FileSystem.getInfoAsync(dest);
    const copySize =
      copyInfo.exists && "size" in copyInfo && typeof copyInfo.size === "number"
        ? copyInfo.size
        : sizeBytes;
    return {
      uri: dest,
      mimeType: mimeFromUri(dest),
      sizeBytes: copySize,
      mediaKind: "derivative",
      widthPx,
      heightPx,
    };
  } catch {
    return { uri: input.uri, mimeType, sizeBytes, mediaKind: input.mediaKind, widthPx, heightPx };
  }
}

/** Deletes an app-private derivative only. Imported originals are never touched. */
export async function discardWorkspaceCopy(uri: string, mediaKind: string): Promise<void> {
  if (mediaKind !== "derivative") return;
  if (!isWorkspaceUri(uri)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}
