import { Modal, Pressable, Text, TextInput, type TextInputProps } from "react-native";
import { color, radius, space, textStyle, touchTarget } from "../tokens";
import { Button } from "./Button";

export function TextField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  editable = true,
  ...rest
}: Omit<TextInputProps, "style" | "value" | "onChangeText" | "editable"> & {
  value: string;
  onChangeText: (next: string) => void;
  editable?: boolean;
}) {
  return (
    <TextInput
      {...rest}
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
