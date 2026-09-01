import { ActivityIndicator, Pressable, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { color, textStyle, touchTarget } from "@/ui/tokens";
import { resolveCenterAction } from "@/domain/centerAction";
import { resumeHref } from "@/domain/outbox";
import { useSessionStore } from "@/store/sessionStore";
import { discardRecoverable, listRecoverable } from "@/store/outbox";
import { useAuthStore } from "@/store/authStore";
import { startFreeSkateSession } from "@/store/sessionActions";
import { ConfirmDialog } from "@/ui/components/Form";
import { useCallback, useEffect, useState } from "react";
import type { LocalId } from "@/domain/types/ids";

export default function TabsLayout() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const trick = useSessionStore((s) => s.trick);
  const hydrating = useSessionStore((s) => s.hydrating);
  const userId = useAuthStore((s) => s.userId);
  const [drafts, setDrafts] = useState(0);
  const [resumeId, setResumeId] = useState<LocalId | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const refreshDrafts = useCallback(async () => {
    if (!userId) {
      setDrafts(0);
      setResumeId(null);
      return;
    }
    const rows = await listRecoverable(userId);
    setDrafts(rows.length);
    setResumeId(rows[0]?.localId ?? null);
  }, [userId]);

  useEffect(() => {
    void refreshDrafts();
  }, [refreshDrafts]);

  const action = resolveCenterAction({
    hydrating,
    hasSession: session != null,
    hasTrick: trick != null,
    hasRecoverableDraft: drafts > 0,
  });

  return (
    <>
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
                    if (action === "FILM") {
                      router.push("/capture");
                      return;
                    }
                    if (action === "RESUME") {
                      setResumeOpen(true);
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
                {action === "HYDRATING" ? (
                  <ActivityIndicator color={color.bg} />
                ) : (
                  <Text style={{ ...textStyle.label, color: color.bg }}>{action}</Text>
                )}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen name="history" options={{ title: "History" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
      <ConfirmDialog
        visible={resumeOpen}
        title="Resume queued clip?"
        body="There's a clip still waiting. Resume it, or drop the local reference. Library originals are never deleted."
        primaryLabel="Resume"
        secondaryLabel="Discard"
        onPrimary={() => {
          setResumeOpen(false);
          if (resumeId) router.push(resumeHref(resumeId));
        }}
        onSecondary={() => {
          void (async () => {
            if (userId) await discardRecoverable(userId);
            setResumeOpen(false);
            await refreshDrafts();
          })();
        }}
      />
    </>
  );
}
