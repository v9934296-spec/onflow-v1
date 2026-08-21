import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { color, media, space, textStyle, touchTarget } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ErrorPanel } from "@/ui/components/States";
import { useSessionStore } from "@/store/sessionStore";
import { enqueueClip } from "@/store/enqueueClip";
import { compressionContract } from "@/domain/compression";

export default function CaptureScreen() {
  const router = useRouter();
  const trick = useSessionStore((s) => s.trick);
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);

  async function finish(uri: string, durationSeconds: number, mediaKind: "recorded" | "imported", sizeBytes = 1) {
    const localId = await enqueueClip({
      uri,
      durationSeconds,
      sizeBytes,
      mimeType: "video/mp4",
      mediaKind,
      capturedAt: new Date().toISOString(),
    });
    if (localId) router.replace(`/analyzing?localId=${localId}`);
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xl, justifyContent: "center", gap: space.md }}>
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={() => void requestPermission()} />
        ) : (
          <ErrorPanel kind="unknown" />
        )}
        <Button
          label="Pick from library"
          variant="secondary"
          onPress={() => void pickLibrary(finish)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <CameraView ref={camera} style={{ flex: 1 }} mode="video" mute={false}>
        <View style={{ position: "absolute", top: 56, left: space.lg, right: space.lg }}>
          <Text style={{ ...textStyle.h2, color: color.textPrimary }}>
            {trick?.canonicalName ?? "No trick"}
          </Text>
          <Text style={{ ...textStyle.mono, color: color.textPrimary }}>
            MAX {compressionContract.maxDurationSeconds}S · TAP TO {recording ? "STOP" : "START"}
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 48,
            left: 0,
            right: 0,
            alignItems: "center",
            gap: space.md,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recording ? "Stop recording" : "Start recording"}
            onPress={() => {
              void (async () => {
                if (!recording) {
                  setRecording(true);
                  try {
                    const clip = await camera.current?.recordAsync({
                      maxDuration: compressionContract.maxDurationSeconds,
                    });
                    if (clip?.uri) {
                      await finish(clip.uri, compressionContract.maxDurationSeconds, "recorded");
                    }
                  } finally {
                    setRecording(false);
                  }
                  return;
                }
                camera.current?.stopRecording();
              })();
            }}
            style={{
              width: touchTarget.captureControl,
              height: touchTarget.captureControl,
              borderRadius: 999,
              backgroundColor: recording ? media.recording : color.neon,
              borderWidth: 4,
              borderColor: color.textPrimary,
            }}
          />
          <Button label="Library" variant="secondary" onPress={() => void pickLibrary(finish)} />
          <Button label="Close" variant="secondary" onPress={() => router.back()} />
        </View>
      </CameraView>
    </View>
  );
}

async function pickLibrary(
  finish: (uri: string, durationSeconds: number, kind: "recorded" | "imported", size?: number) => Promise<void>,
) {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"] });
  if (picked.canceled || !picked.assets[0]) return;
  const asset = picked.assets[0];
  const duration = Math.max(1, (asset.duration ?? 1000) / 1000);
  if (duration > compressionContract.maxDurationSeconds) return;
  await finish(
    asset.uri,
    duration,
    "imported",
    asset.fileSize ?? 1,
  );
}
