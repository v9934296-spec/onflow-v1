import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ErrorPanel } from "@/ui/components/States";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useBillingStore } from "@/store/billingStore";

export default function PaywallScreen() {
  const router = useRouter();
  const status = useBillingStore((s) => s.status);
  const plans = useBillingStore((s) => s.plans);
  const isPro = useBillingStore((s) => s.isPro);
  const purchasing = useBillingStore((s) => s.purchasing);
  const restoring = useBillingStore((s) => s.restoring);
  const message = useBillingStore((s) => s.message);
  const loadPlans = useBillingStore((s) => s.loadPlans);
  const purchase = useBillingStore((s) => s.purchase);
  const restore = useBillingStore((s) => s.restore);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.lg, justifyContent: "center" }}>
      <ScreenHeader kicker="Subscription" title={isPro ? "PRO ACTIVE" : "ONFLOW PRO"} />

      {isPro ? (
        <>
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>
            Your account has Pro access.
          </Text>
          <Button label="Done" onPress={() => router.back()} />
        </>
      ) : (
        <>
          <Text style={{ ...textStyle.body, color: color.textSecondary }}>
            More reviewed attempts. Keep your skate history moving with you.
          </Text>

          {(status === "unavailable" || status === "error") ? (
            <ErrorPanel kind="store_unavailable" onPrimary={() => void loadPlans()} />
          ) : null}

          {status === "loading" ? (
            <Text style={{ ...textStyle.mono, color: color.textTertiary }}>LOADING APP STORE…</Text>
          ) : null}

          {plans.map((plan) => (
            <View key={plan.identifier} style={{ gap: space.xs }}>
              <Button
                label={`${plan.label} · ${plan.price}`}
                loading={purchasing === plan.identifier}
                disabled={purchasing !== null || restoring}
                onPress={() => {
                  void purchase(plan.identifier).then((activated) => {
                    if (activated) router.back();
                  });
                }}
              />
            </View>
          ))}

          {message ? (
            <Text style={{ ...textStyle.bodySm, color: color.textSecondary }}>{message}</Text>
          ) : null}

          <Button
            label="Restore purchases"
            variant="secondary"
            loading={restoring}
            disabled={purchasing !== null}
            onPress={() => {
              void restore().then((activated) => {
                if (activated) router.back();
              });
            }}
          />

          <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>
            Prices and renewal terms come from the App Store. Purchases are tied to your OnFlow account after sign-in.
          </Text>
        </>
      )}
    </ScreenSafeArea>
  );
}
