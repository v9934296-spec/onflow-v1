import { AppState, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { bindNetworkRestored, subscribeWindowConnectivity } from "../domain/connectivity";

let offline = false;

export function isApiConfigured(): boolean {
  return Boolean((process.env.EXPO_PUBLIC_API_URL ?? "").trim());
}

/** Use native reachability. navigator.onLine is not reliable on iOS/Android. */
export function isOffline(): boolean {
  return offline;
}

/** Observe network changes and recheck on foreground; no polling or token logging. */
export function subscribeConnectivity(onChange: () => void): () => void {
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    const next = state.isConnected === false || state.isInternetReachable === false;
    if (next !== offline) {
      offline = next;
      onChange();
    }
  });

  const stopWindow =
    Platform.OS === "web" ? subscribeWindowConnectivity(globalThis, onChange) : () => undefined;

  const app = AppState.addEventListener("change", (next) => {
    if (next === "active") {
      void NetInfo.refresh().then((state) => {
        const nextOffline = state.isConnected === false || state.isInternetReachable === false;
        offline = nextOffline;
        onChange();
      }).catch(() => onChange());
    }
  });
  return () => {
    unsubscribeNetInfo();
    stopWindow();
    app.remove();
  };
}

/** Fires only on the offline-to-online edge; resumes the durable outbox. */
export function subscribeNetworkRestored(onRestored: () => void): () => void {
  const onChange = bindNetworkRestored(isOffline, onRestored);
  return subscribeConnectivity(onChange);
}
