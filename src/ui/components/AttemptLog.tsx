import { Text, View } from "react-native";
import type { AttemptOutcome } from "../../domain/models";
import type { TrickTally } from "../../domain/attempts";
import { border, color, space, textStyle, touchTarget } from "../tokens";
import { MetaTag, OnFlowMeta } from "./OnFlowMeta";

/** One trick's tally this session: `KICKFLIP   7 ATTEMPTS · 3 LANDED`. */
export function TrickTallyRow({ tally, active = false }: { tally: TrickTally; active?: boolean }) {
  return (
    <View
      accessibilityLabel={`${tally.canonicalName}, ${tally.attempts} attempts, ${tally.landed} landed`}
      style={{ flexDirection: "row", alignItems: "center", minHeight: touchTarget.minimum }}
    >
      <View
        style={{
          width: border.rule * 2,
          alignSelf: "stretch",
          backgroundColor: active ? color.neon : "transparent",
        }}
      />
      <Text
        numberOfLines={1}
        style={{
          ...textStyle.h2,
          color: active ? color.textPrimary : color.textSecondary,
          flex: 1,
          paddingLeft: space.lg - border.rule * 2,
        }}
      >
        {tally.canonicalName.toUpperCase()}
      </Text>
      <View style={{ paddingRight: space.lg }}>
        <OnFlowMeta
          items={[`${tally.attempts} ${tally.attempts === 1 ? "attempt" : "attempts"}`, `${tally.landed} landed`]}
          tone={active ? "primary" : "secondary"}
        />
      </View>
    </View>
  );
}

/** One log line: `#07  ● LANDED  14:02  KICKFLIP`. Queued rows say so. */
export function AttemptLogRow({
  number,
  outcome,
  time,
  trick,
  queued = false,
}: {
  number: number;
  outcome: AttemptOutcome;
  time: string;
  trick: string;
  queued?: boolean;
}) {
  const landed = outcome === "landed";
  return (
    <View
      accessibilityLabel={`Attempt ${number}, ${trick}, ${landed ? "landed" : "missed"}${queued ? ", queued" : ""}, ${time}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: touchTarget.minimum,
        paddingHorizontal: space.lg,
        gap: space.md,
      }}
    >
      <Text style={{ ...textStyle.monoLg, color: color.alum, width: 40 }}>#{String(number).padStart(2, "0")}</Text>
      <View style={{ width: 88 }}>
        <MetaTag label={landed ? "Landed" : "Missed"} glyph={landed ? "●" : "×"} tone={landed ? "neon" : "alum"} />
      </View>
      <Text style={{ ...textStyle.mono, color: color.textTertiary, width: 44 }}>{queued ? "QUEUED" : time}</Text>
      <Text numberOfLines={1} style={{ ...textStyle.meta, color: color.textSecondary, flex: 1, textTransform: "uppercase" }}>
        {trick}
      </Text>
    </View>
  );
}
