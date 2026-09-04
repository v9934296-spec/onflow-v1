import { Platform } from "react-native";
import { syncBilling } from "../api/endpoints";
import { isOffline } from "./net";

export const PRO_ENTITLEMENT = "onflow-lite Pro";

type PackageInfo = {
  identifier: string;
  product: { identifier: string; title: string; priceString: string };
};

function purchasesModule(): {
  configure: (opts: { apiKey: string }) => void;
  logIn: (appUserID: string) => Promise<{ customerInfo: { entitlements: { active: Record<string, unknown> }; originalAppUserId?: string } }>;
  getAppUserID: () => Promise<string>;
  getOfferings: () => Promise<{ current: { availablePackages: PackageInfo[] } | null }>;
  purchasePackage: (pkg: PackageInfo) => Promise<unknown>;
  restorePurchases: () => Promise<{ entitlements: { active: Record<string, unknown> } }>;
} | null {
  try {
    // Native store kit. Tests and web stay on the null path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-purchases").default;
  } catch {
    return null;
  }
}

export function revenueCatApiKey(): string {
  return (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "").trim();
}

export function legalUrl(path: "terms" | "privacy"): string {
  const base = (process.env.EXPO_PUBLIC_LEGAL_BASE_URL ?? "https://onflow.app").replace(/\/+$/, "");
  return `${base}/${path}`;
}

export function billingBlockedOffline(): boolean {
  return isOffline();
}

let configured = false;

export async function configureBilling(userId: string): Promise<void> {
  const key = revenueCatApiKey();
  const Purchases = purchasesModule();
  if (!key || !Purchases || Platform.OS === "web") return;
  try {
    if (!configured) {
      Purchases.configure({ apiKey: key });
      configured = true;
    }
    const result = await Purchases.logIn(userId);
    const hasPro = PRO_ENTITLEMENT in (result.customerInfo.entitlements.active ?? {});
    await syncBilling({
      hasPro,
      rcAppUserId: result.customerInfo.originalAppUserId ?? userId,
    });
  } catch {
    /* Store login must never block Apple sign-in or session hydrate. */
  }
}

export async function loadOfferings(): Promise<
  | { ok: true; packages: PackageInfo[] }
  | { ok: false; kind: "store_unavailable" }
> {
  const Purchases = purchasesModule();
  if (!Purchases || !revenueCatApiKey()) return { ok: false, kind: "store_unavailable" };
  try {
    const offerings = await Purchases.getOfferings();
    return { ok: true, packages: offerings.current?.availablePackages ?? [] };
  } catch {
    return { ok: false, kind: "store_unavailable" };
  }
}

export async function purchasePackage(pkg: PackageInfo): Promise<"purchased" | "cancelled" | "failed"> {
  const Purchases = purchasesModule();
  if (!Purchases) return "failed";
  try {
    await Purchases.purchasePackage(pkg);
    return "purchased";
  } catch (error) {
    if (error && typeof error === "object" && "userCancelled" in error && error.userCancelled === true) {
      return "cancelled";
    }
    return "failed";
  }
}

export async function restorePurchases(): Promise<{ ok: true; hasPro: boolean } | { ok: false }> {
  const Purchases = purchasesModule();
  if (!Purchases) return { ok: false };
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, hasPro: PRO_ENTITLEMENT in (info.entitlements.active ?? {}) };
  } catch {
    return { ok: false };
  }
}

export async function presentCustomerCenter(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ui = require("react-native-purchases-ui") as {
      default?: { presentCustomerCenter?: () => Promise<void> };
      presentCustomerCenter?: () => Promise<void>;
    };
    const present = ui.presentCustomerCenter ?? ui.default?.presentCustomerCenter;
    if (!present) return false;
    await present();
    return true;
  } catch {
    return false;
  }
}

export async function hasProEntitlement(): Promise<boolean> {
  const Purchases = purchasesModule();
  if (!Purchases) return false;
  try {
    const id = await Purchases.getAppUserID();
    const logged = await Purchases.logIn(id);
    return PRO_ENTITLEMENT in (logged.customerInfo.entitlements.active ?? {});
  } catch {
    return false;
  }
}
