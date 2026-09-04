import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { color, radius, space, textStyle, touchTarget } from "@/ui/tokens";
import { EmptyState, OfflineBadge, Skeleton } from "@/ui/components/States";
import { StateTag } from "@/ui/components/StateTag";
import { Chip } from "@/ui/components/Chip";
import { RailMark, ScreenHero, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { TickRuler } from "@/ui/components/Marks";
import { useAuthStore } from "@/store/authStore";
import { loadHistory, loadSessionAttemptList } from "@/store/history";
import { compressionContract } from "@/domain/compression";
import { resumeHref } from "@/domain/outbox";
import {
  groupScoredClipsByTrick,
  type HistoryClipItem,
  type HistorySessionItem,
  type HistoryTab,
} from "@/domain/history";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import type { Attempt } from "@/domain/models";

function tagTone(state: string): "alum" | "neon" | "danger" {
  if (state === "ready") return "neon";
  if (state === "failed") return "danger";
  return "alum";
}

export default function HistoryScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const [tab, setTab] = useState<HistoryTab>("clips");
  const [clips, setClips] = useState<HistoryClipItem[]>([]);
  const [sessions, setSessions] = useState<HistorySessionItem[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void (async () => {
        const bundle = await loadHistory(userId);
        setOffline(bundle.offline);
        setClips(bundle.clips);
        setSessions(bundle.sessions);
        setAttempts(bundle.attempts);
        setLoading(false);
      })();
    }, [userId]),
  );

  const trickGroups = groupScoredClipsByTrick(clips);

  return (
    <ScreenSafeArea>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: space.xxl }}
      >
        <ScreenHero kicker="Record" title="HISTORY">
          <Text style={{ ...textStyle.bodySm, color: color.textTertiary, marginTop: space.sm }}>
            Individual scores only. No averages, trends, or cross-provider comparison.
          </Text>
        </ScreenHero>
        {offline ? <OfflineBadge queued={clips.filter((row) => row.state === "queued").length} /> : null}
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Chip label="Clips" selected={tab === "clips"} onPress={() => setTab("clips")} />
          <Chip label="Sessions" selected={tab === "sessions"} onPress={() => setTab("sessions")} />
          <Chip label="Tricks" selected={tab === "tricks"} onPress={() => setTab("tricks")} />
        </View>

        {loading ? (
          <>
            <Skeleton height={88} />
            <Skeleton height={88} />
          </>
        ) : null}

        {!loading && tab === "clips" ? (
          clips.length === 0 ? (
            <EmptyHistory />
          ) : (
            clips.map((row) => (
              <Pressable
                key={row.key}
                accessibilityRole="button"
                accessibilityLabel={`${row.label}, ${row.state}${row.unread ? ", unread" : ""}`}
                onPress={() => {
                  if (row.state === "ready" && row.clipId) {
                    router.push({
                      pathname: "/result",
                      params: {
                        clipId: row.clipId,
                        ...(row.localId ? { localId: row.localId } : {}),
                      },
                    });
                    return;
                  }
                  if (row.localId) router.push(resumeHref(row.localId));
                }}
                style={{
                  minHeight: touchTarget.minimum,
                  gap: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: row.unread ? color.neon : color.hairline,
                  backgroundColor: color.surface,
                  padding: space.lg,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <StateTag tone={tagTone(row.state)}>{row.unread ? `unread · ${row.state}` : row.state}</StateTag>
                  {row.durationSeconds != null ? (
                    <Text style={{ ...textStyle.mono, color: color.alum }}>
                      {`${Math.round(row.durationSeconds)}s`}
                    </Text>
                  ) : null}
                </View>
                {row.thumbnailUrl ? (
                  <Image
                    source={{ uri: row.thumbnailUrl }}
                    style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: radius.sm }}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={{ ...textStyle.body, color: color.textPrimary }}>{row.label}</Text>
                {row.score != null ? (
                  <Text style={{ ...textStyle.mono, color: color.neon }}>
                    {row.score}
                    {row.providerModel ? ` · ${row.providerModel}` : ""}
                  </Text>
                ) : null}
                {row.durationSeconds != null ? (
                  <TickRuler progress={row.durationSeconds / compressionContract.maxDurationSeconds} />
                ) : null}
              </Pressable>
            ))
          )
        ) : null}

        {!loading && tab === "sessions" ? (
          sessions.length === 0 ? (
            <EmptyState title="No sessions yet" body="Ended sessions show up here. Open one to see the raw attempt list." />
          ) : (
            sessions.map((session) => <SessionRow key={session.sessionId} session={session} />)
          )
        ) : null}

        {!loading && tab === "tricks" ? (
          trickGroups.length === 0 && attempts.length === 0 ? (
            <EmptyState title="No tricks yet" body="Each score stays on its own row. Nothing is averaged across engines." />
          ) : (
            <>
              {trickGroups.map((group) => (
                <View
                  key={group.canonicalName}
                  style={{
                    gap: space.sm,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: color.hairline,
                    backgroundColor: color.surface,
                    padding: space.lg,
                  }}
                >
                  <Text style={{ ...textStyle.h2, color: color.textPrimary }}>{group.canonicalName}</Text>
                  {group.rows.map((row) => (
                    <Text key={row.id} style={{ ...textStyle.mono, color: color.alum }}>
                      {row.score != null
                        ? `${row.score}${row.providerModel ? ` · ${row.providerModel}` : ""}`
                        : row.loggedAt}
                    </Text>
                  ))}
                </View>
              ))}
              {attempts.map((attempt) => (
                <Text key={attempt.id} style={{ ...textStyle.body, color: color.textPrimary }}>
                  {attempt.canonicalName} · {attempt.outcome}
                </Text>
              ))}
            </>
          )
        ) : null}
      </ScrollView>
    </ScreenSafeArea>
  );
}

function EmptyHistory() {
  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.hairline,
        backgroundColor: color.surface,
        padding: space.lg,
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, opacity: 0.7 }}
      >
        <RailMark />
      </View>
      <EmptyState
        title="No clips yet"
        body="Filmed attempts show up here with their real state — queued, uploading, analyzing, ready, or failed."
      />
    </View>
  );
}

function SessionRow({ session }: { session: HistorySessionItem }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Attempt[] | null>(null);

  return (
    <View
      style={{
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: color.hairline,
        backgroundColor: color.surface,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={session.focusTrick ?? "Session"}
        onPress={() => {
          setOpen((value) => !value);
          if (rows == null) {
            void loadSessionAttemptList(session.sessionId).then(setRows);
          }
        }}
        style={{ minHeight: touchTarget.minimum, justifyContent: "center", gap: 4 }}
      >
        <Text style={{ ...textStyle.bodyLg, color: color.textPrimary }}>
          {session.focusTrick ?? "Session"}
        </Text>
        <Text style={{ ...textStyle.mono, color: color.alum }}>
          {session.attemptCount} attempts · {session.clipsCount} clips
        </Text>
      </Pressable>
      {open ? (
        rows == null ? (
          <Skeleton height={24} />
        ) : rows.length === 0 ? (
          <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>No attempts on this session.</Text>
        ) : (
          rows.map((attempt) => (
            <Text key={attempt.id} style={{ ...textStyle.body, color: color.textPrimary }}>
              {attempt.canonicalName} · {attempt.outcome}
            </Text>
          ))
        )
      ) : null}
    </View>
  );
}
