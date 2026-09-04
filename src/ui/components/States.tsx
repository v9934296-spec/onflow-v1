import { Text, View } from "react-native";
import { color, space, textStyle } from "../tokens";
import { errorCopy, type ErrorKind } from "../copy/errors";
import { Button } from "./Button";

export function ErrorPanel({
  kind,
  onPrimary,
}: {
  kind: ErrorKind;
  onPrimary?: () => void;
}) {
  const copy = errorCopy[kind];
  return (
    <View style={{ gap: space.md, padding: space.lg }}>
      <Text style={{ ...textStyle.h2, color: color.textPrimary }}>{copy.title}</Text>
      <Text style={{ ...textStyle.body, color: color.textSecondary }}>{copy.body}</Text>
      {onPrimary ? <Button label={copy.primaryAction} onPress={onPrimary} /> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: space.sm, padding: space.lg }}>
      <Text style={{ ...textStyle.h2, color: color.textPrimary }}>{title}</Text>
      <Text style={{ ...textStyle.body, color: color.textSecondary }}>{body}</Text>
    </View>
  );
}

export function OfflineBadge({ queued }: { queued: number }) {
  return (
    <View
      style={{
        paddingVertical: space.sm,
        paddingHorizontal: space.lg,
        backgroundColor: color.surfaceAlt,
        borderWidth: 1,
        borderColor: color.hairline,
        borderRadius: 6,
      }}
    >
      <Text style={{ ...textStyle.mono, color: color.amber }}>
        {`OFFLINE — QUEUED ${queued}`}
      </Text>
    </View>
  );
}

export function QueuedBadge({ count }: { count: number }) {
  return (
    <View
      style={{
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        borderRadius: 6,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: color.hairlineHi,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...textStyle.mono, color: color.alum }}>{`QUEUED ${count}`}</Text>
    </View>
  );
}

export function Skeleton({ height = 16 }: { height?: number }) {
  return (
    <View
      style={{
        height,
        borderRadius: 6,
        backgroundColor: color.surfaceAlt,
        marginVertical: 6,
      }}
    />
  );
}
