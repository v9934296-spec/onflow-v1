import { Pressable, Text, type PressableProps } from "react-native";
import { color, radius, textStyle, touchTarget } from "../tokens";

type Variant = "primary" | "secondary" | "destructive";

export function Button({
  label,
  variant = "primary",
  disabled,
  ...rest
}: PressableProps & { label: string; variant?: Variant }) {
  const background =
    variant === "primary" ? color.neon : variant === "destructive" ? color.red : color.surfaceAlt;
  const foreground = variant === "primary" ? color.bg : color.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: touchTarget.primaryButton,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        backgroundColor: background,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: color.hairlineHi,
      })}
      {...rest}
    >
      <Text style={{ ...textStyle.label, color: foreground }}>{label}</Text>
    </Pressable>
  );
}
