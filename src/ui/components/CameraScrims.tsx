import { View } from "react-native";
import { scrim } from "../tokens";

/**
 * Readable top/bottom fades over live camera. Pointer-events none so the feed
 * and controls stay interactive. Not a texture — never covers the mid frame.
 */
export function CameraScrims() {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <View style={{ height: 168 }}>
        <View style={{ flex: 3, backgroundColor: scrim.top }} />
        <View style={{ flex: 2, backgroundColor: "rgba(10,10,11,0.42)" }} />
        <View style={{ flex: 2, backgroundColor: "rgba(10,10,11,0.18)" }} />
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ height: 228 }}>
        <View style={{ flex: 2, backgroundColor: "rgba(10,10,11,0.22)" }} />
        <View style={{ flex: 2, backgroundColor: "rgba(10,10,11,0.52)" }} />
        <View style={{ flex: 3, backgroundColor: scrim.bottom }} />
      </View>
    </View>
  );
}
