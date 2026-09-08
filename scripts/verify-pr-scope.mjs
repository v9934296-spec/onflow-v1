#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { evaluatePrScope } from "./pr-scope.mjs";

const root = process.cwd();
const allowMixed =
  process.env.ALLOW_MIXED_SCOPE === "true" || process.env.ALLOW_MIXED_SCOPE === "1";
const base = process.env.PR_SCOPE_BASE ?? process.env.GITHUB_BASE_REF ?? "main";

function changedFiles() {
  if (process.env.PR_SCOPE_FILES) {
    return process.env.PR_SCOPE_FILES.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((path) => ({ path, status: "M" }));
  }

  const committed = gitNameStatus(["diff", "--name-status", `origin/${base}...HEAD`]);
  if (committed.length > 0) return committed;
  const staged = gitNameStatus(["diff", "--name-status", "--cached", `origin/${base}`]);
  const unstaged = gitNameStatus(["diff", "--name-status", `origin/${base}`]);
  const byPath = new Map();
  for (const file of [...unstaged, ...staged]) byPath.set(file.path, file);
  return [...byPath.values()];
}

function gitNameStatus(args) {
  try {
    return parseNameStatus(
      execFileSync("git", args, { cwd: root, encoding: "utf8" }),
    );
  } catch {
    return [];
  }
}

function parseNameStatus(out) {
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split(/\s+/);
      return { status: status?.[0] ?? "M", path: rest.join(" ").replace(/\\/g, "/") };
    });
}

const files = changedFiles();
if (files.length === 0) {
  console.log("PR scope: no diff against", base);
  process.exit(0);
}

const result = evaluatePrScope(files, { allowMixed });
if (result.ok) {
  console.log(
    `PR scope: ok (${result.runtime.length} runtime, ${result.tooling.length} docs/tooling, ${result.vendorAdds.length} vendor adds)`,
  );
  process.exit(0);
}

console.error("PR scope: blocked\n");
for (const failure of result.failures) console.error(`- ${failure}`);
process.exit(1);
