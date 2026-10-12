import { Share, Text, View } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ConfirmDialog } from "@/ui/components/Form";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { listOutboxForUser, purgeOutboxForUser } from "@/store/outbox";
import { deleteAccount, exportAccount } from "@/api/endpoints";
import { kv, kvUserKeys } from "@/store/kv";
import { useEffect, useState } from "react";

export default function ProfileScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const signOut = useAuthStore((s) => s.signOut);
  const [queued, setQueued] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void listOutboxForUser(userId).then((rows) => {
      setQueued(rows.filter((r) => r.state !== "ready" && r.state !== "cancelled").length);
    });
  }, [userId]);

  async function shareExport() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await exportAccount();
      if (!res.ok) {
        setError("Your data could not be exported. Check your connection and try again.");
        return;
      }
      await Share.share({
        title: "OnFlow account data",
        message: JSON.stringify(res.data, null, 2),
      });
    } catch {
      setError("The share sheet could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAccountDeletion() {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);
    const owner = userId;
    try {
      const result = await deleteAccount();
      if (!result.ok) {
        setError("Account deletion could not be requested. Try again while connected.");
        return;
      }
      await purgeOutboxForUser(owner);
      for (const key of [
        kvUserKeys.activeSessionId(owner),
        kvUserKeys.activeSession(owner),
        kvUserKeys.selectedTrick(owner),
        kvUserKeys.pendingSessionEnd(owner),
        kvUserKeys.pendingAttempts(owner),
        kvUserKeys.onboardingDraft(owner),
        kvUserKeys.skaterProfile(owner),
      ]) {
        kv.delete(key);
      }
      setConfirmDelete(false);
      await signOut();
    } catch {
      setError("Your request may have been received, but local cleanup was interrupted. Check your account status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.lg }}>
      <ScreenHeader kicker="Account" title="PROFILE" />
      <Text style={{ ...textStyle.mono, color: color.textTertiary }}>{userId}</Text>
      <Button label="Personalization" variant="secondary" onPress={() => router.push("/personalization")} />
      <Button label="Subscription" onPress={() => router.push("/paywall")} />
      <Button label="Export my data" variant="secondary" onPress={() => void shareExport()} />
      <View style={{ marginTop: space.xxl, gap: space.md }}>
        <Text style={{ ...textStyle.label, color: color.red }}>Account controls</Text>
        <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>
          {queued > 0
            ? `${queued} queued clip(s) stay available only to this account after sign-out.`
            : "No queued clips on this account."}
        </Text>
        <Button
          label="Delete account"
          variant="destructive"
          onPress={() => setConfirmDelete(true)}
        />
        {error ? <Text accessibilityRole="alert" style={{ ...textStyle.bodySm, color: color.red }}>{error}</Text> : null}
      </View>
      <ConfirmDialog
        visible={confirmDelete}
        title="Permanently delete your account?"
        body="This requests permanent deletion of your account and uploaded clips. Server cleanup completes within 24 hours. Your App Store subscription must be cancelled separately in Apple Settings."
        primaryLabel={busy ? "Requesting deletion…" : "Delete my account"}
        secondaryLabel="Keep my account"
        onPrimary={() => void confirmAccountDeletion()}
        onSecondary={() => {
          if (!busy) setConfirmDelete(false);
        }}
      />
    </ScreenSafeArea>
  );
}
