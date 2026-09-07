import { Pressable } from "react-native";
import { color, glow, media, touchTarget } from "../tokens";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { pressFeedback } from "./pressFeedback";

/**
 * The record control. Tap to start, tap to stop (locked decision 13); the
 * long-press path resolves to the same tap so a held finger never behaves
 * differently.
 *
 * The recording glow is the one glow left in the product and stays under
 * Reduce Motion — it is a state indicator, not motion. The press compression
 * degrades to opacity (spec §10.3).
 */
export function RecordControl({
  recording,
  disabled,
  onPress,
}: {
  recording: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recording ? "Stop recording" : "Start recording"}
      accessibilityState={{ disabled: Boolean(disabled), selected: recording }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onPress}
      delayLongPress={180}
      style={({ pressed }) => {
        const feedback = pressFeedback({
          pressed: pressed && !disabled,
          reduceMotion,
          hard: true,
        });
        return {
          width: touchTarget.captureControl,
          height: touchTarget.captureControl,
          minWidth: touchTarget.minimum,
          minHeight: touchTarget.minimum,
          borderRadius: 999,
          backgroundColor: recording ? media.recording : color.neon,
          borderWidth: 4,
          borderColor: color.textPrimary,
          opacity: disabled ? 0.4 : feedback.opacity,
          transform: [{ scale: feedback.scale }],
          ...(recording ? glow.record : null),
        };
      }}
    />
  );
}
