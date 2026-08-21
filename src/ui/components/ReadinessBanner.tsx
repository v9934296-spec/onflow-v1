import { Text, View } from "react-native";
import type { Readiness } from "../../domain/models";
import { color, radius, space, textStyle } from "../tokens";
import { readinessCopy } from "../copy";

/**
 * One analysis-level banner. No per-row EvidenceTag exists in launch (spec 9 option b).
 * Color is never the only indicator — the label is always present.
 */
export function ReadinessBanner({ readiness }: { readiness: Readiness }) {
  const copy = readinessCopy[readiness];
  const accent =
    readiness === "usable" ? color.neon : readiness === "limited" ? color.amber : color.alum;
  return (
    <View
      accessibilityRole="summary"
      style={{
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: accent,
        padding: space.lg,
        gap: space.sm,
        backgroundColor: color.surface,
      }}
    >
      <Text style={{ ...textStyle.label, color: accent }}>{copy.label}</Text>
      <Text style={{ ...textStyle.body, color: color.textPrimary }}>{copy.body}</Text>
    </View>
  );
}
