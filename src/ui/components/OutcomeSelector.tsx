import { Pressable, Text, View } from "react-native";
import type { AttemptOutcome } from "../../domain/models";
import { color, radius, space, textStyle, touchTarget } from "../tokens";

export function OutcomeSelector({
  value,
  onChange,
}: {
  value: AttemptOutcome | null;
  onChange: (next: AttemptOutcome) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <Choice
        label="Landed"
        glyph="+"
        selected={value === "landed"}
        selectedColor={color.neon}
        onPress={() => onChange("landed")}
      />
      <Choice
        label="Missed"
        glyph="–"
        selected={value === "missed"}
        selectedColor={color.alum}
        onPress={() => onChange("missed")}
      />
    </View>
  );
}

function Choice({
  label,
  glyph,
  selected,
  selectedColor,
  onPress,
}: {
  label: string;
  glyph: string;
  selected: boolean;
  selectedColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: touchTarget.outcomeSelector,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: selected ? selectedColor : color.hairline,
        backgroundColor: color.surface,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <Text style={{ ...textStyle.h2, color: selected ? selectedColor : color.textSecondary }}>
        {glyph}
      </Text>
      <Text style={{ ...textStyle.label, color: color.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
