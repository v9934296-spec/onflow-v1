import { Text, View } from "react-native";
import type { MechanicsRow } from "../../domain/models";
import { color, textStyle } from "../tokens";

/**
 * Renders a server mechanics row as prose. No EvidenceTag. Empty fields are
 * omitted — never "not assessed" or a client-assigned status.
 */
export function FeedbackRow({ row }: { row: MechanicsRow }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ ...textStyle.label, color: color.textPrimary }}>{row.name}</Text>
      {row.score != null ? (
        <Text style={{ ...textStyle.mono, color: color.alum }}>{row.score}</Text>
      ) : null}
      {row.assessment ? (
        <Text style={{ ...textStyle.body, color: color.textSecondary }}>{row.assessment}</Text>
      ) : null}
      {row.evidence ? (
        <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>{row.evidence}</Text>
      ) : null}
    </View>
  );
}
