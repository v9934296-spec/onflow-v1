import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ScreenHero, ScreenSafeArea } from "@/ui/components/ScreenChrome";

export default function SavedScreen() {
  const router = useRouter();
  const { facts } = useLocalSearchParams<{ facts?: string }>();
  const lines = (typeof facts === "string" ? facts : "").split("\n").filter(Boolean).slice(0, 3);

  return (
    <ScreenSafeArea style={{ padding: space.xl, justifyContent: "center", gap: space.lg }}>
      <ScreenHero kicker="Saved" title="IN HISTORY" />
      {lines.map((line) => (
        <Text key={line} style={{ ...textStyle.h2, color: color.textPrimary }}>
          {line}
        </Text>
      ))}
      <View style={{ gap: space.md, marginTop: space.lg }}>
        <Button label="Film again" onPress={() => router.replace("/capture")} />
        <Button label="Home" variant="secondary" onPress={() => router.replace("/")} />
      </View>
    </ScreenSafeArea>
  );
}
