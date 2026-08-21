import { Text, View } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ErrorPanel } from "@/ui/components/States";
import { useState } from "react";

export default function PaywallScreen() {
  const [storeFailed] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xl, gap: space.lg, justifyContent: "center" }}>
      <Text style={{ ...textStyle.h1, color: color.textPrimary }}>PRO</Text>
      {storeFailed ? (
        <ErrorPanel kind="store_unavailable" />
      ) : null}
      <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>
        Prices come from the App Store. Restore Purchases stays available even when packages fail to load.
      </Text>
      <Button label="Restore purchases" variant="secondary" onPress={() => undefined} />
    </View>
  );
}
