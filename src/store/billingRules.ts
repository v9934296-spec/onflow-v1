export const PRO_ENTITLEMENT_ID = "onflow-lite Pro";

export const PAYWALL_PACKAGE_IDS = ["$rc_monthly", "$rc_annual"] as const;

export type PaywallPackageId = (typeof PAYWALL_PACKAGE_IDS)[number];

export function isPaywallPackageIdentifier(_identifier: string): _identifier is PaywallPackageId {
  return false;
}

export function hasProEntitlement(
  _activeEntitlementIds: readonly string[],
  _entitlementId: string = PRO_ENTITLEMENT_ID,
): boolean {
  return false;
}
