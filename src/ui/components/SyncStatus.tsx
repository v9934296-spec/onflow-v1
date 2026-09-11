import { Text, View } from "react-native";
import { color, space, textStyle } from "../tokens";
import { Button } from "./Button";
import { syncSummary, type AttemptQueueRow } from "../../domain/attemptQueue";

/**
 * Honest phone-vs-server state. Queued means the outcome is on disk.
 * Dead means retries stopped and the skater can retry or drop that row.
 */
export function SyncStatus({
  queue,
  clipsQueued,
  sessionEndPending,
  offline,
  onRetry,
  onDismissDead,
}: {
  queue: readonly AttemptQueueRow[];
  clipsQueued: number;
  sessionEndPending: boolean;
  offline: boolean;
  onRetry: () => void;
  onDismissDead?: (idempotencyKey: string) => void;
}) {
  const attempts = syncSummary(queue);
  const dead = queue.filter((row) => row.state === "dead");
  const waiting = attempts.queued + clipsQueued + (sessionEndPending ? 1 : 0);
  if (waiting === 0 && dead.length === 0) return null;

  return (
    <View
      accessibilityRole="summary"
      style={{
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        backgroundColor: color.surfaceAlt,
        borderWidth: 1,
        borderColor: dead.length > 0 ? color.red : color.hairline,
        borderRadius: 6,
      }}
    >
      {offline ? (
        <Text style={{ ...textStyle.mono, color: color.amber }}>OFFLINE</Text>
      ) : null}
      {waiting > 0 ? (
        <Text style={{ ...textStyle.mono, color: color.alum }}>
          {waiting === 1 ? "1 saved on this phone" : `${waiting} saved on this phone`}
        </Text>
      ) : null}
      {dead.length > 0 ? (
        <Text style={{ ...textStyle.mono, color: color.red }}>
          {dead.length === 1 ? "1 outcome needs a retry" : `${dead.length} outcomes need a retry`}
        </Text>
      ) : null}
      <Button label="Retry sync" variant="secondary" onPress={onRetry} />
      {dead.length > 0 && onDismissDead
        ? dead.slice(0, 3).map((row) => (
            <Button
              key={row.idempotencyKey}
              label={`Drop ${row.attempt.canonicalName}`}
              variant="secondary"
              onPress={() => onDismissDead(row.idempotencyKey)}
            />
          ))
        : null}
    </View>
  );
}
