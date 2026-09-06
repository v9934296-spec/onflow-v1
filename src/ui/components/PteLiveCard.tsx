import { Text, View } from "react-native";
import { color, radius, space, textStyle } from "../tokens";
import { EngineCore } from "./Marks";
import type { AnalyzingStage } from "./StageList";

/**
 * Shared live P.T.E. chrome. Phase is a named outbox/job state, never a
 * fabricated percent. Rings do not live here — they only render from returned scores.
 */
export function PteLiveCard({
  trickLabel,
  phase,
  active,
}: {
  trickLabel: string | null;
  phase: AnalyzingStage | null;
  active: boolean;
}) {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={[
        "P.T.E.",
        trickLabel ?? "No trick called",
        phase ?? "Idle, no job",
      ].join(". ")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.hairline,
        backgroundColor: "rgba(26,26,26,0.8)",
        padding: space.lg,
      }}
    >
      <EngineCore active={active} size={80} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            ...textStyle.label,
            fontSize: 11,
            letterSpacing: 1.6,
            color: color.neon,
            textTransform: "uppercase",
          }}
        >
          P.T.E.
        </Text>
        <Text style={{ ...textStyle.h2, color: color.textPrimary, marginTop: 4 }}>
          {trickLabel ?? "No trick called"}
        </Text>
        <Text
          style={{
            ...textStyle.mono,
            marginTop: space.sm,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: color.alum,
          }}
        >
          {phase ?? "Idle — no job"}
        </Text>
      </View>
    </View>
  );
}
