/**
 * PR scope classifier. Product runtime stays off the same diff as vendor
 * dumps and large docs/tooling bulk.
 */

export const VENDOR_PATTERNS = [/^\.claude\//, /^\.agents\//, /^skills-lock\.json$/];

export const RUNTIME_PATTERNS = [
  /^app\//,
  /^src\//,
  /^openapi\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^app\.json$/,
  /^eas\.json$/,
  /^babel\.config\.js$/,
  /^tsconfig\.json$/,
  /^vitest\.config\.ts$/,
  /^expo-env\.d\.ts$/,
];

const POSIX = /\\/g;

export function posixPath(filePath) {
  return filePath.replace(POSIX, "/").replace(/^\.\//, "");
}

export function isVendor(filePath) {
  const path = posixPath(filePath);
  return VENDOR_PATTERNS.some((pattern) => pattern.test(path));
}

export function isRuntime(filePath) {
  const path = posixPath(filePath);
  return RUNTIME_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * Mixed PRs may carry a few docs with a runtime fix. A bulk tooling dump
 * next to app changes is the failure mode this exists to catch.
 */
export const MIXED_TOOLING_LIMIT = 8;

/**
 * @param {readonly { path: string, status?: string }[]} files
 * @param {{ allowMixed?: boolean }} [opts]
 */
export function evaluatePrScope(files, opts = {}) {
  const vendorAdds = [];
  const runtime = [];
  const tooling = [];

  for (const file of files) {
    const path = posixPath(file.path);
    const status = (file.status ?? "M").toUpperCase();
    const deleted = status === "D";
    if (isVendor(path)) {
      if (!deleted) vendorAdds.push(path);
      continue;
    }
    if (isRuntime(path)) runtime.push(path);
    else tooling.push(path);
  }

  const failures = [];
  if (vendorAdds.length > 0) {
    failures.push(
      `Vendor skill trees do not belong in this repo: ${vendorAdds.slice(0, 8).join(", ")}` +
        (vendorAdds.length > 8 ? ` (+${vendorAdds.length - 8})` : ""),
    );
  }

  const mixedBulk = runtime.length > 0 && tooling.length >= MIXED_TOOLING_LIMIT;
  if (mixedBulk && !opts.allowMixed) {
    failures.push(
      `Mixed PR: ${runtime.length} runtime file(s) and ${tooling.length} docs/tooling file(s). ` +
        `Keep app/runtime changes off docs/tooling bulk, or set the allow-mixed-scope label.`,
    );
  }

  return {
    vendorAdds,
    runtime,
    tooling,
    ok: failures.length === 0,
    failures,
  };
}
