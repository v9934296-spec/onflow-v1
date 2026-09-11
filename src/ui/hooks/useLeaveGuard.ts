import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
import type { LeaveDecision } from "@/domain/leaveGuard";

/**
 * Hardware back never silently destroys work. `allow` pops as usual;
 * `confirm` asks; `block` stays on the screen.
 */
export function useLeaveGuard(decision: LeaveDecision, onConfirmNeeded: () => void): void {
  const decisionRef = useRef(decision);
  const confirmRef = useRef(onConfirmNeeded);
  decisionRef.current = decision;
  confirmRef.current = onConfirmNeeded;

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const next = decisionRef.current;
      if (next === "allow") return false;
      if (next === "confirm") confirmRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);
}
