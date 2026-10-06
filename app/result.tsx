import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attemptsForSession, mergeAttempts, nextAttemptNumber } from "@/domain/attempts";
import { leaveDecision } from "@/domain/leaveGuard";
import type { AnalysisResult, AttemptOutcome, OutboxRow } from "@/domain/models";
import type { CatalogErrorKind } from "@/domain/outbox";
import {
  completedResult,
  interpretResultLoad,
  jobPollDelayMs,
  type ResultLoadPhase,
} from "@/domain/resultLoad";
import { getOutbox } from "@/store/outbox";
import { pollJob, setOutboxOutcome } from "@/store/upload";
import { queryClient } from "@/store/queryClient";
import { recordOutcome } from "@/store/attempts";
import { closeSession } from "@/store/sessionActions";
import { useSessionAttemptsStore } from "@/store/sessionAttempts";
import { useSessionStore } from "@/store/sessionStore";
import { AttemptRead } from "@/ui/components/AttemptRead";
import { FeedbackRow } from "@/ui/components/FeedbackRow";
import { ConfirmDialog } from "@/ui/components/Form";
import { MediaStage } from "@/ui/components/MediaStage";
import { OnFlowButton } from "@/ui/components/OnFlowButton";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { OutcomeSelector } from "@/ui/components/OutcomeSelector";
import { ReadinessBanner } from "@/ui/components/ReadinessBanner";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { ErrorPanel, Skeleton } from "@/ui/components/States";
import { TrickSlate } from "@/ui/components/TrickSlate";
import { useLeaveGuard } from "@/ui/hooks/useLeaveGuard";
import { useOffline } from "@/ui/hooks/useOffline";
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
  const { clipId, localId } = useLocalSearchParams<{ clipId: string; localId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedTrick = useSessionStore((s) => s.trick);
  const session = useSessionStore((s) => s.session);
  const confirmed = useSessionAttemptsStore((s) => s.confirmed);
  const pending = useSessionAttemptsStore((s) => s.pending);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() =>
    completedResult(queryClient.getQueryData<AnalysisResult>(["result", clipId])),
  );
  const [phase, setPhase] = useState<ResultLoadPhase>(analysis ? "ready" : "loading");
  const [errorKind, setErrorKind] = useState<CatalogErrorKind | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [playbackKey, setPlaybackKey] = useState(0);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [saving, setSaving] = useState(false);
  /** The outbox row this clip came from: its own trick, local file and recorded call. */
  const [row, setRow] = useState<OutboxRow | null>(null);
  const [recorded, setRecorded] = useState(false);
  const trick = row?.trick ?? selectedTrick;
  const offline = useOffline();
  const wasOffline = useRef(offline);

  useEffect(() => {
    if (!localId) return;
    let cancelled = false;
    void getOutbox(localId).then((found) => {
      if (cancelled || !found) return;
      setRow(found);
      if (found.outcome) {
        setOutcome(found.outcome);
        setRecorded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [localId]);

  useEffect(() => {
    const hit = completedResult(queryClient.getQueryData<AnalysisResult>(["result", clipId]));
    if (hit) {
      setAnalysis(hit);
      setPhase("ready");
      setErrorKind(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const started = Date.now();

    const tick = async () => {
      const elapsedMs = Date.now() - started;
      const waiting = interpretResultLoad({ clipId, poll: null, elapsedMs });
      if (cancelled) return;
      setPhase(waiting.phase);
      setErrorKind(null);
      if (!clipId) {
        setPhase("failed");
        setErrorKind("contract_error");
        return;
      }

      const res = await pollJob(clipId);
      if (cancelled) return;
      const poll = res.ok
        ? { ok: true as const, data: res.data }
        : { ok: false as const, errorKind: res.error.kind };
      const view = interpretResultLoad({ clipId, poll, elapsedMs: Date.now() - started });
      setPhase(view.phase);
      setErrorKind(view.errorKind);
      if (view.analysis) {
        setAnalysis(view.analysis);
        queryClient.setQueryData(["result", clipId], view.analysis);
      }
      if (view.keepPolling) {
        timer = setTimeout(() => void tick(), jobPollDelayMs(Date.now() - started));
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [clipId, retryNonce]);

  useEffect(() => {
    if (wasOffline.current && !offline && phase === "failed" && errorKind === "offline") {
      setPhase("loading");
      setRetryNonce((n) => n + 1);
    }
    wasOffline.current = offline;
  }, [offline, phase, errorKind]);

  const resultLeave = leaveDecision({
    screen: "result",
    busy: saving,
    outcomeRecorded: outcome != null,
  });
  useLeaveGuard(phase === "ready" ? resultLeave : "allow", () => setConfirmLeave(true));

  // This clip's attempt number: the one being recorded now.
  const attemptNumber = useMemo(() => {
    if (recorded || !trick || !session) return null;
    return nextAttemptNumber(
      attemptsForSession(mergeAttempts(confirmed, pending), session.id),
      trick.trickId,
    );
  }, [recorded, trick, session, confirmed, pending]);

  if (phase !== "ready" || !analysis) {
    return (
      <ScreenSafeArea>
        {phase === "failed" && errorKind ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ErrorPanel
              kind={errorKind}
              onPrimary={() => {
                setPhase("loading");
                setRetryNonce((n) => n + 1);
              }}
            />
          </View>
        ) : (
          <View style={{ flex: 1, padding: space.lg, gap: space.md, justifyContent: "center" }}>
            <Skeleton height={180} />
            <Text style={{ ...textStyle.body, color: color.textSecondary }}>
              {phase === "slow"
                ? "Still reviewing. You can keep filming — this'll be in History when it's done."
                : "Loading the read."}
            </Text>
          </View>
        )}
        <OnFlowDivider />
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.md),
          }}
        >
          <OnFlowButton
            label="Keep filming"
            size="compact"
            variant="secondary"
            onPress={() => router.replace("/capture")}
          />
        </View>
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
        <MediaStage
          uri={analysis.videoPlaybackUrl ?? row?.localUri ?? null}
          fileExists={null}
          playbackKey={playbackKey}
          accessibilityLabel={`${trick?.canonicalName ?? "Attempt"} footage`}
          onRetry={() => setPlaybackKey((n) => n + 1)}
        />

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
        <OutcomeSelector value={outcome} onChange={(next) => (recorded ? undefined : setOutcome(next))} />
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
          onPress={() => void go("/capture")}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <OnFlowButton
            label="Change trick"
            size="compact"
            variant="secondary"
            disabled={saving}
            onPress={() => void go("/trick")}
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
    if (!outcome || recorded) return;
    setSaving(true);
    await recordOutcome(outcome, row ? { sessionId: row.sessionId, trick } : undefined);
    if (localId) await setOutboxOutcome(localId, outcome);
    setRecorded(true);
    setSaving(false);
  }

  async function go(to: "/capture" | "/trick"): Promise<void> {
    if (!outcome) {
      setConfirmLeave(true);
      return;
    }
    await save();
    router.replace(to);
  }
}
