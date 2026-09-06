import { Pressable, Text, View } from "react-native";
import { color, radius, space, textStyle, touchTarget } from "../tokens";
import { AsphaltBackdrop } from "./AsphaltSurface";

export function EngineTeaser({
  onPress,
  phase,
}: {
  onPress: () => void;
  phase?: string | null;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={phase ? `P.T.E. engine, ${phase}` : "P.T.E. engine"}
      onPress={onPress}
      style={{
        minHeight: touchTarget.minimum,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: color.hairline,
        backgroundColor: color.surface,
        overflow: "hidden",
      }}
    >
      <AsphaltBackdrop opacity={0.6} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.lg,
          paddingHorizontal: space.lg,
          paddingVertical: space.lg,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(0,255,166,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.neon }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...textStyle.h2, color: color.textPrimary }}>P.T.E. ENGINE</Text>
          <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>
            {phase ? phase : "You call it. The engine reads it."}
          </Text>
        </View>
        <Text style={{ ...textStyle.label, color: color.neon }}>Open</Text>
      </View>
    </Pressable>
  );
}
