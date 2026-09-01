import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { color, radius, textStyle, touchTarget } from "../tokens";

type Variant = "primary" | "secondary" | "destructive";

export function Button({
  label,
  variant = "primary",
  disabled,
  loading = false,
  ...rest
}: PressableProps & { label: string; variant?: Variant; loading?: boolean }) {
  const background =
    variant === "primary" ? color.neon : variant === "destructive" ? color.red : color.surfaceAlt;
  const foreground = variant === "primary" ? color.bg : color.textPrimary;
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      style={({ pressed }) => ({
        minHeight: touchTarget.primaryButton,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        backgroundColor: background,
        opacity: blocked ? 0.4 : pressed ? 0.85 : 1,
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: color.hairlineHi,
      })}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={{ ...textStyle.label, color: foreground }}>{label}</Text>
      )}
    </Pressable>
  );
}
