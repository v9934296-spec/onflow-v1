import { Text } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ErrorPanel } from "@/ui/components/States";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useState } from "react";

export default function PaywallScreen() {
  const [storeFailed] = useState(true);
  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.lg, justifyContent: "center" }}>
      <ScreenHeader kicker="Subscription" title="PRO" />
      {storeFailed ? (
        <ErrorPanel kind="store_unavailable" />
      ) : null}
      <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>
        Prices come from the App Store. Restore Purchases stays available even when packages fail to load.
      </Text>
      <Button label="Restore purchases" variant="secondary" onPress={() => undefined} />
    </ScreenSafeArea>
  );
}
