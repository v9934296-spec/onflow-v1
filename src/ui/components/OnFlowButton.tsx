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
import { border, color, radius, textStyle, touchTarget } from "../tokens";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { pressFeedback } from "./pressFeedback";

/** `quiet` is a text action in alum — for leaving, ending, dismissing. Not red: ending a session is not an error. */
type Variant = "primary" | "secondary" | "ghost" | "quiet" | "destructive";
type Size = "hero" | "primary" | "compact";

/**
 * The product's button. Three sizes, five variants, one motion.
 *
 * `hero` is the physical control — FILM, START SESSION — set in display type
 * at capture-control height and compressed harder on press. `primary` is the
 * ordinary confirming action. `compact` is for secondary rows and toolbars.
 *
 * Under Reduce Motion the compression becomes an instant opacity step: the
 * control still answers the touch, it just doesn't move (spec §10.3).
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
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const blocked = Boolean(disabled) || loading;
  const hard = size === "hero";

  const applyPress = (pressed: boolean) => {
    const next = pressFeedback({ pressed, reduceMotion, hard });
    Animated.parallel([
      Animated.timing(scale, {
        toValue: next.scale,
        duration: next.durationMs,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: next.opacity,
        duration: next.durationMs,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
    <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy: loading }}
        disabled={blocked}
        onPressIn={() => applyPress(true)}
        onPressOut={() => applyPress(false)}
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
