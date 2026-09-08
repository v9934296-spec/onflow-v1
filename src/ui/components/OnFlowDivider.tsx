import { View } from "react-native";
import { border, color } from "../tokens";

/**
 * Structure through rules, not containers. `hairline` separates rows;
 * `rule` closes a section. `inset` keeps a rule aligned with text while the
 * screen surface stays edge-to-edge.
 */
export function OnFlowDivider({
  weight = "hairline",
  inset = 0,
  tone = "hairline",
}: {
  weight?: "hairline" | "rule";
  inset?: number;
  tone?: "hairline" | "hairlineHi" | "neon" | "alum";
}) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{
        height: border[weight],
        marginHorizontal: inset,
        backgroundColor: color[tone],
      }}
    />
  );
}
