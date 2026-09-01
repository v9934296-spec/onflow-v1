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
import { initOutbox } from "@/store/outbox";
import { drainRecoverable } from "@/store/upload";
import { color } from "@/ui/tokens";

function AuthGate({ children }: { children: ReactNode }) {
  const phase = useAuthStore((s) => s.phase);
  const hydrate = useAuthStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void initOutbox();
    void hydrate();
    useSessionStore.getState().hydrateFromKv();
  }, [hydrate]);

  useEffect(() => {
    if (phase !== "signed_in") return;
    const userId = useAuthStore.getState().userId;
    if (userId) void drainRecoverable(userId);
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      const id = useAuthStore.getState().userId;
      if (id) void drainRecoverable(id);
    });
    return () => sub.remove();
  }, [phase]);

  useEffect(() => {
    if (phase === "loading") return;
    const onSignIn = segments[0] === "sign-in";
    if (phase === "signed_out" && !onSignIn) router.replace("/sign-in");
    if (phase === "signed_in" && onSignIn) router.replace("/");
  }, [phase, segments, router]);

  if (phase === "loading") {
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
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="trick" />
          <Stack.Screen name="capture" options={{ gestureEnabled: false }} />
          <Stack.Screen name="analyzing" options={{ gestureEnabled: false }} />
          <Stack.Screen name="result" />
          <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
