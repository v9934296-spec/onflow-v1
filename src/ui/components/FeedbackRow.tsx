import { Text, View } from "react-native";
import type { MechanicsRow } from "../../domain/models";
import { color, space, textStyle, touchTarget } from "../tokens";

/**
 * One mechanics dimension as a two-column row: what was looked at on the
 * left, what the server said about it on the right.
 *
 *     POP          GOOD
 *     CATCH        BACK FOOT LOW
 *
 * Renders a server row as prose. No EvidenceTag. Empty fields are omitted —
 * never "not assessed" and never a client-assigned status. Takes the domain
 * object, not loose primitives (spec §10.5).
 */
export function FeedbackRow({ row }: { row: MechanicsRow }) {
  const spoken = [row.name, row.assessment, row.evidence].filter(Boolean).join(", ");
  return (
    <View
      accessibilityLabel={spoken}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        minHeight: touchTarget.minimum,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        gap: space.lg,
      }}
    >
      <Text
        importantForAccessibility="no"
        style={{ ...textStyle.meta, color: color.textTertiary, width: 96, textTransform: "uppercase" }}
      >
        {row.name}
      </Text>
      <View style={{ flex: 1, gap: 2 }}>
        {row.assessment ? (
          <Text importantForAccessibility="no" style={{ ...textStyle.bodyLg, color: color.textPrimary }}>
            {row.assessment}
          </Text>
        ) : null}
        {row.evidence ? (
          <Text importantForAccessibility="no" style={{ ...textStyle.bodySm, color: color.textSecondary }}>
            {row.evidence}
          </Text>
        ) : null}
      </View>
      {row.score != null ? (
        <Text importantForAccessibility="no" style={{ ...textStyle.monoLg, color: color.alum }}>
          {row.score}
        </Text>
      ) : null}
    </View>
  );
}
