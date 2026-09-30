import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";
import { create } from "zustand";
import { syncBillingState } from "../api/billing";
import {
  hasProEntitlement,
  isPaywallPackageIdentifier,
  PRO_ENTITLEMENT_ID,
  type PaywallPackageId,
} from "./billingRules";

export interface PaywallPlan {
  readonly identifier: PaywallPackageId;
  readonly label: "Monthly" | "Annual";
  readonly price: string;
}

type BillingStatus = "idle" | "loading" | "ready" | "unavailable" | "error";

type BillingSlice = {
  status: BillingStatus;
  plans: PaywallPlan[];
  isPro: boolean;
  purchasing: PaywallPackageId | null;
  restoring: boolean;
  message: string | null;
  identify: (userId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  loadPlans: () => Promise<void>;
  purchase: (identifier: PaywallPackageId) => Promise<boolean>;
  restore: () => Promise<boolean>;
  clearMessage: () => void;
};

let configured = false;
const packageCache = new Map<PaywallPackageId, PurchasesPackage>();

function activeEntitlementIds(info: CustomerInfo): string[] {
  return Object.keys(info.entitlements.active);
}

function revenueCatHasPro(info: CustomerInfo): boolean {
  return hasProEntitlement(activeEntitlementIds(info), PRO_ENTITLEMENT_ID);
}

function isAnonymousRevenueCatId(id: string): boolean {
  return id.startsWith("$RCAnonymousID:");
}

function isPurchaseCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { userCancelled?: unknown; code?: unknown };
  return (
    candidate.userCancelled === true ||
    candidate.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

function configurePurchases(): boolean {
  if (configured) return true;
  if (Platform.OS !== "ios") return false;
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();
  if (!apiKey) return false;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

async function syncServer(info: CustomerInfo): Promise<boolean | null> {
  const rcAppUserId = await Purchases.getAppUserID();
  const synced = await syncBillingState({
    hasPro: revenueCatHasPro(info),
    rcAppUserId,
  });
  if (!synced.ok) return null;
  return synced.data.tier === "pro";
}

async function waitForServerPro(info: CustomerInfo): Promise<boolean> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const pro = await syncServer(info);
    if (pro === true) return true;
    if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return false;
}

const initial = {
  status: "idle" as BillingStatus,
  plans: [] as PaywallPlan[],
  isPro: false,
  purchasing: null as PaywallPackageId | null,
  restoring: false,
  message: null as string | null,
};

export const useBillingStore = create<BillingSlice>((set, get) => ({
  ...initial,

  identify: async (userId) => {
    if (!configurePurchases()) {
      set({ status: "unavailable", isPro: false });
      return;
    }
    try {
      const currentId = await Purchases.getAppUserID();
      if (currentId !== userId) {
        if (!isAnonymousRevenueCatId(currentId)) await Purchases.logOut();
        await Purchases.logIn(userId);
      }
      const info = await Purchases.getCustomerInfo();
      const serverPro = await syncServer(info);
      set({ isPro: serverPro === true, message: null });
    } catch {
      set({ message: "Billing account sync failed. You can retry from Pro." });
    }
  },

  disconnect: async () => {
    packageCache.clear();
    set(initial);
    if (!configured) return;
    try {
      const currentId = await Purchases.getAppUserID();
      if (!isAnonymousRevenueCatId(currentId)) await Purchases.logOut();
    } catch {
      // Auth sign-out must never be blocked by store cleanup.
    }
  },

  loadPlans: async () => {
    if (!configurePurchases()) {
      set({ status: "unavailable", plans: [] });
      return;
    }
    set({ status: "loading", message: null });
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        set({ status: "unavailable", plans: [] });
        return;
      }
      packageCache.clear();
      const plans: PaywallPlan[] = [];
      for (const item of current.availablePackages) {
        if (!isPaywallPackageIdentifier(item.identifier)) continue;
        packageCache.set(item.identifier, item);
        plans.push({
          identifier: item.identifier,
          label: item.identifier === "$rc_monthly" ? "Monthly" : "Annual",
          price: item.product.priceString,
        });
      }
      plans.sort((a, b) => (a.identifier === "$rc_monthly" ? -1 : b.identifier === "$rc_monthly" ? 1 : 0));
      set({ status: plans.length === 2 ? "ready" : "unavailable", plans });
    } catch {
      set({ status: "error", plans: [], message: "The App Store is unavailable right now." });
    }
  },

  purchase: async (identifier) => {
    const item = packageCache.get(identifier);
    if (!item || get().purchasing || get().restoring) return false;
    set({ purchasing: identifier, message: null });
    try {
      const { customerInfo } = await Purchases.purchasePackage(item);
      if (!revenueCatHasPro(customerInfo)) {
        set({ purchasing: null, message: "Purchase completed without a Pro entitlement. Restore or try again." });
        return false;
      }
      const activated = await waitForServerPro(customerInfo);
      set({
        purchasing: null,
        isPro: activated,
        message: activated ? null : "Purchase received. Pro activation is still syncing.",
      });
      return activated;
    } catch (error) {
      if (isPurchaseCancelled(error)) {
        set({ purchasing: null });
        return false;
      }
      set({ purchasing: null, message: "Purchase failed. No charge was confirmed." });
      return false;
    }
  },

  restore: async () => {
    if (!configurePurchases() || get().restoring || get().purchasing) return false;
    set({ restoring: true, message: null });
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (!revenueCatHasPro(customerInfo)) {
        const serverPro = await syncServer(customerInfo);
        set({
          restoring: false,
          isPro: serverPro === true,
          message: serverPro === true ? null : "No active Pro purchase was found for this Apple ID.",
        });
        return serverPro === true;
      }
      const activated = await waitForServerPro(customerInfo);
      set({
        restoring: false,
        isPro: activated,
        message: activated ? "Purchases restored." : "Restore found Pro, but server activation is still syncing.",
      });
      return activated;
    } catch {
      set({ restoring: false, message: "Restore failed. Try again when the App Store is reachable." });
      return false;
    }
  },

  clearMessage: () => set({ message: null }),
}));
