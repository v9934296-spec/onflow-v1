import { Text, View } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { listOutboxForUser } from "@/store/outbox";
import { useEffect, useState } from "react";

export default function ProfileScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const signOut = useAuthStore((s) => s.signOut);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    if (!userId) return;
    void listOutboxForUser(userId).then((rows) => {
      setQueued(rows.filter((r) => r.state !== "ready" && r.state !== "cancelled").length);
    });
  }, [userId]);

  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.lg }}>
      <ScreenHeader kicker="Account" title="PROFILE" />
      <Text style={{ ...textStyle.mono, color: color.textTertiary }}>{userId}</Text>
      <Button label="Subscription" onPress={() => router.push("/paywall")} />
      <View style={{ marginTop: space.xxl, gap: space.md }}>
        <Text style={{ ...textStyle.label, color: color.red }}>Destructive</Text>
        <Button
          label="Sign out"
          variant="destructive"
          onPress={() => {
            void signOut();
          }}
        />
        <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>
          {queued > 0
            ? `${queued} queued clip(s) stay sealed to this account for 30 days. Another account cannot see or upload them.`
            : "No queued clips on this account."}
        </Text>
      </View>
    </ScreenSafeArea>
  );
}
