#!/usr/bin/env node
/**
 * Generates src/api/generated/schema.ts from the committed OpenAPI snapshot.
 *
 * Generated files are never hand-edited (spec 15). `--check` regenerates into
 * memory and fails when the committed output has drifted, so CI catches a stale
 * contract instead of shipping one.
 *
 *   node scripts/generate-openapi-types.mjs
 *   node scripts/generate-openapi-types.mjs --check
 *
 * Refresh the snapshot itself from a running non-production API:
 *   node scripts/generate-openapi-types.mjs --from-url http://localhost:8000/openapi.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const SNAPSHOT = join(ROOT, "openapi", "openapi.json");
const OUTPUT = join(ROOT, "src", "api", "generated", "schema.ts");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const urlFlagIndex = args.indexOf("--from-url");
const fromUrl = urlFlagIndex >= 0 ? args[urlFlagIndex + 1] : null;

const BANNER = [
  "/**",
  " * GENERATED FILE — DO NOT EDIT.",
  " *",
  " * Source: openapi/openapi.json (snapshot of the live FastAPI schema).",
  " * Regenerate: npm run api:generate",
  " */",
  "",
].join("\n");

async function refreshSnapshot(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch OpenAPI schema: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const schema = await res.json();
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  writeFileSync(SNAPSHOT, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
  console.log(`Snapshot refreshed from ${url}`);
}

async function main() {
  if (fromUrl) {
    await refreshSnapshot(fromUrl);
  }

  if (!existsSync(SNAPSHOT)) {
    console.error(
      "Missing openapi/openapi.json. Refresh it with --from-url <non-production /openapi.json>.",
    );
    process.exit(1);
  }

  const { default: openapiTS, astToString } = await import("openapi-typescript");
  const schema = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const ast = await openapiTS(schema);
  const generated = `${BANNER}${astToString(ast)}`;

  if (checkOnly) {
    if (!existsSync(OUTPUT)) {
      console.error("FAIL  src/api/generated/schema.ts is missing. Run: npm run api:generate");
      process.exit(1);
    }
    const committed = readFileSync(OUTPUT, "utf8");
    if (normalize(committed) !== normalize(generated)) {
      console.error(
        "FAIL  Generated API types are stale. Run: npm run api:generate (do not hand-edit).",
      );
      process.exit(1);
    }
    console.log("PASS  Generated API types match openapi/openapi.json.");
    return;
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, generated, "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

function normalize(text) {
  return text.replace(/\r\n/g, "\n").trimEnd();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
