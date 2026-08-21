import { Pressable, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { color, textStyle, touchTarget } from "@/ui/tokens";
import { resolveCenterAction } from "@/domain/centerAction";
import { useSessionStore } from "@/store/sessionStore";
import { listRecoverable } from "@/store/outbox";
import { useAuthStore } from "@/store/authStore";
import { startFreeSkateSession } from "@/store/sessionActions";
import { useEffect, useState } from "react";

export default function TabsLayout() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  const hydrating = useSessionStore((s) => s.hydrating);
  const userId = useAuthStore((s) => s.userId);
  const [drafts, setDrafts] = useState(0);

  useEffect(() => {
    if (!userId) return;
    void listRecoverable(userId).then((rows) => setDrafts(rows.length));
  }, [userId]);

  const action = resolveCenterAction({
    hydrating,
    hasSession: session != null,
    hasTrick: trick != null,
    hasRecoverableDraft: drafts > 0,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: color.bg, borderTopColor: color.hairline },
        tabBarActiveTintColor: color.neon,
        tabBarInactiveTintColor: color.textTertiary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="flow" options={{ title: "Flow" }} />
      <Tabs.Screen
        name="center"
        options={{
          title: action === "HYDRATING" ? "…" : action,
          tabBarButton: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action}
              disabled={action === "HYDRATING"}
              onPress={() => {
                void (async () => {
                  if (action === "START") {
                    const created = await startFreeSkateSession();
                    if (created.ok) router.push("/trick");
                    return;
                  }
                  if (action === "CHOOSE TRICK") {
                    router.push("/trick");
                    return;
                  }
                  if (action === "FILM" || action === "RESUME") {
                    router.push("/capture");
                  }
                })();
              }}
              style={{
                minWidth: touchTarget.captureControl,
                minHeight: touchTarget.captureControl,
                marginTop: -18,
                borderRadius: 999,
                backgroundColor: color.neon,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...textStyle.label, color: color.bg }}>{action}</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
