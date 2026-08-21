import { ScrollView, Text, View } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { EmptyState, OfflineBadge, Skeleton } from "@/ui/components/States";
import { Button } from "@/ui/components/Button";
import { useSessionStore } from "@/store/sessionStore";
import { startFreeSkateSession } from "@/store/sessionActions";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { isApiConfigured } from "@/store/net";

export default function HomeScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  const hydrating = useSessionStore((s) => s.hydrating);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!isApiConfigured());
  }, []);

  if (hydrating) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xl }}>
        <Skeleton height={42} />
        <Skeleton height={80} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: space.xl, gap: space.lg }}>
      {offline ? <OfflineBadge queued={0} /> : null}
      <Text style={{ ...textStyle.hero, color: color.textPrimary }}>ONFLOW</Text>
      <Text style={{ ...textStyle.body, color: color.textSecondary }}>
        Film an attempt. Get an honest read. Record what actually happened. Try again.
      </Text>
      {session ? (
        <View style={{ gap: space.md }}>
          <Text style={{ ...textStyle.h2, color: color.neon }}>Continue</Text>
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>
            {trick ? `Trick: ${trick.canonicalName}` : "Choose a trick to film."}
          </Text>
          <Button label={trick ? "Film" : "Choose trick"} onPress={() => router.push(trick ? "/capture" : "/trick")} />
        </View>
      ) : (
        <EmptyState title="Start a session" body="Free skate. No mode screen. One tap to begin." />
      )}
      {!session ? (
        <Button
          label="Start session"
          onPress={() => {
            void startFreeSkateSession().then((res) => {
              if (res.ok) router.push("/trick");
            });
          }}
        />
      ) : null}
    </ScrollView>
  );
}
