import { Pressable, Text, View } from "react-native";
import { border, color, space, textStyle, touchTarget } from "../tokens";

/**
 * A row of hard-edged segments for a short, fixed vocabulary — stance,
 * direction. Not pills: a pill is a tag, and these are a choice.
 *
 * Tapping the selected segment clears it, because these modifiers are
 * optional and a skater who taps one by mistake needs a way back to nothing.
 */
export function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (next: T | null) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: "row",
        borderWidth: border.hairline,
        borderColor: color.hairline,
      }}
    >
      {options.map((option, index) => {
        const selected = value === option;
        return (
          <View key={option} style={{ flex: 1, flexDirection: "row" }}>
            {index > 0 ? (
              <View style={{ width: border.hairline, backgroundColor: color.hairline }} />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : option)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: touchTarget.minimum,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: space.xs,
                backgroundColor: selected
                  ? color.neon
                  : pressed
                    ? color.surfaceAlt
                    : "transparent",
              })}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{
                  ...textStyle.meta,
                  color: selected ? color.bg : color.textSecondary,
                  textTransform: "uppercase",
                }}
              >
                {option}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
