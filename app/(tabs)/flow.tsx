import { Fragment, useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  attemptNumberOf,
  attemptsForSession,
  elapsedSeconds,
  formatDuration,
  formatTimeOfDay,
  mergeAttempts,
  nextAttemptNumber,
  trickTallies,
} from "@/domain/attempts";
import { useAuthStore } from "@/store/authStore";
import { listRecoverable } from "@/store/outbox";
import { useSessionAttemptsStore } from "@/store/sessionAttempts";
import { closeSession, startFreeSkateSession } from "@/store/sessionActions";
import { useSessionStore } from "@/store/sessionStore";
import { AttemptLogRow, TrickTallyRow } from "@/ui/components/AttemptLog";
import { ConfirmDialog } from "@/ui/components/Form";
import { OnFlowButton } from "@/ui/components/OnFlowButton";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowHeader } from "@/ui/components/OnFlowHeader";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { SessionClock } from "@/ui/components/SessionClock";
import { Skeleton } from "@/ui/components/States";
import { SyncStatus } from "@/ui/components/SyncStatus";
import { reconcileOwnedWork } from "@/store/reconcile";
import { TrickSlate } from "@/ui/components/TrickSlate";
import { useOffline } from "@/ui/hooks/useOffline";
import { color, dynamicTypeMaxScale, space, textStyle } from "@/ui/tokens";

const LOG_LIMIT = 30;

/**
 * The canonical OnFlow screen. Session state, the trick slate, the one
 * physical action, and the session's own log. Everything on it is real:
 * the clock runs from the server's start time, the attempt number counts
 * recorded outcomes (queued ones included), and clips in flight are counted
 * from the outbox.
 */
