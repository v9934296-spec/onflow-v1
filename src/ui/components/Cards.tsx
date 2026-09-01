import { Image, Pressable, Text, View } from "react-native";
import type { CatalogTrick, SkateSession } from "../../domain/models";
import { color, radius, space, textStyle, touchTarget } from "../tokens";

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
        padding: space.lg,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: selected ? color.neon : color.hairline,
        backgroundColor: selected ? color.surfaceAlt : color.surface,
      }}
    >
      <Text style={{ ...textStyle.bodyLg, color: color.textPrimary }}>{trick.name}</Text>
      <Text style={{ ...textStyle.mono, color: color.textTertiary }}>{trick.category}</Text>
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

/** Missing media renders as nothing — never a fake frame (spec 10.4). */
export function VideoThumbnail({
  uri,
  accessibilityLabel,
}: {
  uri: string | null;
  accessibilityLabel?: string;
}) {
  if (!uri) return null;
  return (
    <View
      style={{
        aspectRatio: 16 / 9,
        borderRadius: radius.md,
        overflow: "hidden",
        backgroundColor: color.surface,
      }}
    >
      <Image
        accessibilityLabel={accessibilityLabel}
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );
}
