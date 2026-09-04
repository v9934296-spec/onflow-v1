import { useCallback, useState } from "react";
import { Linking, ScrollView, Text } from "react-native";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { ErrorPanel, Skeleton } from "@/ui/components/States";
import { ScreenHero, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { useFocusEffect } from "expo-router";
import {
  billingBlockedOffline,
  configureBilling,
  legalUrl,
  loadOfferings,
  presentCustomerCenter,
  purchasePackage,
  restorePurchases,
} from "@/store/billing";
import { loadQuota } from "@/store/account";
import { useAuthStore } from "@/store/authStore";

type StorePackage = {
  identifier: string;
  product: { identifier: string; title: string; priceString: string };
};

export default function PaywallScreen() {
  const userId = useAuthStore((s) => s.userId);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [storeFailed, setStoreFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [offline, setOffline] = useState(() => billingBlockedOffline());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) await configureBilling(userId);
      const quota = await loadQuota();
      if (quota.ok) {
        setRemaining(quota.data.analyses_remaining);
        setTier(quota.data.tier);
      }
      const offerings = await loadOfferings();
      if (!offerings.ok) {
        setStoreFailed(true);
        setPackages([]);
      } else {
        setStoreFailed(false);
        setPackages(offerings.packages);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      const blocked = billingBlockedOffline();
      setOffline(blocked);
      if (!blocked) void load();
    }, [load]),
  );

  if (offline) {
    return (
      <ScreenSafeArea style={{ padding: space.xl, gap: space.lg, justifyContent: "center" }}>
        <ScreenHero kicker="Subscription" title="PRO">
          <Text style={{ ...textStyle.bodySm, color: color.textTertiary, marginTop: space.sm }}>
            Needs a connection. Subscription changes are not queued.
          </Text>
        </ScreenHero>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg }}>
        <ScreenHero kicker="Subscription" title="PRO">
          <Text style={{ ...textStyle.bodySm, color: color.textTertiary, marginTop: space.sm }}>
            Prices come from the App Store. Restore Purchases stays available even when packages fail to load.
          </Text>
        </ScreenHero>
        {tier ? (
          <Text style={{ ...textStyle.mono, color: color.alum }}>
            {tier}
            {remaining != null ? ` · ${remaining} analyses remaining` : ""}
          </Text>
        ) : null}
        {loading ? <Skeleton height={56} /> : null}
        {storeFailed ? <ErrorPanel kind="store_unavailable" onPrimary={() => void load()} /> : null}
        {!storeFailed && !loading
          ? packages.map((pkg) => (
              <Button
                key={pkg.identifier}
                label={`${pkg.product.title} · ${pkg.product.priceString}`}
                disabled={buying != null}
                loading={buying === pkg.identifier}
                onPress={() => {
                  void (async () => {
                    setBuying(pkg.identifier);
                    const outcome = await purchasePackage(pkg);
                    setBuying(null);
                    if (outcome === "cancelled") return;
                    if (outcome === "failed") {
                      setStoreFailed(true);
                      return;
                    }
                    if (userId) await configureBilling(userId);
                    await load();
                  })();
                }}
              />
            ))
          : null}
        <Button
          label="Restore purchases"
          variant="secondary"
          disabled={buying != null}
          onPress={() => {
            void (async () => {
              const restored = await restorePurchases();
              if (!restored.ok) {
                setStoreFailed(true);
                return;
              }
              if (userId) await configureBilling(userId);
              await load();
            })();
          }}
        />
        <Button
          label="Manage subscription"
          variant="secondary"
          onPress={() => {
            void presentCustomerCenter();
          }}
        />
        <Button
          label="Terms"
          variant="secondary"
          onPress={() => void Linking.openURL(legalUrl("terms"))}
        />
        <Button
          label="Privacy"
          variant="secondary"
          onPress={() => void Linking.openURL(legalUrl("privacy"))}
        />
        <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>
          Subscriptions renew until cancelled. Restore Purchases is always available.
        </Text>
      </ScrollView>
    </ScreenSafeArea>
  );
}
