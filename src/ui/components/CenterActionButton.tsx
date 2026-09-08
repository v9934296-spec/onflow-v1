import { ActivityIndicator, Pressable, Text } from "react-native";
import type { CenterAction } from "@/domain/centerAction";
import { border, color, textStyle, touchTarget } from "../tokens";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { centerActionLines } from "./centerActionLabel";
import { pressFeedback } from "./pressFeedback";

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
  const reduceMotion = useReducedMotion();
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
      style={({ pressed }) => {
        const feedback = pressFeedback({
          pressed: pressed && !hydrating,
          reduceMotion,
          hard: true,
        });
        return {
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
          opacity: hydrating ? 0.7 : feedback.opacity,
          transform: [{ scale: feedback.scale }],
        };
      }}
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
