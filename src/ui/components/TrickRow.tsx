import { Pressable, Text, View } from "react-native";
import type { CatalogTrick } from "../../domain/models";
import { border, color, space, textStyle, touchTarget } from "../tokens";
import { OnFlowMeta } from "./OnFlowMeta";

/**
 * A trick in a list: the name in display type, its category and how often it
 * has been called as quiet metadata. A row divided by hairlines, not a card —
 * the name is the thing, and a scanning skater reads names, not containers.
 *
 * Selection is a volt rule down the left plus a filled marker, so it survives
 * both sunlight and color blindness.
 */
export function TrickRow({
  trick,
  selected = false,
  uses = 0,
  onPress,
}: {
  trick: CatalogTrick;
  selected?: boolean;
  /** Times called. Shown from 2 up; once is recent, not a habit. */
  uses?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={trick.name}
      accessibilityHint={uses >= 2 ? `Called ${uses} times` : undefined}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        minHeight: touchTarget.minimum + space.sm,
        backgroundColor: selected ? color.surfaceAlt : pressed ? color.surface : "transparent",
      })}
    >
      <View
        style={{
          width: border.rule * 2,
          alignSelf: "stretch",
          backgroundColor: selected ? color.neon : "transparent",
        }}
      />
      <Text
        numberOfLines={1}
        style={{
          ...textStyle.slateSm,
          color: selected ? color.textPrimary : color.textSecondary,
          flex: 1,
          paddingLeft: space.lg - border.rule * 2,
        }}
      >
        {trick.name.toUpperCase()}
      </Text>
      <View style={{ paddingRight: space.lg, alignItems: "flex-end" }}>
        <OnFlowMeta
          items={[trick.category, uses >= 2 ? `${uses}×` : null]}
          tone={selected ? "neon" : "tertiary"}
        />
      </View>
    </Pressable>
  );
}
