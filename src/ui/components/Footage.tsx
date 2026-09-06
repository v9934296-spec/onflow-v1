import { Image, Text, View } from "react-native";
import { color, radius, space, textStyle } from "../tokens";

/**
 * Media treatment. Footage is the hero: it sits edge-to-edge, letterboxed
 * rather than cropped, with no card chrome around it. Missing media renders
 * as nothing — never a fake frame (spec 10.4).
 */
export function FootageFrame({
  uri,
  accessibilityLabel,
  corner = "none",
}: {
  uri: string | null;
  accessibilityLabel?: string;
  corner?: "none" | "xs";
}) {
  if (!uri) return null;
  return (
    <View
      style={{
        aspectRatio: 16 / 9,
        width: "100%",
        borderRadius: radius[corner],
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

/**
 * One cell of a contact sheet. Square, cropped, with an optional mono mark
 * (`#08`, `00:18`) on a small scrim. Used in strips and archives where many
 * clips sit side by side; never mounts a video player.
 */
export function FootageThumbnail({
  uri,
  size = 72,
  mark,
  accessibilityLabel,
}: {
  uri: string | null;
  size?: number;
  mark?: string;
  accessibilityLabel?: string;
}) {
  if (!uri) return null;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        width: size,
        height: size,
        borderRadius: radius.xs,
        overflow: "hidden",
        backgroundColor: color.surface,
      }}
    >
      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      {mark ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: space.xs,
            paddingVertical: 2,
            backgroundColor: "rgba(8,8,8,0.72)",
          }}
        >
          <Text style={{ ...textStyle.mono, color: color.textPrimary }} numberOfLines={1}>
            {mark}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