export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  const hydrating = useSessionStore((s) => s.hydrating);
  const userId = useAuthStore((s) => s.userId);
  const confirmed = useSessionAttemptsStore((s) => s.confirmed);
  const pending = useSessionAttemptsStore((s) => s.pending);
  const queue = useSessionAttemptsStore((s) => s.queue);
  const loadAttempts = useSessionAttemptsStore((s) => s.load);
  const retryDead = useSessionAttemptsStore((s) => s.retryDead);
  const dismissDead = useSessionAttemptsStore((s) => s.dismissDead);
  const sessionEndPending = useSessionStore((s) => s.pendingEnd != null);
  const [processing, setProcessing] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const offline = useOffline();

  const sessionId = session?.id ?? null;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void loadAttempts(userId, sessionId);
      void listRecoverable(userId).then((rows) => {
        setProcessing(
          rows.filter((row) => row.sessionId === sessionId && row.state !== "failed_retryable").length,
        );
      });
    }, [userId, sessionId, loadAttempts]),
  );

  const attempts = useMemo(
    () => (sessionId ? attemptsForSession(mergeAttempts(confirmed, pending), sessionId) : []),
    [confirmed, pending, sessionId],
  );
  const tallies = useMemo(() => trickTallies(attempts), [attempts]);
  const pendingIds = useMemo(() => new Set(pending.map((row) => row.id)), [pending]);
  const attemptNumber = trick ? nextAttemptNumber(attempts, trick.trickId) : null;

  if (hydrating) {
    return (
      <ScreenSafeArea style={{ padding: space.lg }}>
        <Skeleton height={42} />
        <Skeleton height={120} />
      </ScreenSafeArea>
    );
  }

  if (!session) {
    return (
      <ScreenSafeArea>
        <OnFlowHeader title="SESSION" meta={["No session open"]} />
        <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: space.lg, paddingBottom: space.xl }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={dynamicTypeMaxScale.display}
            style={{ ...textStyle.slate, color: color.textTertiary }}
          >
            NO SESSION.
          </Text>
          <Text maxFontSizeMultiplier={dynamicTypeMaxScale.display} style={{ ...textStyle.slate, color: color.textPrimary }}>
            GO SKATE.
          </Text>
        </View>
        <OnFlowDivider />
        <View style={{ padding: space.lg, paddingBottom: Math.max(insets.bottom, space.md) }}>
          <OnFlowButton
            label="Start session"
            size="hero"
            haptic
            loading={starting}
            onPress={() => {
              setStarting(true);
              void startFreeSkateSession().then((res) => {
                setStarting(false);
                if (res.ok) router.push("/trick");
              });
            }}
          />
        </View>
      </ScreenSafeArea>
    );
  }

  const elapsed = formatDuration(elapsedSeconds(session.startedAt));

  return (
    <ScreenSafeArea>
      <OnFlowHeader
        title="SESSION"
        meta={[
          "● Open",
          processing > 0 ? `${processing} ${processing === 1 ? "clip" : "clips"} processing` : null,
        ]}
        right={<SessionClock startedAt={session.startedAt} />}
      />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <SyncStatus
          queue={queue}
          clipsQueued={processing}
          sessionEndPending={sessionEndPending}
          offline={offline}
          onRetry={() => {
            if (userId) {
              void retryDead(userId);
              void reconcileOwnedWork(userId);
            }
          }}
          onDismissDead={(key) => {
            if (userId) dismissDead(userId, key);
          }}
        />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }}>
        {trick ? (
          <TrickSlate
            name={trick.canonicalName}
            modifiers={[trick.stance, trick.direction]}
            attempt={attemptNumber}
            onPress={() => router.push("/trick")}
            accessibilityHint="Opens the trick picker"
          />
        ) : (
          <TrickSlate name="Choose a trick" muted onPress={() => router.push("/trick")} />
        )}

        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.sm }}>
          {trick ? (
            <>
              <OnFlowButton label="Film" size="hero" haptic onPress={() => router.push("/capture")} />
              <OnFlowButton
                label="Import clip"
                variant="secondary"
                onPress={() => router.push("/capture?import=1")}
              />
            </>
          ) : (
            <OnFlowButton label="Choose trick" size="hero" onPress={() => router.push("/trick")} />
          )}
        </View>

        <OnFlowDivider weight="rule" />

        {tallies.length > 0 ? (
          <View>
            <SectionLabel label="This session" />
            {tallies.map((tally) => (
              <Fragment key={tally.trickId}>
                <TrickTallyRow tally={tally} active={tally.trickId === trick?.trickId} />
                <OnFlowDivider />
              </Fragment>
            ))}
          </View>
        ) : null}

        {attempts.length > 0 ? (
          <View>
            <SectionLabel label="Log" />
            <OnFlowDivider />
            {[...attempts]
              .reverse()
              .slice(0, LOG_LIMIT)
              .map((attempt) => (
                <Fragment key={attempt.id}>
                  <AttemptLogRow
                    number={attemptNumberOf(attempts, attempt)}
                    outcome={attempt.outcome}
                    time={formatTimeOfDay(attempt.loggedAt)}
                    trick={attempt.canonicalName}
                    queued={pendingIds.has(attempt.id)}
                  />
                  <OnFlowDivider />
                </Fragment>
              ))}
          </View>
        ) : (
          <View style={{ padding: space.lg }}>
            <OnFlowMeta items={["No attempts yet"]} tone="tertiary" />
          </View>
        )}
      </ScrollView>

      <OnFlowDivider />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: space.lg,
          paddingTop: space.sm,
          paddingBottom: Math.max(insets.bottom, space.sm),
        }}
      >
        <OnFlowButton label="Change trick" size="compact" variant="secondary" onPress={() => router.push("/trick")} />
        <OnFlowButton label="End session" size="compact" variant="quiet" onPress={() => setEndOpen(true)} />
      </View>

      <ConfirmDialog
        visible={endOpen}
        title="End session?"
        body={`${elapsed} on the clock, ${attempts.length} ${attempts.length === 1 ? "attempt" : "attempts"} logged. Ends now on this phone; the server catches up if you're offline.`}
        primaryLabel="End session"
        secondaryLabel="Keep skating"
        onPrimary={() => {
          setEndOpen(false);
          void closeSession();
        }}
        onSecondary={() => setEndOpen(false)}
      />
    </ScreenSafeArea>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
      <OnFlowMeta items={[label]} tone="tertiary" />
    </View>
  );
}
