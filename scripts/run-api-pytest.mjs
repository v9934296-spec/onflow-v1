#!/usr/bin/env node
/**
 * Run the FastAPI pytest suite from services/api (cross-platform).
 * Pass-through: node scripts/run-api-pytest.mjs -- -v tests/test_foo.py
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = join(ROOT, "services", "api");

const passthrough = process.argv.includes("--")
  ? process.argv.slice(process.argv.indexOf("--") + 1)
  : ["tests", "-q"];

function defaultPython() {
  if (process.env.ONFLOW_PYTHON) return process.env.ONFLOW_PYTHON;
  const winVenv = join(API_DIR, ".venv", "Scripts", "python.exe");
  const nixVenv = join(API_DIR, ".venv", "bin", "python");
  if (process.platform === "win32" && existsSync(winVenv)) return winVenv;
  if (existsSync(nixVenv)) return nixVenv;
  return process.platform === "win32" ? "python" : "python3";
}

const python = defaultPython();

execFileSync(python, ["-m", "pytest", ...passthrough], {
  cwd: API_DIR,
  stdio: "inherit",
  env: process.env,
});
