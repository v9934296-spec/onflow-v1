import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { EmptyState } from "@/ui/components/States";
import { SyncStatus } from "@/ui/components/SyncStatus";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useAuthStore } from "@/store/authStore";
import { listOutboxForUser, listRecoverable } from "@/store/outbox";
import { useSessionAttemptsStore } from "@/store/sessionAttempts";
import { useSessionStore } from "@/store/sessionStore";
import { reconcileOwnedWork } from "@/store/reconcile";
import { useOffline } from "@/ui/hooks/useOffline";
import { useEffect, useState } from "react";
import type { OutboxRow } from "@/domain/models";
import { historyRowHref } from "@/domain/outbox";

export default function HistoryScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const queue = useSessionAttemptsStore((s) => s.queue);
  const retryDead = useSessionAttemptsStore((s) => s.retryDead);
  const dismissDead = useSessionAttemptsStore((s) => s.dismissDead);
  const sessionEndPending = useSessionStore((s) => s.pendingEnd != null);
  const offline = useOffline();
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [clipsQueued, setClipsQueued] = useState(0);
  useEffect(() => {
    if (!userId) return;
    void listOutboxForUser(userId).then(setRows);
    void listRecoverable(userId).then((recoverable) => setClipsQueued(recoverable.length));
    void useSessionAttemptsStore.getState().load(userId, useSessionStore.getState().session?.id ?? null);
  }, [userId]);

  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.md }}>
      <ScreenHeader
        kicker="Record"
        title="HISTORY"
        subtitle="Individual scores only. No averages, trends, or cross-provider comparison."
      />
      <SyncStatus
        queue={queue}
        clipsQueued={clipsQueued}
        sessionEndPending={sessionEndPending}
        offline={offline}
        onRetry={() => {
          if (!userId) return;
          void retryDead(userId);
          void reconcileOwnedWork(userId);
        }}
        onDismissDead={(key) => {
          if (userId) dismissDead(userId, key);
        }}
      />
      {rows.length === 0 ? (
        <EmptyState title="No clips yet" body="Filmed attempts show up here with their real state — queued, uploading, analyzing, ready, or failed." />
      ) : (
        rows.map((row) => {
          const href = historyRowHref(row);
          return (
            <Pressable
              key={row.localId}
              disabled={!href}
              accessibilityRole={href ? "button" : undefined}
              onPress={() => {
                if (href) router.push(href);
              }}
              style={{ paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: color.hairline }}
            >
              <Text style={{ ...textStyle.mono, color: color.alum }}>{row.state.toUpperCase()}</Text>
              <Text style={{ ...textStyle.body, color: color.textPrimary }}>
                {[row.trick?.canonicalName, row.mediaKind, `${Math.round(row.durationSeconds)}s`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </Pressable>
          );
        })
      )}
    </ScreenSafeArea>
  );
}
