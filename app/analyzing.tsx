import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ErrorPanel } from "@/ui/components/States";
import { getOutbox } from "@/store/outbox";
import { pollJob, runOutboxRow } from "@/store/upload";
import { analyzingPhase, progressFraction } from "@/domain/outbox";
import type { OutboxRow } from "@/domain/models";
import type { AnalysisResult } from "@/domain/models";
import { queryClient } from "@/store/queryClient";

export default function AnalyzingScreen() {
  const { localId } = useLocalSearchParams<{ localId: string }>();
  const router = useRouter();
  const [row, setRow] = useState<OutboxRow | null>(null);
  const [job, setJob] = useState<AnalysisResult | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 45_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!localId) return;
    let cancelled = false;
    let delay = 2000;
    const started = Date.now();

    const tick = async () => {
      const current = await getOutbox(localId);
      if (cancelled || !current) return;
      setRow(current);
      if (!current.clipId && current.state === "pending") {
        await runOutboxRow(localId);
      }
      if (current.clipId && (current.state === "analyzing" || current.state === "requesting_analysis")) {
        const polled = await pollJob(current.clipId);
        if (polled.ok) {
          setJob(polled.data);
          if (polled.data.status === "completed") {
            queryClient.setQueryData(["result", current.clipId], polled.data);
            router.replace(`/result?clipId=${current.clipId}&localId=${localId}`);
            return;
          }
          if (polled.data.status === "failed") {
            setJob(polled.data);
            return;
          }
        } else if (polled.error.kind !== "offline" && polled.error.kind !== "rate_limited" && (polled.error.status ?? 0) < 500) {
          return;
        }
      }
      if (Date.now() - started > 5 * 60_000) return;
      delay = Date.now() - started > 30_000 ? 5000 : 2000;
      setTimeout(() => void tick(), delay);
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [localId, router]);

  const phase = analyzingPhase(row?.state ?? "pending", job?.status ?? null);
  const fraction = row ? progressFraction(row) : null;

  if (phase === "FAILED") {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, justifyContent: "center" }}>
        <ErrorPanel kind="analysis_failed" onPrimary={() => router.replace("/capture")} />
        <Button label="Home" variant="secondary" onPress={() => router.replace("/")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xxl, justifyContent: "center", gap: space.lg }}>
      <Text style={{ ...textStyle.h1, color: color.textPrimary }}>{phase}</Text>
      {fraction != null ? (
        <Text style={{ ...textStyle.mono, color: color.alum }}>{Math.round(fraction * 100)}% uploaded</Text>
      ) : (
        <Text style={{ ...textStyle.body, color: color.textSecondary }}>
          {slow
            ? "Still reviewing. You can keep filming — this'll be in your History when it's done."
            : "Reviewing the clip you called. This is not trick detection."}
        </Text>
      )}
      <Button label="Keep filming" variant="secondary" onPress={() => router.replace("/capture")} />
    </View>
  );
}
