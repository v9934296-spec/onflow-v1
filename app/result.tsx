import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { OutcomeSelector } from "@/ui/components/OutcomeSelector";
import { ReadinessBanner } from "@/ui/components/ReadinessBanner";
import { FeedbackRow } from "@/ui/components/FeedbackRow";
import { ConfirmDialog } from "@/ui/components/Form";
import { ErrorPanel } from "@/ui/components/States";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { pollJob } from "@/store/upload";
import { queryClient } from "@/store/queryClient";
import type { AnalysisResult, AttemptOutcome } from "@/domain/models";
import { recordOutcome } from "@/store/attempts";
import { useSessionStore } from "@/store/sessionStore";

export default function ResultScreen() {
  const { clipId } = useLocalSearchParams<{ clipId: string }>();
  const router = useRouter();
  const trick = useSessionStore((s) => s.trick);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    () => queryClient.getQueryData<AnalysisResult>(["result", clipId]) ?? null,
  );
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (analysis || !clipId) return;
    void pollJob(clipId).then((res) => {
      if (res.ok) setAnalysis(res.data);
    });
  }, [analysis, clipId]);

  if (!analysis) {
    return (
      <ScreenSafeArea>
        <ErrorPanel kind="contract_error" onPrimary={() => router.replace("/")} />
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea>
      <ScrollView
        style={{ flex: 1, backgroundColor: color.bg }}
        contentContainerStyle={{ padding: space.xl, gap: space.lg }}
      >
      <ScreenHeader kicker="Read" title="RESULT" />
      <Text style={{ ...textStyle.bodyLg, color: color.textPrimary }}>
        {trick?.canonicalName ?? analysis.calledTrick ?? "Called trick"}
      </Text>
      {analysis.readiness ? <ReadinessBanner readiness={analysis.readiness} /> : null}
      {analysis.score != null ? (
        <Text style={{ ...textStyle.hero, color: color.neon }}>{analysis.score}</Text>
      ) : (
        <Text style={{ ...textStyle.body, color: color.textSecondary }}>No score for this clip.</Text>
      )}
      {analysis.uncertaintyNotes.map((note) => (
        <Text key={note} style={{ ...textStyle.body, color: color.amber }}>
          {note}
        </Text>
      ))}
      {analysis.processingNotes.map((note) => (
        <Text key={note} style={{ ...textStyle.bodySm, color: color.textTertiary }}>
          {note}
        </Text>
      ))}
      {analysis.bestCue ? (
        <View>
          <Text style={{ ...textStyle.label, color: color.neon }}>What to work on</Text>
          <Text style={{ ...textStyle.body, color: color.textPrimary }}>{analysis.bestCue}</Text>
        </View>
      ) : null}
      {analysis.mechanics.map((row) => (
        <FeedbackRow key={row.name} row={row} />
      ))}
      {analysis.engineLanded && outcome && (analysis.engineLanded === "yes") !== (outcome === "landed") ? (
        <Text style={{ ...textStyle.bodySm, color: color.alum }}>
          You recorded {outcome}. The engine read {analysis.engineLanded}. Your call is the record.
        </Text>
      ) : null}
      <OutcomeSelector value={outcome} onChange={setOutcome} />
      <Button label="Save to History" disabled={!outcome} onPress={() => void save(false)} />
      <Button
        label="Another clip"
        variant="secondary"
        onPress={() => void save(true)}
      />
      <ConfirmDialog
        visible={confirmLeave}
        title="Save this outcome first?"
        body="You marked an outcome. Save it to History, or discard just that mark. The clip stays."
        primaryLabel="Save and leave"
        secondaryLabel="Discard outcome"
        onPrimary={() => void save(false)}
        onSecondary={() => router.replace("/flow")}
      />
      </ScrollView>
    </ScreenSafeArea>
  );

  async function save(continueFilming: boolean) {
    if (!outcome) {
      if (continueFilming) router.replace("/capture");
      else setConfirmLeave(true);
      return;
    }
    // Persisted locally before the request; queued if offline. Never lost.
    await recordOutcome(outcome);
    router.replace(continueFilming ? "/capture" : "/flow");
  }
}
