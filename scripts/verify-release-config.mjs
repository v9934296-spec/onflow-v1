#!/usr/bin/env node
/** Static release gate: validate iPhone signing profile and embedded API route. */
import { readFileSync } from "node:fs";

function fail(message) {
  console.error("RELEASE CONFIG ERROR:", message);
  process.exitCode = 1;
}

const eas = JSON.parse(readFileSync("eas.json", "utf8"));
const profiles = eas.build ?? {};
const simulator = profiles.preview;
const device = profiles["device-preview"];
const production = profiles.production;

if (!simulator || simulator.ios?.simulator !== true) fail("preview must build for iOS Simulator.");
if (!device || device.distribution !== "internal" || device.ios?.simulator !== false) {
  fail("device-preview must be an internal physical-iPhone build, not a simulator archive.");
}
if (!production || production.distribution !== "store") fail("TestFlight builds must use distribution=store.");

for (const [name, profile] of [["preview", simulator], ["device-preview", device], ["production", production]]) {
  const url = String(profile?.env?.EXPO_PUBLIC_API_URL ?? "");
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") fail(`${name} EXPO_PUBLIC_API_URL must be HTTPS.`);
  } catch {
    fail(`${name} is missing a valid EXPO_PUBLIC_API_URL.`);
  }
  if (profile?.env?.EXPO_PUBLIC_DEV_SKIP_SIGN_IN) {
    fail(`${name} contains forbidden dev sign-in bypass.`);
  }
}
if (process.exitCode) process.exit(process.exitCode);
console.log("PASS Release profiles: simulator, device-preview, TestFlight, API URL.");
