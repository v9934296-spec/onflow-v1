# Repo hygiene

This client repo is product runtime. Agent skill trees and other vendor dumps do not ship here.

## Vendor skills

`.claude/**` and `.agents/**` are local-only. `uipro init` and similar installers may write them on disk; git ignores them.

Do not add them as a submodule. If the skill pack needs a home, keep it in a separate private repo (suggested name `onflow-agent-skills`), not in `onflow-v1`.

Deleting a vendored path is allowed. Adding one fails `pr-scope`.

## PR scope

CI job `pr-scope` splits the diff:

| Bucket | Paths |
|--------|--------|
| Runtime | `app/`, `src/`, `openapi/`, package/Expo manifests |
| Docs / tooling | `docs/`, `.github/`, `scripts/`, root markdown |
| Vendor (banned adds) | `.claude/`, `.agents/`, `skills-lock.json` |

A few docs next to a runtime fix is fine. Eight or more docs/tooling files on the same PR as runtime changes is blocked unless the PR has the `allow-mixed-scope` label.

## Required review for app paths

`.github/CODEOWNERS` names `@v9934296-spec` on `/app/`, `/src/`, `/openapi/`, and the package/Expo manifests.

That file does nothing until GitHub Settings → Branches → `main` has:

1. Require a pull request before merging
2. Require review from Code Owners
3. Require status checks: `ci / verify` and `pr-scope / scope`

Do not merge app/runtime changes from a docs/tooling PR.
