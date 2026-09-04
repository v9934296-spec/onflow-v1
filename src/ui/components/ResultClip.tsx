import { useEffect, useState } from "react";
import { View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { radius } from "../tokens";
import { ErrorPanel } from "./States";

/** Missing media renders as nothing. Playback failure is a catalog state, not a fake frame. */
export function ResultClip({ uri }: { uri: string | null }) {
  if (!uri) return null;
  return <PlayingClip uri={uri} />;
}

function PlayingClip({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  useEffect(() => {
    const sub = player.addListener("statusChange", (payload) => {
      if (payload.status === "error" || payload.error) setFailed(true);
    });
    return () => sub.remove();
  }, [player]);

  if (failed) return <ErrorPanel kind="clip_unreadable" />;

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: radius.md,
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}
