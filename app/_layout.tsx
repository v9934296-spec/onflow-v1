import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  BebasNeue_400Regular,
} from "@expo-google-fonts/bebas-neue";
import {
  Sora_400Regular,
  Sora_600SemiBold,
} from "@expo-google-fonts/sora";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { queryClient } from "@/store/queryClient";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { initOutbox } from "@/store/outbox";
import { reconcileOwnedWork, subscribeReconcileTriggers } from "@/store/reconcile";
import {
  isOnboardingComplete,
  onboardingSteps,
  resolveEntryRoute,
  resumeStep,
} from "@/domain/skaterProfile";
import { color } from "@/ui/tokens";

/**
 * Routes on authentication plus server-confirmed onboarding. A profile that is
 * unavailable (endpoint not deployed, or unreachable with nothing cached)
 * never blocks a skater from Home; onboarding is retried on the next load.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const phase = useAuthStore((s) => s.phase);
  const userId = useAuthStore((s) => s.userId);
  const hydrate = useAuthStore((s) => s.hydrate);
  const profileStatus = useSkaterProfileStore((s) => s.status);
  const completed = useSkaterProfileStore((s) => isOnboardingComplete(s.profile));
  const draftStep = useSkaterProfileStore((s) => s.draftStep);
  const loadProfile = useSkaterProfileStore((s) => s.load);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void initOutbox();
    void hydrate();
    useSessionStore.getState().hydrateFromKv();
  }, [hydrate]);

  useEffect(() => {
    if (phase !== "signed_in" || !userId) return;
    void loadProfile(userId);
  }, [phase, userId, loadProfile]);

  // Everything the phone owes the server is retried on sign-in and every foreground.
  useEffect(() => {
    if (phase !== "signed_in") return;
    const settle = () => {
      const current = useAuthStore.getState().userId;
      if (!current) return;
      void reconcileOwnedWork(current);
    };
    settle();
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      settle();
      const current = useAuthStore.getState().userId;
      if (current && useSkaterProfileStore.getState().status !== "loaded") void loadProfile(current);
    });
    const stopNet = subscribeReconcileTriggers(settle);
    return () => {
      sub.remove();
      stopNet();
    };
  }, [phase, loadProfile]);

  const route = resolveEntryRoute({ phase, profileStatus, completed });

  useEffect(() => {
    if (route === "loading") return;
    const onSignIn = segments[0] === "sign-in";
    const inOnboarding = segments[0] === "(onboarding)";
    if (route === "sign-in") {
      if (!onSignIn) router.replace("/sign-in");
      return;
    }
    if (route === "onboarding") {
      if (!inOnboarding) router.replace(`/(onboarding)/${resumeStep(draftStep, onboardingSteps())}`);
      return;
    }
    if (onSignIn || inOnboarding) router.replace("/");
  }, [route, segments, router, draftStep]);

  if (route === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={color.neon} />
      </View>
    );
  }
  return children;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Sora_400Regular,
    Sora_600SemiBold,
    JetBrainsMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={color.neon} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="trick" />
          <Stack.Screen name="capture" options={{ gestureEnabled: false }} />
          <Stack.Screen name="review" options={{ gestureEnabled: false }} />
          <Stack.Screen name="analyzing" options={{ gestureEnabled: false }} />
          <Stack.Screen name="result" options={{ gestureEnabled: false }} />
          <Stack.Screen name="personalization" />
          <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
