import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { color, space, textStyle, touchTarget } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { AsphaltBackdrop } from "@/ui/components/AsphaltSurface";
import { PteLiveCard } from "@/ui/components/PteLiveCard";
import { TRANSPARENT_OVER_ASPHALT } from "@/ui/components/engineMarks";
import { analyzingPhase, isTerminal, resumeHref } from "@/domain/outbox";
import { formatTrickLabel } from "@/domain/tricks";
import { useSessionStore } from "@/store/sessionStore";
import { useAuthStore } from "@/store/authStore";
import { listOutboxForUser, listRecoverable } from "@/store/outbox";
import type { OutboxRow } from "@/domain/models";

const PIPELINE = [
  { id: "call", label: "Call", copy: "You name the trick. The engine never guesses it." },
  { id: "film", label: "Film", copy: "A single attempt, 30 seconds or under." },
  { id: "read", label: "P.T.E.", copy: "Upload and review use the same live job — no empty instruments." },
  { id: "save", label: "Save", copy: "One readiness. Notes only if the engine wrote them." },
] as const;

export default function EngineScreen() {
  const router = useRouter();
  const trick = useSessionStore((s) => s.trick);
  const userId = useAuthStore((s) => s.userId);
  const [queued, setQueued] = useState(0);
  const [latest, setLatest] = useState<OutboxRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void (async () => {
        const recoverable = await listRecoverable(userId);
        const all = await listOutboxForUser(userId);
        setQueued(recoverable.length);
        setLatest(all.at(-1) ?? null);
      })();
    }, [userId]),
  );

  const live = latest && !isTerminal(latest) ? latest : null;
  const phase = live ? analyzingPhase(live.state, null) : null;
  const trickLabel = trick
    ? formatTrickLabel(trick)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, overflow: "hidden" }}>
      <AsphaltBackdrop opacity={0.7} />
      <SafeAreaView edges={["top"]} style={[{ flex: 1 }, TRANSPARENT_OVER_ASPHALT]}>
        <ScrollView
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{ paddingBottom: space.xxl }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingHorizontal: space.xl,
              paddingTop: space.xl,
            }}
          >
            <View>
              <Text
                style={{
                  ...textStyle.label,
                  fontSize: 11,
                  letterSpacing: 1.6,
                  color: color.neon,
                  textTransform: "uppercase",
                }}
              >
                P.T.E.
              </Text>
              <Text style={{ ...textStyle.hero, color: color.textPrimary }}>ENGINE</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => router.back()}
              style={{ minHeight: touchTarget.minimum, minWidth: touchTarget.minimum, justifyContent: "center" }}
            >
              <Text style={{ ...textStyle.label, color: color.textSecondary }}>Close</Text>
            </Pressable>
          </View>

          <View style={{ marginHorizontal: space.xl, marginTop: space.lg }}>
            <PteLiveCard trickLabel={trickLabel} phase={phase} active={queued > 0} />
          </View>

          <View style={{ marginHorizontal: space.xl, marginTop: space.xxl }}>
            <Text
              style={{
                ...textStyle.label,
                fontSize: 11,
                letterSpacing: 1.4,
                color: color.textTertiary,
                textTransform: "uppercase",
              }}
            >
              Loop
            </Text>
            {PIPELINE.map((step, index) => (
              <View key={step.id} style={{ flexDirection: "row", gap: space.md, marginTop: index === 0 ? space.md : 0 }}>
                <View style={{ width: 24, alignItems: "center" }}>
                  <View
                    style={{
                      marginTop: 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color.neon,
                    }}
                  />
                  {index < PIPELINE.length - 1 ? (
                    <View style={{ width: 1, flex: 1, minHeight: 28, backgroundColor: color.hairline }} />
                  ) : null}
                </View>
                <View style={{ paddingBottom: space.lg, flex: 1 }}>
                  <Text style={{ ...textStyle.h2, fontSize: 18, lineHeight: 18, color: color.textPrimary }}>
                    {step.label}
                  </Text>
                  <Text style={{ ...textStyle.bodySm, color: color.textSecondary, marginTop: 4 }}>
                    {step.copy}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginHorizontal: space.xl, marginTop: space.sm }}>
            <Text
              style={{
                ...textStyle.mono,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: color.textTertiary,
              }}
            >
              No averages. No ratings. No empty rings.
            </Text>
          </View>

          <View style={{ marginHorizontal: space.xl, marginTop: space.xl, gap: space.md }}>
            {live ? (
              <Button label="Open job" onPress={() => router.push(resumeHref(live.localId))} />
            ) : (
              <Button
                label={trick ? "Film an attempt" : "Choose a trick"}
                onPress={() => router.push(trick ? "/capture" : "/trick")}
              />
            )}
            <Button label="Home" variant="secondary" onPress={() => router.replace("/")} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
