import { Pressable } from "react-native";
import { color, media, touchTarget } from "../tokens";

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
      style={{
        width: touchTarget.captureControl,
        height: touchTarget.captureControl,
        borderRadius: 999,
        backgroundColor: recording ? media.recording : color.neon,
        borderWidth: 4,
        borderColor: color.textPrimary,
        opacity: disabled ? 0.4 : 1,
      }}
    />
  );
}
