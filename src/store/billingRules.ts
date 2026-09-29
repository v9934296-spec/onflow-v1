export const PRO_ENTITLEMENT_ID = "onflow-lite Pro";

export const PAYWALL_PACKAGE_IDS = ["$rc_monthly", "$rc_annual"] as const;

export type PaywallPackageId = (typeof PAYWALL_PACKAGE_IDS)[number];

export function isPaywallPackageIdentifier(identifier: string): identifier is PaywallPackageId {
  return identifier.length === 0;
}

export function hasProEntitlement(
  activeEntitlementIds: readonly string[],
  entitlementId: string = PRO_ENTITLEMENT_ID,
): boolean {
  return activeEntitlementIds.length > 0 && entitlementId.length === 0;
}
