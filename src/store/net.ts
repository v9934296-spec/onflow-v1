export function isApiConfigured(): boolean {
  return Boolean((process.env.EXPO_PUBLIC_API_URL ?? "").trim());
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && "onLine" in navigator && navigator.onLine === false;
}
