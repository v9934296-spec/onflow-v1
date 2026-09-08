import { useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { StageList } from "@/ui/components/StageList";
import { UploadProgress } from "@/ui/components/UploadProgress";
import { ErrorPanel } from "@/ui/components/States";
import { AsphaltSurface } from "@/ui/components/AsphaltSurface";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { getOutbox } from "@/store/outbox";
import { pollJob, runOutboxRow } from "@/store/upload";
import { queryClient } from "@/store/queryClient";
import { analyzingFailureKind, analyzingPhase, isTerminal, progressFraction } from "@/domain/outbox";
import type { AnalysisResult, OutboxRow } from "@/domain/models";
import { asErrorKind, type ErrorKind } from "@/ui/copy/errors";

export default function AnalyzingScreen() {
  const { localId } = useLocalSearchParams<{ localId: string }>();
  const router = useRouter();
  const [row, setRow] = useState<OutboxRow | null>(null);
  const [job, setJob] = useState<AnalysisResult | null>(null);
  const [slow, setSlow] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 45_000);
    return () => clearTimeout(t);
  }, [retryNonce]);

  useEffect(() => {
    if (!localId) return;
    let cancelled = false;
    let delay = 2000;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const current = await getOutbox(localId);
      if (cancelled || !current) return;
      setRow(current);

      if (current.state === "ready" && current.clipId) {
        router.replace(`/result?clipId=${current.clipId}&localId=${localId}`);
        return;
      }

      if (current.state === "failed_permanent" || current.state === "failed_retryable") {
        return;
      }

      if (
        current.state === "pending" ||
        current.state === "presigning" ||
        current.state === "uploading" ||
        current.state === "uploaded" ||
        current.state === "requesting_analysis"
      ) {
        void runOutboxRow(localId);
      }

      if (current.clipId && current.state === "analyzing") {
        const polled = await pollJob(current.clipId);
        if (cancelled) return;
        if (polled.ok) {
          setJob(polled.data);
          if (polled.data.status === "completed") {
            queryClient.setQueryData(["result", current.clipId], polled.data);
            await runOutboxRow(localId);
            router.replace(`/result?clipId=${current.clipId}&localId=${localId}`);
            return;
          }
          if (polled.data.status === "failed") {
            await runOutboxRow(localId);
            const failed = await getOutbox(localId);
            if (failed) setRow(failed);
            return;
          }
        } else if (
          polled.error.kind !== "offline" &&
          polled.error.kind !== "rate_limited" &&
          polled.error.kind !== "server" &&
          (polled.error.status ?? 0) < 500
        ) {
          await runOutboxRow(localId);
          const failed = await getOutbox(localId);
          if (failed) setRow(failed);
          return;
        }
      }

      const latest = await getOutbox(localId);
      if (cancelled) return;
      if (latest) setRow(latest);
      if (latest?.state === "ready" && latest.clipId) {
        router.replace(`/result?clipId=${latest.clipId}&localId=${localId}`);
        return;
      }
      if (latest && isTerminal(latest)) return;
      if (latest?.state === "failed_retryable") return;
      if (Date.now() - started > 5 * 60_000) return;
      delay = Date.now() - started > 30_000 ? 5000 : 2000;
      timer = setTimeout(() => void tick(), delay);
    };

    void tick();
    const app = AppState.addEventListener("change", (next) => {
      if (next === "active") void tick();
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      app.remove();
    };
  }, [localId, router, retryNonce]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/capture");
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const phase = analyzingPhase(row?.state ?? "pending", job?.status ?? null);
  const fraction = row ? progressFraction(row) : null;
  const failureKind: ErrorKind = asErrorKind(
    analyzingFailureKind(row?.errorKind ?? null, job?.failureReason ?? null),
  );

  function onFailurePrimary() {
    if (
      failureKind === "quota_exhausted" ||
      failureKind === "tier_gate"
    ) {
      router.replace("/paywall");
      return;
    }
    if (failureKind === "auth_expired") {
      router.replace("/sign-in");
      return;
    }
    if (
      failureKind === "upload_failed_retryable" ||
      failureKind === "offline" ||
      failureKind === "rate_limited" ||
      failureKind === "analysis_failed" ||
      failureKind === "contract_error" ||
      failureKind === "unknown"
    ) {
      if (!localId) return;
      setJob(null);
      setSlow(false);
      void runOutboxRow(localId).then(() => setRetryNonce((n) => n + 1));
      return;
    }
    router.replace("/capture");
  }

  if (phase === "FAILED") {
    return (
      <AsphaltSurface>
        <ScreenSafeArea style={{ justifyContent: "center" }}>
          <ErrorPanel kind={failureKind} onPrimary={onFailurePrimary} />
          <Button label="Home" variant="secondary" onPress={() => router.replace("/")} />
        </ScreenSafeArea>
      </AsphaltSurface>
    );
  }

  return (
    <AsphaltSurface>
      <ScreenSafeArea style={{ padding: space.xxl, justifyContent: "center", gap: space.lg }}>
        <ScreenHeader kicker="Queue" title={phase} />
        <StageList phase={phase} />
        {phase === "UPLOADING" ? <UploadProgress fraction={fraction} /> : null}
        {phase !== "UPLOADING" ? (
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>
            {slow
              ? "Still reviewing. You can keep filming — this'll be in your History when it's done."
              : "Reviewing the clip you called. This is not trick detection."}
          </Text>
        ) : null}
        <Button label="Keep filming" variant="secondary" onPress={() => router.replace("/capture")} />
      </ScreenSafeArea>
    </AsphaltSurface>
  );
}
