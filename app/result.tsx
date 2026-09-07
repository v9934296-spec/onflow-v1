import { Fragment, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attemptsForSession, mergeAttempts, nextAttemptNumber } from "@/domain/attempts";
import type { AnalysisResult, AttemptOutcome } from "@/domain/models";
import { pollJob } from "@/store/upload";
import { queryClient } from "@/store/queryClient";
import { recordOutcome } from "@/store/attempts";
import { closeSession } from "@/store/sessionActions";
import { useSessionAttemptsStore } from "@/store/sessionAttempts";
import { useSessionStore } from "@/store/sessionStore";
import { AttemptRead } from "@/ui/components/AttemptRead";
import { FeedbackRow } from "@/ui/components/FeedbackRow";
import { FootagePlayer } from "@/ui/components/FootagePlayer";
import { ConfirmDialog } from "@/ui/components/Form";
import { OnFlowButton } from "@/ui/components/OnFlowButton";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { OutcomeSelector } from "@/ui/components/OutcomeSelector";
import { ReadinessBanner } from "@/ui/components/ReadinessBanner";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { ErrorPanel } from "@/ui/components/States";
import { TrickSlate } from "@/ui/components/TrickSlate";
import { outcomeCopy, outcomePrompt } from "@/ui/copy";
import { color, space, textStyle } from "@/ui/tokens";

/**
 * The read on one attempt.
 *
 * Hierarchy is footage → trick → what happened → mechanics → the skater's
 * call. The score sits near the bottom as one mono line, because a number a
 * model produced is not what the skater came here for, and the provider is
 * retained but never displayed (§11.4). Leaving without recording an outcome
 * is protected by one confirm; the outcome itself is authoritative and is
 * persisted before any request (truth rule 6).
 */
export default function ResultScreen() {
  const { clipId } = useLocalSearchParams<{ clipId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trick = useSessionStore((s) => s.trick);
  const session = useSessionStore((s) => s.session);
  const confirmed = useSessionAttemptsStore((s) => s.confirmed);
  const pending = useSessionAttemptsStore((s) => s.pending);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    () => queryClient.getQueryData<AnalysisResult>(["result", clipId]) ?? null,
  );
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (analysis || !clipId) return;
    void pollJob(clipId).then((res) => {
      if (res.ok) setAnalysis(res.data);
    });
  }, [analysis, clipId]);

  // This clip's attempt number: the one being recorded now.
  const attemptNumber = useMemo(() => {
    if (!trick || !session) return null;
    return nextAttemptNumber(
      attemptsForSession(mergeAttempts(confirmed, pending), session.id),
      trick.trickId,
    );
  }, [trick, session, confirmed, pending]);

  if (!analysis) {
    return (
      <ScreenSafeArea>
        <ErrorPanel kind="contract_error" onPrimary={() => router.replace("/flow")} />
      </ScreenSafeArea>
    );
  }

  const disagrees =
    analysis.engineLanded != null &&
    outcome != null &&
    (analysis.engineLanded === "yes") !== (outcome === "landed");

  return (
    <ScreenSafeArea>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }}>
        {analysis.videoPlaybackUrl ? (
          <FootagePlayer
            uri={analysis.videoPlaybackUrl}
            accessibilityLabel={`${trick?.canonicalName ?? "Attempt"} footage`}
          />
        ) : null}

        <TrickSlate
          name={trick?.canonicalName ?? analysis.calledTrick ?? "Attempt"}
          modifiers={[trick?.stance, trick?.direction]}
          attempt={attemptNumber}
        />

        {analysis.readiness && analysis.readiness !== "usable" ? (
          <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
            <ReadinessBanner readiness={analysis.readiness} />
          </View>
        ) : null}

        <OnFlowDivider weight="rule" />

        <View style={{ paddingVertical: space.lg }}>
          <AttemptRead
            headline={analysis.primaryIssueLabel}
            summary={analysis.reviewSummary}
            cue={analysis.bestCue}
          />
        </View>

        {analysis.mechanics.length > 0 ? (
          <View>
            <OnFlowDivider />
            {analysis.mechanics.map((row) => (
              <Fragment key={row.name}>
                <FeedbackRow row={row} />
                <OnFlowDivider />
              </Fragment>
            ))}
          </View>
        ) : null}

        {analysis.uncertaintyNotes.length > 0 || analysis.processingNotes.length > 0 ? (
          <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm }}>
            {analysis.uncertaintyNotes.map((note) => (
              <Text key={note} style={{ ...textStyle.bodySm, color: color.amber }}>
                {note}
              </Text>
            ))}
            {analysis.processingNotes.map((note) => (
              <Text key={note} style={{ ...textStyle.bodySm, color: color.textTertiary }}>
                {note}
              </Text>
            ))}
          </View>
        ) : null}

        {analysis.score != null ? (
          <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md }}>
            <OnFlowMeta items={[`Score ${analysis.score} / 10`]} font="monoLg" tone="alum" />
          </View>
        ) : null}

        <OnFlowDivider weight="rule" />

        <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
          <Text style={{ ...textStyle.h2, color: color.textPrimary }}>
            {outcomePrompt.toUpperCase()}
          </Text>
        </View>
        <OutcomeSelector value={outcome} onChange={setOutcome} />
        <OnFlowDivider />

        {disagrees && outcome ? (
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
            <Text style={{ ...textStyle.bodySm, color: color.alum }}>
              You recorded {outcomeCopy[outcome].label.toLowerCase()}. The engine read{" "}
              {analysis.engineLanded}. Your call is the record.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <OnFlowDivider />
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: Math.max(insets.bottom, space.md),
          gap: space.sm,
        }}
      >
        <OnFlowButton
          label="Next attempt"
          size="hero"
          haptic
          loading={saving}
          onPress={() => void leave("/capture")}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <OnFlowButton
            label="Change trick"
            size="compact"
            variant="secondary"
            disabled={saving}
            onPress={() => void leave("/trick")}
          />
          <OnFlowButton
            label="End session"
            size="compact"
            variant="quiet"
            disabled={saving}
            onPress={() => setConfirmEnd(true)}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmLeave}
        title="Record what happened?"
        body="Nothing is saved for this attempt until you make the call. The clip stays either way."
        primaryLabel="Go back"
        secondaryLabel="Leave without recording"
        onPrimary={() => setConfirmLeave(false)}
        onSecondary={() => {
          setConfirmLeave(false);
          router.replace("/flow");
        }}
      />
      <ConfirmDialog
        visible={confirmEnd}
        title="End session?"
        body={
          outcome
            ? "Your call on this attempt is saved first."
            : "This attempt has no outcome recorded. It stays unrecorded."
        }
        primaryLabel="End session"
        secondaryLabel="Keep skating"
        onPrimary={() => {
          setConfirmEnd(false);
          void (async () => {
            await save();
            await closeSession();
            router.replace("/flow");
          })();
        }}
        onSecondary={() => setConfirmEnd(false)}
      />
    </ScreenSafeArea>
  );

  /** Persisted locally before the request; queued when offline. Never lost. */
  async function save(): Promise<void> {
    if (!outcome) return;
    setSaving(true);
    await recordOutcome(outcome);
    setSaving(false);
  }

  async function leave(to: "/capture" | "/trick"): Promise<void> {
    if (!outcome) {
      setConfirmLeave(true);
      return;
    }
    await save();
    router.replace(to);
  }
}
