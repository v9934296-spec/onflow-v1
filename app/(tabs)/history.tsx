import { Text, View } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { EmptyState } from "@/ui/components/States";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useAuthStore } from "@/store/authStore";
import { listOutboxForUser } from "@/store/outbox";
import { useEffect, useState } from "react";
import type { OutboxRow } from "@/domain/models";

export default function HistoryScreen() {
  const userId = useAuthStore((s) => s.userId);
  const [rows, setRows] = useState<OutboxRow[]>([]);
  useEffect(() => {
    if (!userId) return;
    void listOutboxForUser(userId).then(setRows);
  }, [userId]);

  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.md }}>
      <ScreenHeader
        kicker="Record"
        title="HISTORY"
        subtitle="Individual scores only. No averages, trends, or cross-provider comparison."
      />
      {rows.length === 0 ? (
        <EmptyState title="No clips yet" body="Filmed attempts show up here with their real state — queued, uploading, analyzing, ready, or failed." />
      ) : (
        rows.map((row) => (
          <View key={row.localId} style={{ paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: color.hairline }}>
            <Text style={{ ...textStyle.mono, color: color.alum }}>{row.state.toUpperCase()}</Text>
            <Text style={{ ...textStyle.body, color: color.textPrimary }}>{row.mediaKind} · {Math.round(row.durationSeconds)}s</Text>
          </View>
        ))
      )}
    </ScreenSafeArea>
  );
}
