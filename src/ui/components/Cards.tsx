import { Pressable, Text, View } from "react-native";
import type { CatalogTrick, SkateSession } from "../../domain/models";
import { color, radius, space, textStyle, touchTarget } from "../tokens";
import { FootageFrame } from "./Footage";

export function TrickCard({
  trick,
  selected = false,
  onPress,
}: {
  trick: CatalogTrick;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={trick.name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: touchTarget.minimum,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: selected ? color.neon : color.hairline,
        backgroundColor: selected ? color.surfaceAlt : color.surface,
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "stretch",
      }}
    >
      <View style={{ width: 6, backgroundColor: selected ? color.neon : color.hairlineHi }} />
      <View style={{ flex: 1, padding: space.lg, gap: 2 }}>
        <Text style={{ ...textStyle.bodyLg, color: color.textPrimary }}>{trick.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ ...textStyle.mono, color: color.textTertiary }}>{trick.category}</Text>
          <View style={{ flexDirection: "row", gap: 3 }} importantForAccessibility="no-hide-descendants">
            {Array.from({ length: 5 }, (_, index) => (
              <View
                key={index}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    index < trick.difficultyTier ? (selected ? color.neon : color.alum) : color.hairlineHi,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function SessionCard({
  session,
  onPress,
}: {
  session: SkateSession;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={session.focusTrick ?? "Session"}
      onPress={onPress}
      style={{
        minHeight: touchTarget.minimum,
        padding: space.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: color.hairline,
        backgroundColor: color.surface,
        gap: space.sm,
      }}
    >
      <Text style={{ ...textStyle.label, color: color.neon }}>
        {session.endedAt ? "Ended" : "Open"}
      </Text>
      <Text style={{ ...textStyle.body, color: color.textPrimary }}>
        {session.focusTrick ?? "Free skate"}
      </Text>
      <Text style={{ ...textStyle.mono, color: color.textTertiary }}>{session.startedAt}</Text>
    </Pressable>
  );
}

/** @deprecated Use `FootageFrame`. Kept until Home moves off it in Phase 3. */
export function VideoThumbnail({
  uri,
  accessibilityLabel,
}: {
  uri: string | null;
  accessibilityLabel?: string;
}) {
  return <FootageFrame uri={uri} accessibilityLabel={accessibilityLabel} corner="xs" />;
}
