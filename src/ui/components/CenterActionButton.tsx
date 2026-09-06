import { ActivityIndicator, Pressable, Text } from "react-native";
import type { CenterAction } from "@/domain/centerAction";
import { border, color, PRESS_SCALE_HARD, textStyle, touchTarget } from "../tokens";
import { centerActionLines } from "./centerActionLabel";

/**
 * The tab bar's context action. Dominant through size and solid volt fill —
 * a bg-colored ring separates it from the bar instead of a drop-shadow glow.
 */
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
        borderWidth: border.rule * 2,
        borderColor: color.bg,
        backgroundColor: color.neon,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        opacity: hydrating ? 0.7 : 1,
        transform: [{ scale: pressed && !hydrating ? PRESS_SCALE_HARD : 1 }],
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
