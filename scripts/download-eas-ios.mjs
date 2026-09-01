#!/usr/bin/env node
/**
 * Download the latest finished production iOS IPA from the linked EAS project
 * (same Expo project as Onflow Demo: onflow-lite / com.onflow.lite).
 *
 * Usage: npm run download:ios
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

function runEas(args) {
  try {
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const argv =
      process.platform === "win32"
        ? ["/d", "/s", "/c", ["npx", "eas-cli", ...args].map(quoteWin).join(" ")]
        : ["eas-cli", ...args];
    return execFileSync(command, argv, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = String(error.stderr ?? error.message ?? error);
    throw new Error(stderr.trim() || `eas ${args.join(" ")} failed`);
  }
}

function quoteWin(value) {
  if (!/[\s"]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function parseJson(text, label) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`${label} returned empty output`);
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} did not return JSON:\n${trimmed.slice(0, 500)}`);
  }
}

function asBuildList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.builds)) return payload.builds;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function profileOf(build) {
  return String(build.buildProfile ?? build.profile ?? "").toLowerCase();
}

function artifactUrlOf(build) {
  const artifacts = build.artifacts ?? {};
  return (
    artifacts.applicationArchiveUrl ??
    artifacts.buildUrl ??
    build.applicationArchiveUrl ??
    build.artifactUrl ??
    null
  );
}

function versionOf(build) {
  return build.appVersion ?? build.version ?? "unknown";
}

function buildNumberOf(build) {
  return build.appBuildVersion ?? build.buildNumber ?? build.sdkVersion ?? "unknown";
}

async function downloadToFile(url, dest) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText} (${url})`);
  }
  if (!response.body) {
    throw new Error("Download failed: empty response body");
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
}

function mainWhoami() {
  try {
    const who = runEas(["whoami"]).trim();
    if (!who) {
      throw new Error("empty whoami");
    }
    console.log(`EAS account: ${who}`);
    return who;
  } catch (error) {
    throw new Error(
      `Not logged in to EAS. Run \`npx eas-cli login\` in this folder, then retry.\n${error.message}`,
    );
  }
}

async function main() {
  mainWhoami();

  const rawList = runEas([
    "build:list",
    "--platform",
    "ios",
    "--status",
    "finished",
    "--limit",
    "20",
    "--non-interactive",
    "--json",
  ]);
  const builds = asBuildList(parseJson(rawList, "eas build:list"));
  const production = builds.filter((build) => profileOf(build) === "production");

  if (production.length === 0) {
    const profiles = [...new Set(builds.map(profileOf).filter(Boolean))].join(", ") || "none";
    throw new Error(
      `No finished production iOS builds in the last 20. Profiles seen: ${profiles}`,
    );
  }

  const latest = production[0];
  const url = artifactUrlOf(latest);
  if (!url) {
    throw new Error(
      `Production build ${latest.id ?? "(no id)"} has no IPA artifact URL`,
    );
  }

  const version = versionOf(latest);
  const buildNumber = buildNumberOf(latest);
  const fileName = `onflow-lite-production-${version}-${buildNumber}.ipa`;
  const destDir = join(ROOT, "builds");
  const dest = join(destDir, fileName);

  mkdirSync(destDir, { recursive: true });
  console.log(`Build ID: ${latest.id ?? "(unknown)"}`);
  console.log(`Version: ${version} (${buildNumber})`);
  console.log(`Downloading ${fileName} …`);
  await downloadToFile(url, dest);
  console.log(`Saved ${dest}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
