import { Fragment } from "react";
import { Pressable, Text, View } from "react-native";
import { border, color, space, textStyle, touchTarget } from "../tokens";
import { OnFlowDivider } from "./OnFlowDivider";
import { OnFlowButton } from "./OnFlowButton";
import { MetaTag } from "./OnFlowMeta";

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly detail?: string;
}

/**
 * Full-bleed rows divided by hairlines. Selection is a volt rule on the left
 * plus a glyph on the right, so the state is never color-only. With
 * `onSetPrimary`, a selected row can be promoted; the primary row carries a
 * `PRIMARY` tag instead of the button.
 */
export function OptionList<T extends string>({
  options,
  selected,
  onToggle,
  primary,
  onSetPrimary,
}: {
  options: readonly Option<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  primary?: T | null;
  onSetPrimary?: (value: T) => void;
}) {
  return (
    <View>
      <OnFlowDivider />
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const isPrimary = primary === option.value;
        return (
          <Fragment key={option.value}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.detail}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => ({
                minHeight: touchTarget.outcomeSelector,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: pressed ? color.surfaceAlt : "transparent",
              })}
            >
              <View
                style={{
                  width: border.rule * 2,
                  alignSelf: "stretch",
                  backgroundColor: isSelected ? color.neon : "transparent",
                }}
              />
              <View style={{ flex: 1, paddingVertical: space.md, paddingLeft: space.lg - border.rule * 2, gap: 2 }}>
                <Text style={{ ...textStyle.h2, color: isSelected ? color.textPrimary : color.textSecondary }}>
                  {option.label}
                </Text>
                {option.detail ? (
                  <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>{option.detail}</Text>
                ) : null}
              </View>
              <View style={{ paddingRight: space.lg, alignItems: "flex-end", gap: space.xs }}>
                <Text
                  importantForAccessibility="no"
                  style={{ ...textStyle.meta, color: isSelected ? color.neon : color.textTertiary }}
                >
                  {isSelected ? "●" : "○"}
                </Text>
                {onSetPrimary && isSelected ? (
                  isPrimary ? (
                    <MetaTag label="Primary" glyph="★" tone="neon" />
                  ) : (
                    <OnFlowButton
                      label="Primary"
                      size="compact"
                      variant="ghost"
                      onPress={() => onSetPrimary(option.value)}
                    />
                  )
                ) : null}
              </View>
            </Pressable>
            <OnFlowDivider />
          </Fragment>
        );
      })}
    </View>
  );
}
