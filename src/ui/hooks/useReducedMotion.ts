import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The system Reduce Motion setting, kept current.
 *
 * Read once on mount and then followed, because the skater can change it
 * mid-session from Control Center. Defaults to `false` so a failed read
 * degrades to ordinary motion rather than silently flattening the product.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
