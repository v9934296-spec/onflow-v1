import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attemptsForSession, mergeAttempts, nextAttemptNumber } from "@/domain/attempts";
import { leaveDecision } from "@/domain/leaveGuard";
import {
  formatClipLength,
  formatFileSize,
  isLocalMediaUri,
  mayDeleteWorkingFile,
  parseReviewParams,
} from "@/domain/media";
import { enqueueClip } from "@/store/enqueueClip";
import { mimeFromUri } from "@/domain/tricks";
import { useSessionAttemptsStore } from "@/store/sessionAttempts";
import { useSessionStore } from "@/store/sessionStore";
import { ConfirmDialog } from "@/ui/components/Form";
import { MediaStage } from "@/ui/components/MediaStage";
import { OnFlowButton } from "@/ui/components/OnFlowButton";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { ErrorPanel } from "@/ui/components/States";
import { TrickSlate } from "@/ui/components/TrickSlate";
import { useLeaveGuard } from "@/ui/hooks/useLeaveGuard";
import { space } from "@/ui/tokens";

/**
 * Attempt review. The footage is the hero: it plays immediately, looping,
 * edge to edge, with the trick slate under it and three plain choices.
 * Nothing is uploaded until USE CLIP — retaking or cancelling costs the
 * skater nothing but the file OnFlow recorded itself.
 */
export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const raw = useLocalSearchParams<{
    uri?: string;
    duration?: string;
    size?: string;
    kind?: string;
    capturedAt?: string;
  }>();
  const trick = useSessionStore((s) => s.trick);
  const session = useSessionStore((s) => s.session);
  const confirmed = useSessionAttemptsStore((s) => s.confirmed);
  const pending = useSessionAttemptsStore((s) => s.pending);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playbackKey, setPlaybackKey] = useState(0);
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const clip = useMemo(() => parseReviewParams(raw), [raw]);

  const attemptNumber =
    trick && session
      ? nextAttemptNumber(attemptsForSession(mergeAttempts(confirmed, pending), session.id), trick.trickId)
      : null;

  useEffect(() => {
    if (!clip) return;
    if (!isLocalMediaUri(clip.uri)) {
      setFileExists(true);
      return;
    }
    setFileExists(null);
    let cancelled = false;
    void FileSystem.getInfoAsync(clip.uri)
      .then((info) => {
        if (!cancelled) setFileExists(info.exists);
      })
      .catch(() => {
        if (!cancelled) setFileExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clip, playbackKey]);

  const reviewLeave = leaveDecision({
    screen: "review",
    busy,
    mediaKind: clip?.mediaKind,
  });
  useLeaveGuard(clip ? reviewLeave : "allow", () => setConfirmDiscard(true));

  if (!clip) {
    return (
      <ScreenSafeArea style={{ justifyContent: "center" }}>
        <ErrorPanel kind="clip_unreadable" onPrimary={() => router.replace("/capture")} />
      </ScreenSafeArea>
    );
  }

  const take = clip;
  const imported = take.mediaKind === "imported";

  /** Retake and confirmed cancel discard a file OnFlow recorded. A library original is never touched. */
  async function discardWorkingFile() {
    if (!mayDeleteWorkingFile(take.mediaKind)) return;
    try {
      await FileSystem.deleteAsync(take.uri, { idempotent: true });
    } catch {
      // Storage cleanup is best effort; it never blocks the skater.
    }
  }

  function requestLeave() {
    const decision = leaveDecision({ screen: "review", busy, mediaKind: take.mediaKind });
    if (decision === "block") return;
    if (decision === "confirm") {
      setConfirmDiscard(true);
      return;
    }
    router.replace("/flow");
  }

  return (
    <ScreenSafeArea>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <MediaStage
          uri={clip.uri}
          fileExists={fileExists}
          playbackKey={playbackKey}
          accessibilityLabel={`Attempt footage, ${formatClipLength(clip.durationSeconds)}`}
          onRetry={() => setPlaybackKey((n) => n + 1)}
        />
        <TrickSlate
          name={trick?.canonicalName ?? "Untitled attempt"}
          modifiers={[trick?.stance, trick?.direction]}
          attempt={attemptNumber}
          muted={!trick}
        />
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
          <OnFlowMeta
            items={[
              formatClipLength(clip.durationSeconds),
              formatFileSize(clip.sizeBytes),
              imported ? "Imported" : "Filmed",
            ]}
            font="mono"
            tone="tertiary"
          />
        </View>
      </View>

      {failed ? <ErrorPanel kind="clip_unreadable" onPrimary={() => setFailed(false)} /> : null}

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
          label="Use clip"
          size="hero"
          haptic
          loading={busy}
          disabled={fileExists === false}
          onPress={() => {
            setBusy(true);
            void (async () => {
              const localId = await enqueueClip({
                uri: clip.uri,
                durationSeconds: clip.durationSeconds,
                sizeBytes: clip.sizeBytes,
                mimeType: mimeFromUri(clip.uri),
                mediaKind: clip.mediaKind,
                capturedAt: clip.capturedAt,
              });
              setBusy(false);
              if (localId) router.replace(`/analyzing?localId=${localId}`);
              else setFailed(true);
            })();
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <OnFlowButton
            label={imported ? "Choose another" : "Retake"}
            size="compact"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              void discardWorkingFile();
              router.replace(imported ? "/capture?import=1" : "/capture");
            }}
          />
          <OnFlowButton
            label="Cancel"
            size="compact"
            variant="quiet"
            disabled={busy}
            onPress={requestLeave}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this take?"
        body="This only deletes the clip OnFlow just recorded. Your library is untouched."
        primaryLabel="Keep clip"
        secondaryLabel="Discard"
        onPrimary={() => setConfirmDiscard(false)}
        onSecondary={() => {
          setConfirmDiscard(false);
          void discardWorkingFile().then(() => router.replace("/flow"));
        }}
      />
    </ScreenSafeArea>
  );
}
