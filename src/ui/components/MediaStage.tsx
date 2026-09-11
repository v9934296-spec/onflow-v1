import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { mediaViewState } from "@/domain/media";
import { errorCopy } from "@/ui/copy/errors";
import { color, space, textStyle } from "../tokens";
import { Button } from "./Button";
import { FootagePlayer } from "./FootagePlayer";
import { Skeleton } from "./States";

/**
 * Playback well for review/result. Missing media is an empty 16:9 with honest
 * copy — never a fabricated still of the trick (spec §10.4).
 */
export function MediaStage({
  uri,
  fileExists,
  playbackKey = 0,
  accessibilityLabel,
  onRetry,
}: {
  uri: string | null;
  fileExists: boolean | null;
  playbackKey?: number;
  accessibilityLabel?: string;
  onRetry?: () => void;
}) {
  const [playerFailed, setPlayerFailed] = useState(false);

  useEffect(() => {
    setPlayerFailed(false);
  }, [uri, playbackKey]);

  const state = mediaViewState({ uri, fileExists, playerFailed });

  if (state === "loading") {
    return (
      <View
        accessibilityLabel="Loading footage"
        style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: color.surface, justifyContent: "center", padding: space.lg }}
      >
        <Skeleton height={18} />
        <Skeleton height={18} />
      </View>
    );
  }

  if (state === "missing") {
    return (
      <View
        style={{
          width: "100%",
          aspectRatio: 16 / 9,
          backgroundColor: color.surface,
          justifyContent: "center",
          padding: space.lg,
          gap: space.sm,
        }}
      >
        <Text style={{ ...textStyle.body, color: color.textSecondary }}>No playback for this clip.</Text>
        <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>The read below is still yours.</Text>
      </View>
    );
  }

  if (state === "failed") {
    const copy = errorCopy.clip_unreadable;
    return (
      <View
        style={{
          width: "100%",
          aspectRatio: 16 / 9,
          backgroundColor: color.surface,
          justifyContent: "center",
          padding: space.lg,
          gap: space.md,
        }}
      >
        <Text style={{ ...textStyle.h2, color: color.textPrimary }}>{copy.title}</Text>
        <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>{copy.body}</Text>
        {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
      </View>
    );
  }

  if (!uri) return null;

  return (
    <FootagePlayer
      key={`${uri}:${playbackKey}`}
      uri={uri}
      accessibilityLabel={accessibilityLabel}
      onError={() => setPlayerFailed(true)}
    />
  );
}
