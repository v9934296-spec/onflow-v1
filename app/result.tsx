import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { OutcomeSelector } from "@/ui/components/OutcomeSelector";
import { ReadinessBanner } from "@/ui/components/ReadinessBanner";
import { FeedbackRow } from "@/ui/components/FeedbackRow";
import { ConfirmDialog } from "@/ui/components/Form";
import { ErrorPanel, OfflineBadge, Skeleton } from "@/ui/components/States";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { ResultClip } from "@/ui/components/ResultClip";
import { AsphaltSurface } from "@/ui/components/AsphaltSurface";
import { PteLiveCard } from "@/ui/components/PteLiveCard";
import { EngineRing } from "@/ui/components/EngineRing";
import { TRANSPARENT_OVER_ASPHALT } from "@/ui/components/engineMarks";
import { pollJob } from "@/store/upload";
import { queryClient } from "@/store/queryClient";
import { getOutbox } from "@/store/outbox";
import { markJobSeen, rememberHistoryScore } from "@/store/historyCache";
import { isOffline } from "@/store/net";
import type { AnalysisResult, AttemptOutcome, MechanicsRow } from "@/domain/models";
import { reportOutcomeAndMaybeContinue } from "@/store/attempts";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { asErrorKind, type ErrorKind } from "@/ui/copy/errors";
import { toCatalogErrorKind } from "@/domain/outbox";
import { formatTrickLabel } from "@/domain/tricks";

