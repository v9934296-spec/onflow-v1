import { ScrollView, Text, View } from "react-native";
import { color, radius, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ScreenHero, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { EngineCore, TickRuler } from "@/ui/components/Marks";
import { useSessionStore } from "@/store/sessionStore";
import { closeSession } from "@/store/sessionActions";
import { useAuthStore } from "@/store/authStore";
import { listOutboxForUser, listRecoverable } from "@/store/outbox";
import { formatTrickLabel } from "@/domain/tricks";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

export default function FlowScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  const userId = useAuthStore((s) => s.userId);
  const [queued, setQueued] = useState(0);
  const [hasClip, setHasClip] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void (async () => {
        const recoverable = await listRecoverable(userId);
        const all = await listOutboxForUser(userId);
        setQueued(recoverable.length);
        setHasClip(all.length > 0);
        setHasRead(all.some((row) => row.state === "ready"));
      })();
    }, [userId]),
  );

  const nodes = [
    { label: "Session", on: session != null },
    { label: "Trick", on: trick != null },
    { label: "Clip", on: queued > 0 || hasClip },
    { label: "Read", on: hasRead },
  ];

  return (
    <ScreenSafeArea>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: space.xxl }}
      >
        <ScreenHero kicker="Session" title="FLOW">
          <Text style={{ ...textStyle.body, color: color.textSecondary, marginTop: space.sm }}>
            {session
              ? `Open${trick ? ` · ${formatTrickLabel(trick)}` : ""}.`
              : "No active session. Use START to begin a free skate."}
          </Text>
        </ScreenHero>

        <View
          style={{
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: color.hairline,
            backgroundColor: color.surface,
            paddingHorizontal: space.lg,
            paddingVertical: space.xl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.xl }}>
            <EngineCore active={session != null} size={64} />
            <Text style={{ ...textStyle.mono, textTransform: "uppercase", letterSpacing: 1, color: color.alum }}>
              {session ? "Live spine" : "Idle"}
            </Text>
          </View>
          {nodes.map((node, index) => (
            <View key={node.label} style={{ flexDirection: "row", gap: space.md }}>
              <View style={{ width: 20, alignItems: "center" }}>
                <View
                  style={{
                    marginTop: 4,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: node.on ? color.neon : color.hairlineHi,
                  }}
                />
                {index < nodes.length - 1 ? (
                  <View
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 28,
                      backgroundColor: node.on ? "rgba(0,255,166,0.4)" : color.hairline,
                    }}
                  />
                ) : null}
              </View>
              <View style={{ paddingBottom: space.xl }}>
                <Text style={{ ...textStyle.h2, fontSize: 20, lineHeight: 20, color: color.textPrimary }}>
                  {node.label}
                </Text>
                <Text
                  style={{
                    ...textStyle.mono,
                    marginTop: 4,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: color.textTertiary,
                  }}
                >
                  {node.on ? "Armed" : "Waiting"}
                </Text>
              </View>
            </View>
          ))}
          <TickRuler progress={nodes.filter((node) => node.on).length / nodes.length} />
        </View>

        {session ? (
          <View style={{ gap: space.md }}>
            <Button label="Film" onPress={() => router.push(trick ? "/capture" : "/trick")} />
            <Button label="End session" variant="secondary" onPress={() => void closeSession()} />
          </View>
        ) : (
          <Button label="Open P.T.E. engine" variant="secondary" onPress={() => router.push("/engine")} />
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}
