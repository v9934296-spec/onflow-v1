import { compressionContract } from "./compression";

export const WORKSPACE_DIR_NAME = "onflow-clips";

/** App-private workspace filename. Never a camera-roll path. */
export function workspaceFileName(token: string, sourceUri: string): string {
  const path = sourceUri.split("?")[0]?.toLowerCase() ?? "";
  const ext = path.endsWith(".mov") || path.endsWith(".qt") ? ".mov" : ".mp4";
  const safe = token.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${safe}${ext}`;
}

export function isWorkspaceUri(uri: string): boolean {
  const needle = `/${WORKSPACE_DIR_NAME}/`;
  return uri.includes(needle) || uri.includes(`${WORKSPACE_DIR_NAME}%2F`);
}

/**
 * Initiate-upload requires integers. Only mark `probed` when both edges were
 * measured. Unprobed falls back to the contract long-edge pair — that is an
 * API filler, not a claim that the file was scaled.
 */
export function initiatePixelSize(probed: {
  widthPx?: number | null;
  heightPx?: number | null;
}): { widthPx: number; heightPx: number; probed: boolean } {
  const width = probed.widthPx;
  const height = probed.heightPx;
  if (
    typeof width === "number" &&
    typeof height === "number" &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return { widthPx: Math.round(width), heightPx: Math.round(height), probed: true };
  }
  return {
    widthPx: compressionContract.longEdgePx,
    heightPx: compressionContract.longEdgePx,
    probed: false,
  };
}
