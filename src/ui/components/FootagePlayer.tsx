import { useEffect } from "react";
import { View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { color } from "../tokens";

/**
 * The footage, and nothing around it. 16:9, letterboxed rather than cropped
 * (spec §10.4), looping and muted by default so a review reads like a clip on
 * repeat rather than something to operate.
 *
 * One player instance per mounted screen — never mount this in a list.
 */
export function FootagePlayer({
  uri,
  loop = true,
  muted = true,
  autoPlay = true,
  nativeControls = false,
  accessibilityLabel,
  onError,
}: {
  uri: string;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  nativeControls?: boolean;
  accessibilityLabel?: string;
  onError?: () => void;
}) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = loop;
    instance.muted = muted;
    if (autoPlay) instance.play();
  });

  useEffect(() => {
    if (!onError || typeof player.addListener !== "function") return;
    const sub = player.addListener("statusChange", (payload: { status?: string; error?: unknown }) => {
      if (payload.status === "error" || payload.error) onError();
    });
    return () => sub.remove();
  }, [player, onError]);

  // Pause on unmount so audio never outlives the screen.
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // The player may already be released; nothing to do.
      }
    };
  }, [player]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: color.bg }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls={nativeControls}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}
