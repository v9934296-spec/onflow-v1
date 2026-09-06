import { useEffect, useState } from "react";
import { Text } from "react-native";
import { elapsedSeconds, formatDuration } from "../../domain/attempts";
import { color, textStyle } from "../tokens";

/** Session running time from a server `started_at`. Ticks once a second; it is a clock, not decoration. */
export function SessionClock({ startedAt, tone = "primary" }: { startedAt: string; tone?: "primary" | "secondary" }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = elapsedSeconds(startedAt, now);
  return (
    <Text
      accessibilityLabel={`Session time ${formatDuration(seconds)}`}
      style={{ ...textStyle.monoLg, color: tone === "primary" ? color.textPrimary : color.textSecondary }}
    >
      {formatDuration(seconds)}
    </Text>
  );
}
