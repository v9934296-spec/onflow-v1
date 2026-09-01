import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { color, radius, space, textStyle, touchTarget } from "../tokens";
import { Button } from "./Button";

export function TextField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  editable = true,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  editable?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={color.textTertiary}
      accessibilityLabel={accessibilityLabel ?? placeholder}
      editable={editable}
      style={{
        ...textStyle.body,
        color: color.textPrimary,
        borderWidth: 1,
        borderColor: color.hairlineHi,
        borderRadius: radius.md,
        padding: space.lg,
        minHeight: touchTarget.minimum,
        opacity: editable ? 1 : 0.4,
      }}
    />
  );
}

export function Stepper({
  value,
  min = 0,
  max,
  onChange,
  accessibilityLabel,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{
          minWidth: touchTarget.minimum,
          minHeight: touchTarget.minimum,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.md,
          backgroundColor: color.surfaceAlt,
        }}
      >
        <Text style={{ ...textStyle.h2, color: color.textPrimary }}>–</Text>
      </Pressable>
      <Text style={{ ...textStyle.mono, color: color.textPrimary }}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{
          minWidth: touchTarget.minimum,
          minHeight: touchTarget.minimum,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.md,
          backgroundColor: color.surfaceAlt,
        }}
      >
        <Text style={{ ...textStyle.h2, color: color.textPrimary }}>+</Text>
      </Pressable>
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  visible: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSecondary}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={onSecondary}
        style={{
          flex: 1,
          backgroundColor: "rgba(10,10,11,0.72)",
          justifyContent: "center",
          padding: space.xl,
        }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            backgroundColor: color.surface,
            borderRadius: radius.lg,
            padding: space.xl,
            gap: space.lg,
            borderWidth: 1,
            borderColor: color.hairlineHi,
          }}
        >
          <Text style={{ ...textStyle.h2, color: color.textPrimary }}>{title}</Text>
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>{body}</Text>
          <Button label={primaryLabel} onPress={onPrimary} />
          <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
