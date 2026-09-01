import { Pressable, Text } from "react-native";
import { color, radius, space, textStyle, touchTarget } from "../tokens";

export function Chip({
  label,
  selected = false,
  disabled = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={{
        minHeight: touchTarget.minimum,
        paddingHorizontal: space.lg,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? color.neon : color.hairlineHi,
        backgroundColor: selected ? color.surfaceAlt : color.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ ...textStyle.label, color: selected ? color.neon : color.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterPill({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return <Chip label={label} selected={selected} onPress={onPress} />;
}
