#!/usr/bin/env node
/**
 * Download the latest finished iOS build artifact from the linked EAS project
 * (onflow-lite / com.onflow.lite).
 *
 * Env: EAS_IOS_PROFILE (default production), EAS_IOS_SIMULATOR=true to require simulator builds.
 *
 * Usage: npm run download:ios | npm run download:ios:preview
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = parseCli(process.argv.slice(2));

function parseCli(args) {
  let profile = null;
  let simulator = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--simulator") {
      simulator = true;
    } else if (arg === "--profile" && args[i + 1]) {
      profile = args[++i];
    } else if (!arg.startsWith("-")) {
      profile = arg;
    }
  }
  return { profile, simulator };
}

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
    const hint = process.env.EXPO_TOKEN
      ? "EXPO_TOKEN is set but EAS rejected it — check the secret value and project access."
      : "Set EXPO_TOKEN (CI) or run `npx eas-cli login` locally, then retry.";
    throw new Error(`${hint}\n${error.message}`);
  }
}

function targetProfile() {
  if (CLI.profile) return String(CLI.profile).toLowerCase();
  return String(process.env.EAS_IOS_PROFILE ?? "production").toLowerCase();
}

function requireSimulatorBuild() {
  if (CLI.simulator) return true;
  const v = String(process.env.EAS_IOS_SIMULATOR ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function isSimulatorBuild(build) {
  return build.simulator === true || build.buildMode === "simulator";
}

function artifactExtension(url, build) {
  if (isSimulatorBuild(build)) return ".tar.gz";
  const path = String(url).split("?")[0].toLowerCase();
  if (path.endsWith(".tar.gz")) return ".tar.gz";
  if (path.endsWith(".ipa")) return ".ipa";
  return ".ipa";
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
  const profile = targetProfile();
  const simulatorOnly = requireSimulatorBuild();
  let matched = builds.filter((build) => profileOf(build) === profile);
  if (simulatorOnly) {
    matched = matched.filter(isSimulatorBuild);
  }

  if (matched.length === 0) {
    const profiles = [...new Set(builds.map(profileOf).filter(Boolean))].join(", ") || "none";
    const simHint = simulatorOnly
      ? " No simulator builds matched — run `eas build --profile preview --platform ios` after enabling ios.simulator in eas.json."
      : "";
    throw new Error(
      `No finished iOS builds for profile "${profile}" in the last 20 (simulatorOnly=${simulatorOnly}). Profiles seen: ${profiles}.${simHint}`,
    );
  }

  const latest = matched[0];
  const url = artifactUrlOf(latest);
  if (!url) {
    throw new Error(
      `${profile} build ${latest.id ?? "(no id)"} has no artifact URL`,
    );
  }

  const version = versionOf(latest);
  const buildNumber = buildNumberOf(latest);
  const ext = artifactExtension(url, latest);
  const fileName = `onflow-lite-${profile}-${version}-${buildNumber}${ext}`;
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
