import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  border,
  color,
  motionMs,
  PRESS_SCALE,
  PRESS_SCALE_HARD,
  radius,
  textStyle,
  touchTarget,
} from "../tokens";

/** `quiet` is a text action in alum — for leaving, ending, dismissing. Not red: ending a session is not an error. */
type Variant = "primary" | "secondary" | "ghost" | "quiet" | "destructive";
type Size = "hero" | "primary" | "compact";

/**
 * The product's button. Three sizes, four variants, one motion.
 *
 * `hero` is the physical control — FILM, START SESSION — set in display type
 * at capture-control height and compressed harder on press. `primary` is the
 * ordinary confirming action. `compact` is for secondary rows and toolbars.
 * Press compression is timed to `motionMs.press` on the native driver.
 */
export function OnFlowButton({
  label,
  variant = "primary",
  size = "primary",
  disabled,
  loading = false,
  haptic = false,
  style,
  onPress,
  ...rest
}: Omit<PressableProps, "style" | "onPress"> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Fires a selection haptic on press. Reserve for physical actions. */
  haptic?: boolean;
  /** Layout only (margin, flex). Visuals are owned here. */
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const blocked = Boolean(disabled) || loading;
  const hard = size === "hero";

  const compress = (to: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration: motionMs.press,
      useNativeDriver: true,
    }).start();

  const background =
    variant === "primary"
      ? color.neon
      : variant === "destructive"
        ? color.red
        : "transparent";
  const foreground =
    variant === "primary" || variant === "destructive"
      ? color.bg
      : variant === "ghost"
        ? color.neon
        : variant === "quiet"
          ? color.alum
          : color.textPrimary;
  const height =
    size === "hero"
      ? touchTarget.captureControl
      : size === "primary"
        ? touchTarget.primaryButton
        : touchTarget.minimum;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy: loading }}
        disabled={blocked}
        onPressIn={() => compress(hard ? PRESS_SCALE_HARD : PRESS_SCALE)}
        onPressOut={() => compress(1)}
        onPress={() => {
          if (haptic) void Haptics.selectionAsync().catch(() => undefined);
          onPress?.();
        }}
        style={{
          minHeight: height,
          borderRadius: size === "compact" ? radius.xs : radius.sm,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: space(size),
          backgroundColor: background,
          borderWidth: variant === "secondary" ? border.hairline : 0,
          borderColor: color.hairlineHi,
          opacity: blocked ? 0.4 : 1,
        }}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : hard ? (
          <Text
            maxFontSizeMultiplier={1.6}
            style={{ ...textStyle.h1, color: foreground, textAlign: "center" }}
          >
            {label.toUpperCase()}
          </Text>
        ) : (
          <Text
            style={{
              ...textStyle.label,
              color: foreground,
              letterSpacing: 1,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function space(size: Size): number {
  return size === "hero" ? 24 : size === "primary" ? 16 : 12;
}
