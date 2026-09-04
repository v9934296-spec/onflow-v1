import { Linking, ScrollView, Share, Text, View } from "react-native";
import { color, radius, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ConfirmDialog, TextField } from "@/ui/components/Form";
import { DeckMark, ScreenHero, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { EngineTeaser } from "@/ui/components/EngineTeaser";
import { ErrorPanel } from "@/ui/components/States";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { useFocusEffect, useRouter } from "expo-router";
import { discardRecoverable, listOutboxForUser, listRecoverable } from "@/store/outbox";
import { readRecentTrickIds } from "@/store/tricks";
import { loadQuota, requestAccountDeletion, requestAccountExport } from "@/store/account";
import { purgeLocalAttempts } from "@/store/attempts";
import { billingBlockedOffline, legalUrl } from "@/store/billing";
import { purgeHistoryCache } from "@/store/historyCache";
import { type ErrorKind } from "@/ui/copy/errors";
import { toCatalogErrorKind } from "@/domain/outbox";
import { useCallback, useState } from "react";

export default function ProfileScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const signOut = useAuthStore((s) => s.signOut);
  const session = useSessionStore((s) => s.session);
  const [queued, setQueued] = useState(0);
  const [clips, setClips] = useState(0);
  const [trickCount, setTrickCount] = useState(0);
  const [tier, setTier] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteError, setDeleteError] = useState(false);
  const [exportError, setExportError] = useState<ErrorKind | null>(null);
  const [offline, setOffline] = useState(() => billingBlockedOffline());

  useFocusEffect(
    useCallback(() => {
      setOffline(billingBlockedOffline());
      setTrickCount(readRecentTrickIds().length);
      if (!userId) return;
      void (async () => {
        const rows = await listOutboxForUser(userId);
        setClips(rows.length);
        const recoverable = await listRecoverable(userId);
        setQueued(recoverable.length);
        const quota = await loadQuota();
        if (quota.ok) {
          setTier(quota.data.tier);
          setRemaining(quota.data.analyses_remaining);
        }
      })();
    }, [userId]),
  );

  return (
    <ScreenSafeArea>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: space.xxl }}
      >
        <ScreenHero kicker="Account" title="PROFILE">
          <Text
            style={{ ...textStyle.mono, color: color.textTertiary, marginTop: space.sm }}
            selectable
          >
            {userId}
          </Text>
          <View style={{ height: 40, marginTop: space.lg }}>
            <DeckMark />
          </View>
        </ScreenHero>

        <Text style={{ ...textStyle.body, color: color.textSecondary }}>
          {tier
            ? `${tier}${remaining != null ? ` · ${remaining} analyses remaining` : ""}`
            : "Plan loads from the live account. Nothing is hardcoded here."}
        </Text>

        <View
          style={{
            flexDirection: "row",
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: color.hairline,
            overflow: "hidden",
            backgroundColor: color.hairline,
            gap: 1,
          }}
        >
          <Stat label="Session" value={session ? "Open" : "None"} />
          <Stat label="Clips" value={String(clips)} />
          <Stat label="Tricks" value={String(trickCount)} />
        </View>

        <EngineTeaser onPress={() => router.push("/engine")} />

        <Button label="History" variant="secondary" onPress={() => router.push("/history")} />
        <Button label="Subscription" onPress={() => router.push("/paywall")} />
        <Button
          label="Export my data"
          variant="secondary"
          onPress={() => {
            if (billingBlockedOffline()) {
              setOffline(true);
              setExportError("offline");
              return;
            }
            void requestAccountExport().then((res) => {
              if (!res.ok) {
                setExportError(toCatalogErrorKind(res.error.kind, "unknown"));
                return;
              }
              setExportError(null);
              void Share.share({ message: JSON.stringify(res.data) });
            });
          }}
        />
        {exportError ? <ErrorPanel kind={exportError} onPrimary={() => setExportError(null)} /> : null}
        <Button label="Terms" variant="secondary" onPress={() => void Linking.openURL(legalUrl("terms"))} />
        <Button label="Privacy" variant="secondary" onPress={() => void Linking.openURL(legalUrl("privacy"))} />

        <View
          style={{
            gap: space.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: "rgba(255,59,59,0.3)",
            backgroundColor: color.surface,
            padding: space.lg,
          }}
        >
          <Text style={{ ...textStyle.label, color: color.red }}>Destructive</Text>
          {offline ? (
            <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>
              Needs a connection. Account deletion is not queued.
            </Text>
          ) : (
            <>
              <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>
                Type DELETE to permanently remove this account.
              </Text>
              <TextField
                value={deleteText}
                onChangeText={(next) => {
                  setDeleteText(next);
                  setDeleteError(false);
                }}
                placeholder="DELETE"
                accessibilityLabel="Type DELETE to confirm account deletion"
              />
              {deleteError ? <ErrorPanel kind="unknown" onPrimary={() => setDeleteError(false)} /> : null}
              <Button
                label="Delete account"
                variant="destructive"
                disabled={deleteText !== "DELETE"}
                onPress={() => {
                  void (async () => {
                    const res = await requestAccountDeletion();
                    if (!res.ok) {
                      setDeleteError(true);
                      return;
                    }
                    if (userId) {
                      await discardRecoverable(userId);
                      purgeHistoryCache(userId);
                      purgeLocalAttempts(userId);
                    }
                    await signOut();
                  })();
                }}
              />
            </>
          )}
          <Button label="Sign out" variant="destructive" onPress={() => setSignOutOpen(true)} />
          <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>
            {queued > 0
              ? `${queued} queued clip${queued === 1 ? "" : "s"} stay sealed to this account for 30 days. Another account cannot see or upload them.`
              : "No queued clips on this account."}
          </Text>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={signOutOpen}
        title="Sign out?"
        body={
          queued > 0
            ? `${queued} queued clip${queued === 1 ? "" : "s"} stay sealed to this account for 30 days. Another account cannot see or upload them.`
            : "You can sign back in to this account at any time."
        }
        primaryLabel="Sign out"
        secondaryLabel="Stay"
        onPrimary={() => {
          setSignOutOpen(false);
          void signOut();
        }}
        onSecondary={() => setSignOutOpen(false)}
      />
    </ScreenSafeArea>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.surface, paddingHorizontal: space.md, paddingVertical: space.lg, gap: 4 }}>
      <Text
        style={{
          ...textStyle.label,
          fontSize: 11,
          letterSpacing: 1.4,
          color: color.textTertiary,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text style={{ ...textStyle.mono, fontSize: 17, color: color.textPrimary }}>{value}</Text>
    </View>
  );
}
