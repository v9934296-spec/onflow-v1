import { describe, expect, it, vi } from "vitest";

const events = vi.hoisted(() => ({
  listener: null as null | ((state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void),
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  AppState: { addEventListener: () => ({ remove: () => undefined }) },
}));

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: (fn: typeof events.listener) => {
      events.listener = fn;
      return () => { events.listener = null; };
    },
    refresh: vi.fn(),
  },
}));

import { isOffline, subscribeNetworkRestored } from "../net";

describe("native reachability", () => {
  it("drains queued work only when the phone reconnects", () => {
    const onRestored = vi.fn();
    const stop = subscribeNetworkRestored(onRestored);
    expect(events.listener).not.toBeNull();

    events.listener?.({ isConnected: false, isInternetReachable: false });
    expect(isOffline()).toBe(true);
    events.listener?.({ isConnected: true, isInternetReachable: true });
    expect(isOffline()).toBe(false);
    expect(onRestored).toHaveBeenCalledTimes(1);
    events.listener?.({ isConnected: true, isInternetReachable: true });
    expect(onRestored).toHaveBeenCalledTimes(1);

    stop();
    expect(events.listener).toBeNull();
  });
});
