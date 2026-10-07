import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRO_ENTITLEMENT_ID } from "../billingRules";

const syncBillingState = vi.fn();
const configure = vi.fn();
const getAppUserID = vi.fn();
const logIn = vi.fn();
const logOut = vi.fn();
const getCustomerInfo = vi.fn();
const getOfferings = vi.fn();

vi.mock("../../api/billing", () => ({
  syncBillingState: (...args: unknown[]) => syncBillingState(...args),
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

vi.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    configure: (...args: unknown[]) => configure(...args),
    setLogLevel: vi.fn(),
    getAppUserID: (...args: unknown[]) => getAppUserID(...args),
    logIn: (...args: unknown[]) => logIn(...args),
    logOut: (...args: unknown[]) => logOut(...args),
    getCustomerInfo: (...args: unknown[]) => getCustomerInfo(...args),
    getOfferings: (...args: unknown[]) => getOfferings(...args),
    purchasePackage: vi.fn(),
    restorePurchases: vi.fn(),
  },
  LOG_LEVEL: { DEBUG: "DEBUG" },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: "purchase_cancelled" },
}));

const priorRcKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = "appl_test_key";
  getAppUserID.mockResolvedValue("$RCAnonymousID:abc");
  logIn.mockResolvedValue({});
  getCustomerInfo.mockResolvedValue({
    entitlements: { active: { [PRO_ENTITLEMENT_ID]: { identifier: PRO_ENTITLEMENT_ID } } },
  });
});

afterEach(() => {
  if (priorRcKey === undefined) delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  else process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = priorRcKey;
});

describe("billing store", () => {
  it("marks billing unavailable when RevenueCat is not configured", async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    const { useBillingStore } = await import("../billingStore");
    await useBillingStore.getState().identify("user-1");
    expect(useBillingStore.getState().status).toBe("unavailable");
  });

  it("syncs Pro tier from the server after identify", async () => {
    syncBillingState.mockResolvedValue({
      ok: true,
      data: { tier: "pro", bonus_analyses: 0, monthly_free_remaining: null },
    });
    const { useBillingStore } = await import("../billingStore");
    await useBillingStore.getState().identify("user-1");
    expect(logIn).toHaveBeenCalledWith("user-1");
    expect(useBillingStore.getState().isPro).toBe(true);
  });

  it("loads monthly and annual plans from the current offering", async () => {
    getOfferings.mockResolvedValue({
      current: {
        availablePackages: [
          { identifier: "$rc_annual", product: { priceString: "$49.99" } },
          { identifier: "$rc_monthly", product: { priceString: "$4.99" } },
        ],
      },
    });
    const { useBillingStore } = await import("../billingStore");
    await useBillingStore.getState().loadPlans();
    expect(useBillingStore.getState().status).toBe("ready");
    expect(useBillingStore.getState().plans.map((p) => p.identifier)).toEqual([
      "$rc_monthly",
      "$rc_annual",
    ]);
  });
});
