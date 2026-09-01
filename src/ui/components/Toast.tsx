import { Pressable, Text, View } from "react-native";
import { color, radius, space, textStyle, touchTarget } from "../tokens";

export function Toast({
  body,
  actionLabel,
  onAction,
}: {
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.lg,
        borderRadius: radius.md,
        backgroundColor: color.surfaceAlt,
        borderWidth: 1,
        borderColor: color.hairlineHi,
      }}
    >
      <Text style={{ ...textStyle.bodySm, color: color.textPrimary, flex: 1 }}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={{ minHeight: touchTarget.minimum, justifyContent: "center" }}
        >
          <Text style={{ ...textStyle.label, color: color.neon }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
