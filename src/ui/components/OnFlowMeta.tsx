import { Text, View, type TextStyle } from "react-native";
import { color, textStyle } from "../tokens";

type Tone = "primary" | "secondary" | "tertiary" | "neon" | "alum" | "amber" | "red";

const toneColor: Record<Tone, string> = {
  primary: color.textPrimary,
  secondary: color.textSecondary,
  tertiary: color.textTertiary,
  neon: color.neon,
  alum: color.alum,
  amber: color.amber,
  red: color.red,
};

/**
 * The technical line under a slate or beside a row:
 * `REGULAR · ATTEMPT 07 · 00:18`. Empty items are dropped, not rendered as
 * gaps. Renders as one accessible string with commas so VoiceOver reads a
 * list, not a series of dots.
 */
export function OnFlowMeta({
  items,
  font = "meta",
  tone = "secondary",
  style,
}: {
  items: ReadonlyArray<string | null | undefined | false>;
  font?: "meta" | "mono" | "monoLg";
  tone?: Tone;
  style?: TextStyle;
}) {
  const parts = items.filter((item): item is string => typeof item === "string" && item.length > 0);
  if (parts.length === 0) return null;
  const upper = font === "meta";
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={parts.join(", ")}
      style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}
    >
      {parts.map((part, index) => (
        <Text
          key={`${index}-${part}`}
          importantForAccessibility="no"
          style={{
            ...textStyle[font],
            color: toneColor[tone],
            textTransform: upper ? "uppercase" : "none",
            ...style,
          }}
        >
          {index > 0 ? " · " : ""}
          {part}
        </Text>
      ))}
    </View>
  );
}

/**
 * A state word with a leading glyph so the state is never color-only:
 * `● LANDED`, `○ QUEUED`, `× MISSED`.
 */
export function MetaTag({
  label,
  glyph = "●",
  tone = "secondary",
}: {
  label: string;
  glyph?: string;
  tone?: Tone;
}) {
  return (
    <Text
      accessibilityRole="text"
      style={{ ...textStyle.meta, color: toneColor[tone], textTransform: "uppercase" }}
    >
      {glyph} {label}
    </Text>
  );
}
