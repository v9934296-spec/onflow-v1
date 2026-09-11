import { AppState } from "react-native";
import { bindNetworkRestored, subscribeWindowConnectivity } from "../domain/connectivity";

export function isApiConfigured(): boolean {
  return Boolean((process.env.EXPO_PUBLIC_API_URL ?? "").trim());
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && "onLine" in navigator && navigator.onLine === false;
}

/** Fires on window online/offline and when the app returns to the foreground. */
export function subscribeConnectivity(onChange: () => void): () => void {
  const stopWindow = subscribeWindowConnectivity(globalThis, onChange);
  const app = AppState.addEventListener("change", (next) => {
    if (next === "active") onChange();
  });
  return () => {
    stopWindow();
    app.remove();
  };
}

/** Fires when the runtime reports the network came back. No-op if the host has no events. */
export function subscribeNetworkRestored(onRestored: () => void): () => void {
  const onChange = bindNetworkRestored(isOffline, onRestored);
  return subscribeConnectivity(onChange);
}
