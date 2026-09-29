import { describe, expect, it } from "vitest";
import {
  hasProEntitlement,
  isPaywallPackageIdentifier,
  PRO_ENTITLEMENT_ID,
} from "../billingRules";

describe("billing rules", () => {
  it("shows only monthly and annual packages on the launch paywall", () => {
    expect(isPaywallPackageIdentifier("$rc_monthly")).toBe(true);
    expect(isPaywallPackageIdentifier("$rc_annual")).toBe(true);
    expect(isPaywallPackageIdentifier("$rc_lifetime")).toBe(false);
  });

  it("requires the configured Pro entitlement to be active", () => {
    expect(hasProEntitlement([PRO_ENTITLEMENT_ID])).toBe(true);
    expect(hasProEntitlement(["something-else"])).toBe(false);
    expect(hasProEntitlement([])).toBe(false);
  });
});
