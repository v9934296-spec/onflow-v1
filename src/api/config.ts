/**
 * Transport only. No user-facing copy lives here (guardrails 6).
 */

const REQUIRED = "EXPO_PUBLIC_API_URL";

export function getApiBaseUrl(): string {
  const raw = (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
  return raw;
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export function missingApiUrlFlag(): string {
  return REQUIRED;
}

export function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Dev email skip is compile-gated: production always returns false. */
export function isDevSkipSignInEnabled(): boolean {
  if (isProductionBuild()) return false;
  return process.env.EXPO_PUBLIC_DEV_SKIP_SIGN_IN === "1";
}
