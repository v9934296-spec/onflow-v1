import { Stack } from "expo-router";
import { color } from "@/ui/tokens";

/** First-run onboarding. No back gesture — steps navigate themselves. */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
        contentStyle: { backgroundColor: color.bg },
      }}
    />
  );
}
