import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attemptsForSession, mergeAttempts, nextAttemptNumber } from "@/domain/attempts";
import { useSessionAttemptsStore } from "@/store/sessionAttempts";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { RecordControl } from "@/ui/components/RecordControl";
import { ErrorPanel } from "@/ui/components/States";
import { Toast } from "@/ui/components/Toast";
import { CameraScrims } from "@/ui/components/CameraScrims";
import { AsphaltSurface } from "@/ui/components/AsphaltSurface";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useSessionStore } from "@/store/sessionStore";
import { enqueueClip } from "@/store/enqueueClip";
import { compressionContract } from "@/domain/compression";
import { mimeFromUri } from "@/domain/tricks";
import type { ErrorKind } from "@/ui/copy/errors";

const LOW_STORAGE_BYTES = 200 * 1024 * 1024;

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { import: importParam } = useLocalSearchParams<{ import?: string }>();
  const trick = useSessionStore((s) => s.trick);
  const session = useSessionStore((s) => s.session);
  const confirmedAttempts = useSessionAttemptsStore((s) => s.confirmed);
  const pendingAttempts = useSessionAttemptsStore((s) => s.pending);
  const importLaunched = useRef(false);
  const camera = useRef<CameraView>(null);
  const startedAt = useRef<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [lowStorage, setLowStorage] = useState(false);
  const [largeFile, setLargeFile] = useState(false);

  useEffect(() => {
    void FileSystem.getFreeDiskStorageAsync()
      .then((free) => setLowStorage(free < LOW_STORAGE_BYTES))
      .catch(() => undefined);
  }, []);

  // Opened from IMPORT CLIP: go straight to the library, once.
  useEffect(() => {
    if (importParam !== "1" || importLaunched.current) return;
    importLaunched.current = true;
    void pickLibrary(finish, setError);
  }, [importParam]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      if (startedAt.current == null) return;
      setElapsed(Math.min(compressionContract.maxDurationSeconds, (Date.now() - startedAt.current) / 1000));
    }, 200);
    return () => clearInterval(timer);
  }, [recording]);

  async function finish(uri: string, durationSeconds: number, mediaKind: "recorded" | "imported") {
    const info = await FileSystem.getInfoAsync(uri);
    const sizeBytes = info.exists && "size" in info && typeof info.size === "number" ? info.size : 1;
    if (sizeBytes > compressionContract.maxBytes * 0.8) setLargeFile(true);
    if (sizeBytes > compressionContract.maxBytes) {
      setError("clip_too_large");
      return;
    }
    if (durationSeconds > compressionContract.maxDurationSeconds) {
      setError("clip_too_long");
      return;
    }
    const localId = await enqueueClip({
      uri,
      durationSeconds,
      sizeBytes,
      mimeType: mimeFromUri(uri),
      mediaKind,
      capturedAt: new Date().toISOString(),
    });
    if (localId) router.replace(`/analyzing?localId=${localId}`);
    else setError("clip_too_long");
  }

  if (error) {
    return (
      <AsphaltSurface>
        <ScreenSafeArea style={{ justifyContent: "center" }}>
          <ErrorPanel kind={error} onPrimary={() => setError(null)} />
          <Button label="Close" variant="secondary" onPress={() => router.back()} />
        </ScreenSafeArea>
      </AsphaltSurface>
    );
  }

  if (!permission) {
    return (
      <AsphaltSurface>
        <View style={{ flex: 1 }} />
      </AsphaltSurface>
    );
  }

  if (!permission.granted) {
    const permanent = !permission.canAskAgain;
    return (
      <AsphaltSurface>
        <ScreenSafeArea style={{ padding: space.xl, justifyContent: "center", gap: space.md }}>
          {permanent ? (
            <>
              <ErrorPanel kind="unknown" />
              <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
            </>
          ) : (
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          )}
          <Button
            label="Pick from library"
            variant="secondary"
            onPress={() => void pickLibrary(finish, setError)}
          />
          <Button label="Close" variant="secondary" onPress={() => router.back()} />
        </ScreenSafeArea>
      </AsphaltSurface>
    );
  }

  if (lowStorage) {
    return (
      <AsphaltSurface>
        <ScreenSafeArea style={{ justifyContent: "center" }}>
          <ErrorPanel kind="low_storage" onPrimary={() => setLowStorage(false)} />
          <Button
            label="Pick from library"
            variant="secondary"
            onPress={() => void pickLibrary(finish, setError)}
          />
        </ScreenSafeArea>
      </AsphaltSurface>
    );
  }

  const overlayScale = { maxFontSizeMultiplier: 1.3 } as const;
  const attemptNumber =
    trick && session
      ? nextAttemptNumber(attemptsForSession(mergeAttempts(confirmedAttempts, pendingAttempts), session.id), trick.trickId)
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <CameraView ref={camera} style={{ flex: 1 }} mode="video" mute={false}>
        <CameraScrims />
        <View
          style={{
            position: "absolute",
            top: insets.top + space.md,
            left: space.lg,
            right: space.lg,
            gap: space.sm,
          }}
        >
          <Text {...overlayScale} style={{ ...textStyle.h2, color: color.textPrimary }}>
            {trick?.canonicalName ?? "No trick"}
          </Text>
          {trick?.stance || trick?.direction ? (
            <Text {...overlayScale} style={{ ...textStyle.mono, color: color.textPrimary }}>
              {[trick.stance, trick.direction].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {attemptNumber != null ? (
            <Text
              {...overlayScale}
              accessibilityLabel={`Attempt ${attemptNumber}`}
              style={{ ...textStyle.monoLg, color: color.neon }}
            >
              ATTEMPT {String(attemptNumber).padStart(2, "0")}
            </Text>
          ) : null}
          <Text
            accessibilityLabel={`Elapsed ${Math.floor(elapsed)} seconds of ${compressionContract.maxDurationSeconds}`}
            style={{ ...textStyle.mono, color: color.textPrimary }}
          >
            {formatElapsed(elapsed)} / {compressionContract.maxDurationSeconds}S · TAP TO{" "}
            {recording ? "STOP" : "START"}
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: Math.max(insets.bottom, space.md) + space.sm,
            left: 0,
            right: 0,
            alignItems: "center",
            gap: space.md,
            paddingHorizontal: space.lg,
          }}
        >
          {largeFile ? (
            <Toast body="This file is large. Over 100MB it won't upload." />
          ) : null}
          <RecordControl
            recording={recording}
            onPress={() => {
              void (async () => {
                if (!recording) {
                  setRecording(true);
                  startedAt.current = Date.now();
                  setElapsed(0);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                  try {
                    const clip = await camera.current?.recordAsync({
                      maxDuration: compressionContract.maxDurationSeconds,
                    });
                    const seconds = startedAt.current
                      ? Math.min(
                          compressionContract.maxDurationSeconds,
                          Math.max(1, (Date.now() - startedAt.current) / 1000),
                        )
                      : compressionContract.maxDurationSeconds;
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                    if (clip?.uri) await finish(clip.uri, seconds, "recorded");
                  } finally {
                    startedAt.current = null;
                    setRecording(false);
                    setElapsed(0);
                  }
                  return;
                }
                camera.current?.stopRecording();
              })();
            }}
          />
          <Button label="Library" variant="secondary" onPress={() => void pickLibrary(finish, setError)} />
          <Button label="Close" variant="secondary" onPress={() => router.back()} />
        </View>
      </CameraView>
    </View>
  );
}

function formatElapsed(seconds: number): string {
  const whole = Math.floor(seconds);
  const mm = String(Math.floor(whole / 60)).padStart(2, "0");
  const ss = String(whole % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

async function pickLibrary(
  finish: (uri: string, durationSeconds: number, kind: "recorded" | "imported") => Promise<void>,
  setError: (kind: ErrorKind) => void,
) {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"] });
  if (picked.canceled || !picked.assets[0]) return;
  const asset = picked.assets[0];
  const duration = Math.max(1, (asset.duration ?? 1000) / 1000);
  if (duration > compressionContract.maxDurationSeconds) {
    setError("clip_too_long");
    return;
  }
  await finish(asset.uri, duration, "imported");
}
