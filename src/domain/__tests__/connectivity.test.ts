import { describe, expect, it } from "vitest";
import { bindNetworkRestored, subscribeWindowConnectivity } from "../connectivity";

describe("connectivity", () => {
  it("notifies on both online and offline, then unsubscribes", () => {
    const listeners = new Map<string, () => void>();
    const target = {
      addEventListener(type: string, listener: () => void) {
        listeners.set(type, listener);
      },
      removeEventListener(type: string) {
        listeners.delete(type);
      },
    };
    let ticks = 0;
    const stop = subscribeWindowConnectivity(target, () => {
      ticks += 1;
    });
    listeners.get("online")?.();
    listeners.get("offline")?.();
    expect(ticks).toBe(2);
    stop();
    expect(listeners.size).toBe(0);
  });

  it("fires restored only on the offline → online edge", () => {
    let offline = true;
    let restored = 0;
    const check = bindNetworkRestored(
      () => offline,
      () => {
        restored += 1;
      },
    );
    check();
    expect(restored).toBe(0);
    offline = false;
    check();
    check();
    expect(restored).toBe(1);
    offline = true;
    check();
    offline = false;
    check();
    expect(restored).toBe(2);
  });
});
