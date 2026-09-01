import { Text, View } from "react-native";
import { color, space, textStyle } from "../tokens";

export type AnalyzingStage = "UPLOADING" | "QUEUED" | "REVIEWING CLIP" | "READY" | "FAILED";

const STAGES: readonly AnalyzingStage[] = [
  "UPLOADING",
  "QUEUED",
  "REVIEWING CLIP",
  "READY",
];

/** Named phases from real state only. No fake checkmarks, no percentage here. */
export function StageList({
  phase,
}: {
  phase: AnalyzingStage;
}) {
  if (phase === "FAILED") {
    return (
      <Text style={{ ...textStyle.label, color: color.red }} accessibilityRole="text">
        FAILED
      </Text>
    );
  }
  return (
    <View style={{ gap: space.sm }}>
      {STAGES.map((stage) => {
        const current = stage === phase;
        return (
          <Text
            key={stage}
            style={{
              ...textStyle.mono,
              color: current ? color.neon : color.textTertiary,
            }}
          >
            {current ? "● " : "○ "}
            {stage}
          </Text>
        );
      })}
    </View>
  );
}
