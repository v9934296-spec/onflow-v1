import { ScrollView, Text, View } from "react-native";
import { color, radius, space, textStyle } from "@/ui/tokens";
import { EmptyState, OfflineBadge, QueuedBadge, Skeleton } from "@/ui/components/States";
import { Button } from "@/ui/components/Button";
import { SessionCard, TrickCard, VideoThumbnail } from "@/ui/components/Cards";
import { DeckMark, RailMark, ScreenHero, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useSessionStore } from "@/store/sessionStore";
import { startFreeSkateSession } from "@/store/sessionActions";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { isApiConfigured, isOffline } from "@/store/net";
import { kv, kvKeys } from "@/store/kv";
import { useAuthStore } from "@/store/authStore";
import { listOutboxForUser, listRecoverable } from "@/store/outbox";
import { loadTrickCatalog, readRecentTrickIds } from "@/store/tricks";
import type { CatalogTrick, OutboxRow } from "@/domain/models";

export default function HomeScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  const hydrating = useSessionStore((s) => s.hydrating);
  const userId = useAuthStore((s) => s.userId);
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);
  const [latest, setLatest] = useState<OutboxRow | null>(null);
  const [recentTricks, setRecentTricks] = useState<CatalogTrick[]>([]);

  useEffect(() => {
    setOffline(!isApiConfigured() || isOffline());
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void (async () => {
        const recoverable = await listRecoverable(userId);
        setQueued(recoverable.length);
        const all = await listOutboxForUser(userId);
        setLatest(all.at(-1) ?? null);
        const catalog = await loadTrickCatalog();
        if (!catalog.ok) return;
        const ids = readRecentTrickIds();
        setRecentTricks(
          ids
            .map((id) => catalog.data.find((t) => t.trickId === id))
            .filter((t): t is CatalogTrick => t != null)
            .slice(0, 3),
        );
      })();
    }, [userId]),
  );

  if (hydrating) {
    return (
      <ScreenSafeArea style={{ padding: space.xl }}>
        <Skeleton height={42} />
        <Skeleton height={80} />
      </ScreenSafeArea>
    );
  }

  const returning = Boolean(kv.get(kvKeys.onboardingDone) || latest);
  const cards: ReactNode[] = [];

  if (session) {
    cards.push(
      <View key="continue" style={{ gap: space.md }}>
        <Text style={{ ...textStyle.h2, color: color.neon }}>Continue</Text>
        <SessionCard session={session} onPress={() => router.push(trick ? "/capture" : "/trick")} />
        <Button label={trick ? "Film" : "Choose trick"} onPress={() => router.push(trick ? "/capture" : "/trick")} />
      </View>,
    );
  } else {
    cards.push(
      <View
        key="start"
        style={{
          gap: space.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.hairline,
          backgroundColor: color.surface,
          overflow: "hidden",
        }}
      >
        <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", opacity: 0.8 }}>
          <RailMark />
        </View>
        <EmptyState title="Start a session" body="Free skate. No mode screen. One tap to begin." />
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg }}>
          <Button
            label="Start session"
            onPress={() => {
              kv.set(kvKeys.onboardingDone, "1");
              void startFreeSkateSession().then((res) => {
                if (res.ok) router.push("/trick");
              });
            }}
          />
        </View>
      </View>,
    );
  }

  if (recentTricks.length > 0) {
    cards.push(
      <View key="recent" style={{ gap: space.sm }}>
        <Text style={{ ...textStyle.label, color: color.textSecondary }}>Recent tricks</Text>
        {recentTricks.map((item) => (
          <TrickCard
            key={item.trickId}
            trick={item}
            selected={trick?.trickId === item.trickId}
            onPress={() => router.push("/trick")}
          />
        ))}
      </View>,
    );
  }

  if (latest) {
    cards.push(
      <View key="latest" style={{ gap: space.sm }}>
        <Text style={{ ...textStyle.label, color: color.textSecondary }}>Latest clip</Text>
        <QueuedBadge count={queued} />
        {returning ? <VideoThumbnail uri={stillFrameUri(latest.localUri)} /> : null}
        <Text style={{ ...textStyle.mono, color: color.alum }}>{latest.state.toUpperCase()}</Text>
      </View>,
    );
  }

  return (
    <ScreenSafeArea>
      <ScrollView
        style={{ flex: 1, backgroundColor: color.bg }}
        contentContainerStyle={{ padding: space.xl, gap: space.lg }}
      >
        {offline ? <OfflineBadge queued={queued} /> : null}
        <ScreenHero kicker="Skate" title="ONFLOW">
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>
            {returning
              ? trick
                ? `Ready to film ${trick.canonicalName}.`
                : "Film an attempt. Get an honest read. Record what actually happened."
              : "Film an attempt. Get an honest read. Record what actually happened. Try again."}
          </Text>
          <View style={{ height: 56, marginTop: space.sm }}>
            <DeckMark />
          </View>
        </ScreenHero>
        {cards.slice(0, 4)}
      </ScrollView>
    </ScreenSafeArea>
  );
}

function stillFrameUri(uri: string): string | null {
  const path = uri.split("?")[0]?.toLowerCase() ?? "";
  if (
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".webp")
  ) {
    return uri;
  }
  return null;
}
