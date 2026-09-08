import { Pressable, Text, View } from "react-native";
import { color, dynamicTypeMaxScale, space, textStyle } from "../tokens";
import { OnFlowMeta } from "./OnFlowMeta";

/**
 * The trick slate: the strongest element on any screen it appears on.
 * Trick name in display type, modifiers as a meta line, attempt number in
 * mono volt. The same three lines follow a clip from Session through
 * Capture, Review and Result so the identity never has to be re-read.
 */
export function TrickSlate({
  name,
  modifiers = [],
  attempt,
  muted = false,
  onPress,
  accessibilityHint,
}: {
  name: string;
  modifiers?: ReadonlyArray<string | null | undefined | false>;
  /** Next attempt number. Null hides the line. */
  attempt?: number | null;
  /** For the "no trick yet" state. */
  muted?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  const content = (
    <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md, gap: space.xs }}>
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
        maxFontSizeMultiplier={dynamicTypeMaxScale.display}
        style={{ ...textStyle.slate, color: muted ? color.textTertiary : color.textPrimary }}
      >
        {name.toUpperCase()}
      </Text>
      <OnFlowMeta items={modifiers} tone={muted ? "tertiary" : "secondary"} />
      {attempt != null ? (
        <Text
          accessibilityLabel={`Attempt ${attempt}`}
          style={{ ...textStyle.monoLg, color: color.neon, marginTop: space.xs }}
        >
          ATTEMPT {String(attempt).padStart(2, "0")}
        </Text>
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={muted ? name : `${name}, change trick`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: pressed ? color.surfaceAlt : "transparent" })}
    >
      {content}
    </Pressable>
  );
}
