#!/usr/bin/env node
/**
 * Phase 0 gate: boundary lint must FAIL on a deliberate violation.
 *
 * A lint rule nobody has seen fail is a rule nobody knows works. This plants
 * one violation per boundary, asserts eslint rejects each, then asserts a clean
 * file still passes. Exit 0 only when every boundary actually bites.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const PROBES = [
  {
    name: "ui -> api",
    file: "src/ui/__probe_ui_imports_api__.ts",
    source: [
      'import { apiRequest } from "@/api/client";',
      "export const probe = apiRequest;",
    ].join("\n"),
  },
  {
    name: "domain -> react-native",
    file: "src/domain/__probe_domain_imports_rn__.ts",
    source: ['import { Platform } from "react-native";', "export const probe = Platform;"].join("\n"),
  },
  {
    name: "domain -> api",
    file: "src/domain/__probe_domain_imports_api__.ts",
    source: ['import { apiRequest } from "@/api/client";', "export const probe = apiRequest;"].join("\n"),
  },
  {
    name: "api -> ui copy",
    file: "src/api/__probe_api_imports_copy__.ts",
    source: ['import { errorCopy } from "@/ui/copy/errors";', "export const probe = errorCopy;"].join("\n"),
  },
  {
    name: "brand minted outside domain/mappers",
    file: "src/ui/__probe_brand_outside_mappers__.ts",
    source: [
      'import { unsafeBrand } from "@/domain/types/brand";',
      'export const probe = unsafeBrand<string>("nope");',
    ].join("\n"),
  },
  {
    name: "as unknown as laundering",
    file: "src/ui/__probe_unknown_cast__.ts",
    source: ["export const probe = (1 as unknown) as string;"].join("\n"),
  },
];

const CLEAN = {
  name: "clean file",
  file: "src/ui/__probe_clean__.ts",
  source: "export const probe = 1;",
};

function plant({ file, source }) {
  const abs = join(ROOT, file);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${source}\n`, "utf8");
  return abs;
}

function lint(file) {
  try {
    execFileSync(npx, ["eslint", file, "--no-warn-ignored"], {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    return { failed: false, output: "" };
  } catch (err) {
    return { failed: true, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

let broken = 0;

for (const probe of PROBES) {
  const abs = plant(probe);
  try {
    const { failed, output } = lint(probe.file);
    if (failed) {
      console.log(`  PASS  boundary bites: ${probe.name}`);
    } else {
      broken += 1;
      console.error(`  FAIL  boundary did NOT bite: ${probe.name}`);
      console.error(output);
    }
  } finally {
    rmSync(abs, { force: true });
  }
}

const cleanAbs = plant(CLEAN);
try {
  const { failed, output } = lint(CLEAN.file);
  if (failed) {
    broken += 1;
    console.error("  FAIL  clean file was rejected — the rules are too broad");
    console.error(output);
  } else {
    console.log("  PASS  clean file accepted");
  }
} finally {
  rmSync(cleanAbs, { force: true });
}

if (broken > 0) {
  console.error(`\nBoundary verification FAILED (${broken} problem(s)).`);
  process.exit(1);
}

console.log("\nBoundary verification PASSED — every layer rule is enforced.");
