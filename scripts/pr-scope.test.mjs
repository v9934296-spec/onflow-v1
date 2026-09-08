import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluatePrScope, isRuntime, isVendor } from "./pr-scope.mjs";

describe("pr scope", () => {
  it("treats app and src as runtime, .claude as vendor", () => {
    assert.equal(isRuntime("app/trick.tsx"), true);
    assert.equal(isRuntime("src/store/net.ts"), true);
    assert.equal(isRuntime("docs/README.md"), false);
    assert.equal(isVendor(".claude/skills/ui-ux-pro-max/SKILL.md"), true);
    assert.equal(isVendor(".agents/skills/tdd/SKILL.md"), true);
  });

  it("allows deleting vendored skills", () => {
    const result = evaluatePrScope([
      { path: ".claude/skills/brand/SKILL.md", status: "D" },
      { path: "docs/repo-hygiene.md", status: "A" },
    ]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.vendorAdds, []);
  });

  it("rejects adding vendor skills even on a docs PR", () => {
    const result = evaluatePrScope([{ path: ".claude/skills/brand/SKILL.md", status: "A" }]);
    assert.equal(result.ok, false);
    assert.match(result.failures[0] ?? "", /Vendor skill trees/);
  });

  it("allows a small doc note with a runtime fix", () => {
    const result = evaluatePrScope([
      { path: "src/store/net.ts", status: "M" },
      { path: "docs/README.md", status: "M" },
    ]);
    assert.equal(result.ok, true);
  });

  it("rejects a docs/tooling dump next to runtime changes", () => {
    const files = [
      { path: "src/store/net.ts", status: "M" },
      ...Array.from({ length: 8 }, (_, i) => ({ path: `docs/note-${i}.md`, status: "A" })),
    ];
    const blocked = evaluatePrScope(files);
    assert.equal(blocked.ok, false);
    const allowed = evaluatePrScope(files, { allowMixed: true });
    assert.equal(allowed.ok, true);
  });
});
