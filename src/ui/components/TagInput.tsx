import { Fragment, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { color, space, textStyle, touchTarget } from "../tokens";
import { OnFlowDivider } from "./OnFlowDivider";
import { OnFlowButton } from "./OnFlowButton";
import { TextField } from "./Form";

/**
 * Multi-entry text. Entries render as divided rows with a remove control,
 * not as pills. `normalize` is applied to the whole list on every change so
 * the visible list is exactly what would be saved.
 */
export function TagInput({
  values,
  onChange,
  normalize,
  placeholder,
  addLabel,
  maxLength,
  disabled = false,
}: {
  values: readonly string[];
  onChange: (next: string[]) => void;
  normalize: (raw: readonly string[]) => string[];
  placeholder: string;
  addLabel: string;
  maxLength: number;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState("");

  const add = () => {
    if (!pending.trim()) return;
    onChange(normalize([...values, pending]));
    setPending("");
  };

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center", paddingHorizontal: space.lg }}>
        <View style={{ flex: 1 }}>
          <TextField
            value={pending}
            onChangeText={(next) => setPending(next.slice(0, maxLength))}
            placeholder={placeholder}
            accessibilityLabel={placeholder}
            editable={!disabled}
            onSubmitEditing={add}
            returnKeyType="done"
            blurOnSubmit={false}
          />
        </View>
        <OnFlowButton
          label={addLabel}
          size="compact"
          variant="secondary"
          disabled={disabled || !pending.trim()}
          onPress={add}
        />
      </View>
      {values.length > 0 ? (
        <View>
          <OnFlowDivider />
          {values.map((value) => (
            <Fragment key={value.toLowerCase()}>
              <View
                style={{
                  minHeight: touchTarget.minimum,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingLeft: space.lg,
                }}
              >
                <Text style={{ ...textStyle.body, color: color.textPrimary, flex: 1 }}>{value}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${value}`}
                  disabled={disabled}
                  onPress={() => onChange(values.filter((v) => v !== value))}
                  style={{
                    minWidth: touchTarget.minimum,
                    minHeight: touchTarget.minimum,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ ...textStyle.h2, color: color.alum }}>×</Text>
                </Pressable>
              </View>
              <OnFlowDivider />
            </Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}
