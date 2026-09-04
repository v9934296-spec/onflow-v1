import { Text } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useSessionStore } from "@/store/sessionStore";
import { closeSession } from "@/store/sessionActions";
import { useRouter } from "expo-router";

export default function FlowScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.lg }}>
      <ScreenHeader kicker="Session" title="FLOW" />
      {session ? (
        <>
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>
            Session open{trick ? ` · ${trick.canonicalName}` : ""}.
          </Text>
          <Button label="Film" onPress={() => router.push(trick ? "/capture" : "/trick")} />
          <Button label="End session" variant="secondary" onPress={() => void closeSession()} />
        </>
      ) : (
        <Text style={{ ...textStyle.body, color: color.textSecondary }}>
          No active session. Use START to begin a free skate.
        </Text>
      )}
    </ScreenSafeArea>
  );
}