export default function ResultScreen() {
  const { clipId, localId } = useLocalSearchParams<{ clipId: string; localId?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const trick = useSessionStore((s) => s.trick);
  const userId = useAuthStore((s) => s.userId);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    () => queryClient.getQueryData<AnalysisResult>(["result", clipId]) ?? null,
  );
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [loadError, setLoadError] = useState<ErrorKind | null>(null);
  const [loading, setLoading] = useState(!analysis);
  const [saveError, setSaveError] = useState<ErrorKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const [offline] = useState(() => isOffline());

  useEffect(() => {
    if (!clipId || !userId) return;
    markJobSeen(userId, clipId);
  }, [clipId, userId]);

  useEffect(() => {
    if (!userId || analysis?.status !== "completed") return;
    rememberHistoryScore(userId, analysis);
  }, [analysis, userId]);

  useEffect(() => {
    if (!localId) return;
    void getOutbox(localId).then((row) => {
      if (row) setLocalUri(row.localUri);
    });
  }, [localId]);

  useEffect(() => {
    if (analysis) {
      if (analysis.status === "failed") setLoadError("analysis_failed");
      setLoading(false);
      return;
    }
    if (!clipId) {
      setLoadError("contract_error");
      setLoading(false);
      return;
    }
    void pollJob(clipId).then((res) => {
      if (!res.ok) {
        setLoadError(asErrorKind(toCatalogErrorKind(res.error.kind, "contract_error")));
        return;
      }
      if (res.data.status === "failed") {
        setLoadError("analysis_failed");
        return;
      }
      setAnalysis(res.data);
    }).finally(() => setLoading(false));
  }, [analysis, clipId]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (event) => {
      if (allowLeave || !outcome) return;
      event.preventDefault();
      setConfirmLeave(true);
    });
    return unsub;
  }, [navigation, outcome, allowLeave]);

  async function save(continueFilming: boolean) {
    if (saving) return;
    if (!outcome) {
      if (continueFilming) {
        setAllowLeave(true);
        router.replace("/capture");
      }
      return;
    }
    if (!userId) {
      setSaveError("auth_expired");
      return;
    }
    setSaving(true);
    setConfirmLeave(false);
    const result = await reportOutcomeAndMaybeContinue(userId, outcome);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.kind);
      return;
    }
    setAllowLeave(true);
    if (continueFilming) {
      router.replace("/capture");
      return;
    }
    router.replace({
      pathname: "/saved",
      params: { facts: result.facts.join("\n") },
    });
  }

  if (loading) {
    return (
      <ScreenSafeArea style={{ padding: space.xl }}>
        <Skeleton height={180} />
        <Skeleton height={48} />
      </ScreenSafeArea>
    );
  }

  if (loadError) {
    return (
      <ScreenSafeArea>
        <ErrorPanel kind={loadError} onPrimary={() => router.replace("/")} />
      </ScreenSafeArea>
    );
  }

  if (saveError) {
    return (
      <ScreenSafeArea>
        <ErrorPanel kind={saveError} onPrimary={() => setSaveError(null)} />
      </ScreenSafeArea>
    );
  }

  if (!analysis) {
    return (
      <ScreenSafeArea>
        <ErrorPanel kind="contract_error" onPrimary={() => router.replace("/")} />
      </ScreenSafeArea>
    );
  }

  const playbackUri = analysis.videoPlaybackUrl ?? localUri;
  const called = trick
    ? formatTrickLabel(trick)
    : analysis.calledTrick;
  const notes = [...analysis.uncertaintyNotes, ...analysis.processingNotes];
  const gated =
    analysis.quality.videoReadable === false || analysis.quality.motionDetected === false;
  const readiness = analysis.readiness ?? (gated ? "insufficient" : null);
  const displayScore = analysis.score;
  const scoredRings = gated ? [] : scoredMechanics(analysis.mechanics);

  return (
    <AsphaltSurface>
      <SafeAreaView edges={["top"]} style={[{ flex: 1 }, TRANSPARENT_OVER_ASPHALT]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ padding: space.xl, gap: space.lg }}
      >
        <ScreenHeader kicker="P.T.E." title="RESULT" />
        <PteLiveCard trickLabel={called} phase="READY" active={false} />
        {offline ? <OfflineBadge queued={0} /> : null}
        <ResultClip uri={playbackUri} />
        {readiness ? <ReadinessBanner readiness={readiness} /> : null}
        {!gated && displayScore != null ? (
          <Text style={{ ...textStyle.hero, color: color.neon }}>{displayScore}</Text>
        ) : null}
        {!gated && analysis.providerModel ? (
          <Text style={{ ...textStyle.mono, color: color.alum }}>{analysis.providerModel}</Text>
        ) : null}
        {!gated && analysis.reviewSummary ? (
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>{analysis.reviewSummary}</Text>
        ) : null}
        {!gated && analysis.primaryIssueLabel ? (
          <Text style={{ ...textStyle.body, color: color.textPrimary }}>{analysis.primaryIssueLabel}</Text>
        ) : null}
        {!gated && notes.length > 0 ? (
          <View style={{ gap: space.sm }}>
            {notes.map((note) => (
              <Text key={note} style={{ ...textStyle.bodySm, color: color.amber }}>
                {note}
              </Text>
            ))}
          </View>
        ) : null}
        {!gated && analysis.bestCue ? (
          <View>
            <Text style={{ ...textStyle.label, color: color.neon }}>What to work on</Text>
            <Text style={{ ...textStyle.body, color: color.textPrimary }}>{analysis.bestCue}</Text>
          </View>
        ) : null}
        {scoredRings.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: space.xl }}>
            {scoredRings.map((row) => (
              <View key={row.name} style={{ width: "46%" }}>
                <EngineRing label={row.name} score={row.score} />
              </View>
            ))}
          </View>
        ) : null}
        {!gated
          ? analysis.mechanics.map((row) => <FeedbackRow key={row.name} row={row} />)
          : null}
        {analysis.engineLanded && outcome && (analysis.engineLanded === "yes") !== (outcome === "landed") ? (
          <Text style={{ ...textStyle.bodySm, color: color.alum }}>
            You recorded {outcome}. The engine read {analysis.engineLanded}. Your call is the record.
          </Text>
        ) : null}
        <OutcomeSelector value={outcome} onChange={setOutcome} />
        <Button label="Save to History" disabled={!outcome} loading={saving} onPress={() => void save(false)} />
        <Button
          label="Another clip"
          variant="secondary"
          disabled={saving}
          onPress={() => void save(true)}
        />
        <ConfirmDialog
          visible={confirmLeave}
          title="Save this outcome first?"
          body="You marked an outcome. Save it to History, or discard just that mark. The clip stays."
          primaryLabel="Save and leave"
          secondaryLabel="Discard outcome"
          onPrimary={() => void save(false)}
          onSecondary={() => {
            setOutcome(null);
            setConfirmLeave(false);
            setAllowLeave(true);
            router.replace("/");
          }}
        />
      </ScrollView>
      </SafeAreaView>
    </AsphaltSurface>
  );
}

function scoredMechanics(mechanics: readonly MechanicsRow[]): { name: string; score: number }[] {
  const scored: { name: string; score: number }[] = [];
  for (const row of mechanics) {
    if (row.score == null) continue;
    scored.push({ name: row.name, score: row.score });
  }
  return scored;
}
