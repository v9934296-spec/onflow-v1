import { Text, View } from "react-native";
import { color, radius, space, textStyle } from "../tokens";

/**
 * Determinate only from observed upload bytes. `fraction` null means we do not
 * know — show the named phase, never a guessed percent.
 */
export function UploadProgress({
  fraction,
}: {
  fraction: number | null;
}) {
  if (fraction == null) {
    return (
      <Text style={{ ...textStyle.body, color: color.textSecondary }}>Uploading…</Text>
    );
  }
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View style={{ gap: space.sm }}>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
        style={{
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: color.surfaceAlt,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: color.neon,
          }}
        />
      </View>
      <Text style={{ ...textStyle.mono, color: color.alum }}>{pct}% uploaded</Text>
    </View>
  );
}
