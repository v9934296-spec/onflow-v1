import { Pressable } from "react-native";
import { color, glow, media, PRESS_SCALE, touchTarget } from "../tokens";

export function RecordControl({
  recording,
  disabled,
  onPress,
}: {
  recording: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recording ? "Stop recording" : "Start recording"}
      accessibilityState={{ disabled: Boolean(disabled), selected: recording }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onPress}
      delayLongPress={180}
      style={({ pressed }) => ({
        width: touchTarget.captureControl,
        height: touchTarget.captureControl,
        minWidth: touchTarget.minimum,
        minHeight: touchTarget.minimum,
        borderRadius: 999,
        backgroundColor: recording ? media.recording : color.neon,
        borderWidth: 4,
        borderColor: color.textPrimary,
        opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed && !disabled ? PRESS_SCALE : 1 }],
        ...(recording ? glow.record : null),
      })}
    />
  );
}
