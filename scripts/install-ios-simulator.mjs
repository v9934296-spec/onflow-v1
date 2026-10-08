#!/usr/bin/env node
/**
 * Boot an iPhone simulator and install an EAS artifact from builds/ (or IOS_ARTIFACT_PATH).
 * Supports .tar.gz (simulator), .ipa, or a .app bundle path.
 *
 * Usage: node scripts/install-ios-simulator.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BUILDS_DIR = join(ROOT, "builds");

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

function runInherit(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit" });
}

function latestArtifactInBuilds() {
  if (!existsSync(BUILDS_DIR)) {
    throw new Error(`No builds/ directory. Run npm run download:ios first.`);
  }
  const files = readdirSync(BUILDS_DIR)
    .map((name) => join(BUILDS_DIR, name))
    .filter((path) => statSync(path).isFile())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (files.length === 0) {
    throw new Error(`No artifacts in ${BUILDS_DIR}. Run npm run download:ios first.`);
  }
  return files[0];
}

function resolveArtifactPath() {
  const fromEnv = process.env.IOS_ARTIFACT_PATH?.trim();
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`IOS_ARTIFACT_PATH does not exist: ${fromEnv}`);
    }
    return fromEnv;
  }
  return latestArtifactInBuilds();
}

function findAppBundle(rootDir, depth = 0) {
  if (depth > 8) return null;
  let entries;
  try {
    entries = readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = join(rootDir, entry.name);
    if (entry.isDirectory() && entry.name.endsWith(".app")) {
      return full;
    }
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const nested = findAppBundle(full, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

function extractArtifact(artifactPath, workDir) {
  const lower = artifactPath.toLowerCase();
  if (lower.endsWith(".app") && statSync(artifactPath).isDirectory()) {
    return artifactPath;
  }
  if (lower.endsWith(".app")) {
    throw new Error(`Expected .app directory at ${artifactPath}`);
  }

  runInherit("mkdir", ["-p", workDir]);

  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) {
    runInherit("tar", ["-xzf", artifactPath, "-C", workDir]);
  } else if (lower.endsWith(".zip") || lower.endsWith(".ipa")) {
    runInherit("unzip", ["-q", "-o", artifactPath, "-d", workDir]);
  } else {
    throw new Error(
      `Unsupported artifact type: ${basename(artifactPath)} (expected .tar.gz, .ipa, or .app)`,
    );
  }

  const app = findAppBundle(workDir);
  if (!app) {
    throw new Error(
      `No .app found inside ${basename(artifactPath)}. For simulator E2E, use an EAS iOS build with ios.simulator enabled (preview profile).`,
    );
  }
  return app;
}

function pickIphoneUdid() {
  const raw = run("xcrun", ["simctl", "list", "devices", "available", "-j"]);
  const data = JSON.parse(raw);
  const candidates = [];
  for (const runtime of Object.keys(data.devices ?? {})) {
    if (!runtime.includes("iOS")) continue;
    for (const device of data.devices[runtime] ?? []) {
      if (device.isAvailable !== false && /iPhone/i.test(device.name)) {
        candidates.push({ ...device, runtime });
      }
    }
  }
  if (candidates.length === 0) {
    throw new Error("No available iPhone simulators found.");
  }
  candidates.sort((a, b) => {
    const num = (name) => {
      const m = name.match(/iPhone\s+(\d+)/i);
      return m ? Number(m[1]) : 0;
    };
    return num(b.name) - num(a.name) || a.name.localeCompare(b.name);
  });
  const chosen = candidates[0];
  console.log(`Simulator: ${chosen.name} (${chosen.udid})`);
  return chosen.udid;
}

function bootSimulator(udid) {
  try {
    run("xcrun", ["simctl", "boot", udid]);
  } catch {
    // already booted
  }
  runInherit("xcrun", ["simctl", "bootstatus", udid, "-b"]);
  try {
    runInherit("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", udid]);
  } catch {
    // headless CI may not need Simulator.app
  }
}

function main() {
  if (process.platform !== "darwin") {
    throw new Error("install-ios-simulator.mjs requires macOS (iOS Simulator).");
  }

  const artifactPath = resolveArtifactPath();
  console.log(`Artifact: ${artifactPath}`);

  const workDir = join(BUILDS_DIR, ".sim-extract");
  const appPath = extractArtifact(artifactPath, workDir);
  console.log(`App bundle: ${appPath}`);

  const udid = pickIphoneUdid();
  bootSimulator(udid);
  runInherit("xcrun", ["simctl", "install", udid, appPath]);
  console.log(`Installed on simulator ${udid}`);
}

main();
