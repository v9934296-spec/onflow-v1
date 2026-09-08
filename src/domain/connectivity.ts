type EventTargetLike = {
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

/** Online and offline — not a one-shot read. */
export function subscribeWindowConnectivity(
  target: EventTargetLike,
  onChange: () => void,
): () => void {
  if (typeof target.addEventListener !== "function") return () => undefined;
  target.addEventListener("online", onChange);
  target.addEventListener("offline", onChange);
  return () => {
    target.removeEventListener?.("online", onChange);
    target.removeEventListener?.("offline", onChange);
  };
}

/** Fires restored only when the runtime moves from offline to online. */
export function bindNetworkRestored(isCurrentlyOffline: () => boolean, onRestored: () => void): () => void {
  let wasOffline = isCurrentlyOffline();
  return () => {
    const offline = isCurrentlyOffline();
    if (wasOffline && !offline) onRestored();
    wasOffline = offline;
  };
}
