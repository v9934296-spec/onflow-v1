import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { color, dynamicTypeMaxScale, space, textStyle } from "../tokens";
import { OnFlowDivider } from "./OnFlowDivider";
import { OnFlowMeta } from "./OnFlowMeta";

/**
 * Edge-to-edge masthead. Title in display type, a technical meta line, and a
 * rule beneath. No container, no radius, no background — the screen surface
 * is the surface. `right` takes a single compact action.
 */
export function OnFlowHeader({
  title,
  meta,
  right,
  size = "h1",
  rule = true,
}: {
  title: string;
  meta?: ReadonlyArray<string | null | undefined | false>;
  right?: ReactNode;
  size?: "hero" | "h1";
  rule?: boolean;
}) {
  return (
    <View>
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: space.sm,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: space.md,
        }}
      >
        <View style={{ flex: 1, gap: space.xs }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={dynamicTypeMaxScale.display}
            style={{ ...textStyle[size], color: color.textPrimary }}
          >
            {title}
          </Text>
          {meta ? <OnFlowMeta items={meta} /> : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
      {rule ? <OnFlowDivider /> : null}
    </View>
  );
}
