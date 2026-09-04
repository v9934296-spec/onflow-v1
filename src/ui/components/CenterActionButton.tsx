import { ActivityIndicator, Pressable, Text } from "react-native";
import type { CenterAction } from "@/domain/centerAction";
import { color, glow, PRESS_SCALE, textStyle, touchTarget } from "../tokens";
import { centerActionLines } from "./centerActionLabel";

export function CenterActionButton({
  action,
  onPress,
}: {
  action: CenterAction;
  onPress: () => void;
}) {
  const hydrating = action === "HYDRATING";
  const lines = centerActionLines(action);
  const stacked = lines.length > 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hydrating ? "Loading" : action}
      accessibilityState={{ disabled: hydrating, busy: hydrating }}
      disabled={hydrating}
      onPress={onPress}
      style={({ pressed }) => ({
        width: touchTarget.captureControl,
        height: touchTarget.captureControl,
        minWidth: touchTarget.minimum,
        minHeight: touchTarget.minimum,
        marginTop: -18,
        borderRadius: 999,
        backgroundColor: color.neon,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        opacity: hydrating ? 0.7 : pressed ? 0.92 : 1,
        transform: [{ scale: pressed && !hydrating ? PRESS_SCALE : 1 }],
        ...glow.center,
      })}
    >
      {hydrating ? (
        <ActivityIndicator color={color.bg} />
      ) : (
        <Text
          style={{
            ...textStyle.label,
            color: color.bg,
            fontSize: stacked ? 12 : 13,
            lineHeight: stacked ? 13 : 16,
            letterSpacing: stacked ? 0.4 : 0.6,
            textAlign: "center",
          }}
        >
          {lines.join("\n")}
        </Text>
      )}
    </Pressable>
  );
}
