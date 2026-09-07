import { Text, View } from "react-native";
import { color, space, textStyle } from "../tokens";
import { OnFlowMeta } from "./OnFlowMeta";

/**
 * The read: what actually happened on this attempt, in plain language.
 *
 * This is the top of the Result screen's hierarchy — not a score, and not the
 * fact that a model produced it. Every field is server-provided; anything
 * absent is omitted rather than filled in.
 */
export function AttemptRead({
  headline,
  summary,
  cue,
}: {
  /** `primary_issue_label` — the one-line finding. */
  headline: string | null;
  /** `review_summary` — the prose read. */
  summary: string | null;
  /** `best_cue` — the single thing to work on. */
  cue: string | null;
}) {
  if (!headline && !summary && !cue) return null;
  return (
    <View style={{ gap: space.md }}>
      {headline || summary ? (
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          <OnFlowMeta items={["Read"]} tone="tertiary" />
          {headline ? (
            <Text style={{ ...textStyle.h2, color: color.textPrimary }}>{headline}</Text>
          ) : null}
          {summary ? (
            <Text style={{ ...textStyle.bodyLg, color: color.textSecondary }}>{summary}</Text>
          ) : null}
        </View>
      ) : null}
      {cue ? (
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          <OnFlowMeta items={["Work on"]} tone="neon" />
          <Text style={{ ...textStyle.bodyLg, color: color.textPrimary }}>{cue}</Text>
        </View>
      ) : null}
    </View>
  );
}
