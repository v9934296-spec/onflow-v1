import { Pressable, Text, View } from "react-native";
import type { AttemptOutcome } from "../../domain/models";
import { border, color, space, textStyle, touchTarget } from "../tokens";
import { outcomeCopy } from "../copy";

/**
 * The skater's call, and the most important control on the Result screen.
 * Two choices because the record has two values — the engine's read never
 * overrides it (truth rule 6).
 *
 * Each choice carries glyph and word as well as color, so the selection is
 * never communicated by color alone (guardrails 12).
 */
export function OutcomeSelector({
  value,
  onChange,
}: {
  value: AttemptOutcome | null;
  onChange: (next: AttemptOutcome) => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      <Choice
        outcome="landed"
        selected={value === "landed"}
        selectedColor={color.neon}
        onPress={() => onChange("landed")}
      />
      <View style={{ width: border.hairline, backgroundColor: color.hairline }} />
      <Choice
        outcome="missed"
        selected={value === "missed"}
        selectedColor={color.alum}
        onPress={() => onChange("missed")}
      />
    </View>
  );
}

function Choice({
  outcome,
  selected,
  selectedColor,
  onPress,
}: {
  outcome: AttemptOutcome;
  selected: boolean;
  selectedColor: string;
  onPress: () => void;
}) {
  const copy = outcomeCopy[outcome];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: touchTarget.outcomeSelector + space.md,
        alignItems: "center",
        justifyContent: "center",
        gap: space.xs,
        backgroundColor: selected ? color.surfaceAlt : pressed ? color.surface : "transparent",
        borderBottomWidth: border.rule * 2,
        borderBottomColor: selected ? selectedColor : "transparent",
      })}
    >
      <Text style={{ ...textStyle.h2, color: selected ? selectedColor : color.textTertiary }}>
        {copy.glyph}
      </Text>
      <Text
        style={{
          ...textStyle.h2,
          color: selected ? color.textPrimary : color.textSecondary,
        }}
      >
        {copy.label.toUpperCase()}
      </Text>
    </Pressable>
  );
}
