import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { color, radius, space, textStyle, touchTarget } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { AsphaltBackdrop } from "@/ui/components/AsphaltSurface";
import { EngineCore, TickRuler } from "@/ui/components/Marks";
import { EngineRing } from "@/ui/components/EngineRing";
import { TRANSPARENT_OVER_ASPHALT } from "@/ui/components/engineMarks";
import { analyzingPhase } from "@/domain/outbox";
import { formatTrickLabel } from "@/domain/tricks";
import { useSessionStore } from "@/store/sessionStore";
import { useAuthStore } from "@/store/authStore";
import { listOutboxForUser, listRecoverable } from "@/store/outbox";
import type { OutboxRow } from "@/domain/models";

const DIMENSIONS = ["Pop", "Flick", "Landing", "Style"] as const;

const PIPELINE = [
  { id: "call", label: "Call", copy: "You name the trick. The engine never guesses it." },
  { id: "film", label: "Film", copy: "A single attempt, 30 seconds or under." },
  { id: "queue", label: "Queue", copy: "The clip stays on-device until the job is real." },
  { id: "read", label: "Read", copy: "One readiness. Notes only if the engine wrote them." },
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

  const phase = latest ? analyzingPhase(latest.state, null) : null;

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
                Engine
              </Text>
              <Text style={{ ...textStyle.hero, color: color.textPrimary }}>P.T.E.</Text>
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

          <View
            style={{
              marginHorizontal: space.xl,
              marginTop: space.lg,
              flexDirection: "row",
              alignItems: "center",
              gap: space.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.hairline,
              backgroundColor: "rgba(26,26,26,0.8)",
              padding: space.lg,
            }}
          >
            <EngineCore active={queued > 0} size={80} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ ...textStyle.label, color: color.textPrimary }}>
                You call the trick. The engine reviews the attempt.
              </Text>
              <Text style={{ ...textStyle.bodySm, color: color.textSecondary, marginTop: 4 }}>
                {trick
                  ? `Armed for ${formatTrickLabel(trick)}.`
                  : "No trick armed. P.T.E. does not detect tricks from video."}
              </Text>
              <Text
                style={{
                  ...textStyle.mono,
                  marginTop: space.sm,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: color.alum,
                }}
              >
                {phase ? `Job ${phase}` : "Idle — no job"}
              </Text>
            </View>
          </View>

          <View style={{ marginHorizontal: space.xl, marginTop: space.xl }}>
            <Text
              style={{
                ...textStyle.label,
                fontSize: 11,
                letterSpacing: 1.4,
                color: color.textTertiary,
                textTransform: "uppercase",
              }}
            >
              Instruments
            </Text>
            <Text style={{ ...textStyle.bodySm, color: color.textSecondary, marginTop: 4, maxWidth: 320 }}>
              Pop, Flick, Landing, Style only light up when the engine returns a score. Empty is empty — never zero.
            </Text>
            <View style={{ marginTop: space.xl, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: space.xl }}>
              {DIMENSIONS.map((label) => (
                <View key={label} style={{ width: "46%" }}>
                  <EngineRing label={label} score={null} />
                </View>
              ))}
            </View>
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
              Readiness
            </Text>
            <View style={{ marginTop: space.md, flexDirection: "row", gap: space.sm }}>
              <ReadyChip label="Usable" tint={color.neon} />
              <ReadyChip label="Limited" tint={color.amber} />
              <ReadyChip label="Insufficient" tint={color.alum} />
            </View>
            <Text style={{ ...textStyle.bodySm, color: color.textSecondary, marginTop: space.md }}>
              One banner for the whole clip. No per-row evidence tags. Color is never the only indicator.
            </Text>
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
              Pipeline
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
            <TickRuler progress={queued > 0 ? 0.35 : 0} />
            <Text
              style={{
                ...textStyle.mono,
                marginTop: space.sm,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: color.textTertiary,
              }}
            >
              No averages. No cross-engine comparison.
            </Text>
          </View>

          <View style={{ marginHorizontal: space.xl, marginTop: space.xl, gap: space.md }}>
            <Button
              label={trick ? "Film an attempt" : "Choose a trick"}
              onPress={() => router.push(trick ? "/capture" : "/trick")}
            />
            <Button label="Home" variant="secondary" onPress={() => router.replace("/")} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ReadyChip({ label, tint }: { label: string; tint: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: touchTarget.minimum,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: tint,
        backgroundColor: color.surface,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: space.sm,
        paddingVertical: space.md,
      }}
    >
      <Text
        style={{
          ...textStyle.label,
          fontSize: 11,
          letterSpacing: 1,
          color: tint,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
