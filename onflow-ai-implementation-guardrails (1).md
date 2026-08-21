# OnFlow — AI Implementation Expectations & Guardrails

**Applies to:** any AI coding agent working in the OnFlow client or `services/api`

**Companion document:** *OnFlow — Product & Build Specification*

**Status:** Approved operating contract, subject to the live contract snapshot.

**Owner:** Vincent (Toner)

This document defines **how** an agent works. The specification defines **what** gets built. If an instruction here conflicts with the specification, this document loses on product questions and wins on process ones.

---

## 1. Role

The agent is an implementation collaborator. It:

- Follows the approved specification and the verified contract snapshot.

- Reports conflicts before implementing them.

- Does not redefine product scope.

- Does not invent backend capabilities.

- Does not fabricate data to make a screen look finished.

- Does not silently resolve meaningful product ambiguity.

The agent is expected to disagree when the specification is wrong. Disagreement means raising it before writing code, not quietly building something different.

---

## 2. Source-of-truth order

1. The current explicit instruction from Vincent

2. The approved Product & Build Specification

3. The live OpenAPI schema and backend source

4. Approved design tokens and component specifications

5. Existing `onflow-lite` behavior

6. Parity requirements

7. Tests

8. Implementation assumptions

**One qualifier on rank 1.** A current instruction outranks the specification for *how* to build something. It does not silently expand locked scope. If an instruction would add a feature the specification lists as excluded, the agent implements nothing and says so in one line: *"That's excluded in §3 — want me to build it and update the spec, or leave it out?"* Every scope creep arrives dressed as a current instruction, and this is the only thing standing between the app and a feed nobody approved.

**A current instruction cannot silently waive** user-data safety, authentication, billing integrity, legal requirements, truth rules, or destructive-action safeguards. Waiving any of those requires an explicit update to both this document and the specification — not a message in a chat.

**On conflict between any two sources,** the agent stops the affected work, names the exact conflict, explains the implementation consequence, recommends a resolution, and continues only on unaffected work.

---

## 3. Scope guardrails

The agent must not add, scaffold, stub, or leave a route for: feed · following · reactions · comments · discovery · public profiles · video parts · community rankings · named coach personalities · progression charts · share · Trick Battle · placeholder social metrics · "coming soon" surfaces.

The reference client has working code for several of these. **Their existence in `onflow-lite` is not permission to port them.** They are listed as approved deviations precisely so they can't be reintroduced as parity work.

An excluded feature ships only with explicit approval *and* an updated specification. Not one, both.

---

## 4. Truth guardrails

The agent must never:

- Invent a score, or convert a missing score to zero.

- Compute confidence on the client.

- Assign an evidence tag the server didn't provide.

- Advance analysis stages on a timer.

- Show a determinate percentage for anything but observed upload bytes.

- Fabricate feed events, session statistics, or placeholder media presented as real footage.

- Treat an engine verdict as the skater's manual outcome.

- Hide a server-provided uncertainty or unavailability reason.

- Hardcode a store price.

- Write code that pretends an unsupported backend operation exists.

**Scores are 0–10 and nullable.** `null` means the engine abstained. Rendering it as `0`, `—`, or `0.0` inside a score component is a truth-rule violation, not a formatting choice.

**A missing component is omitted.** It is never rendered with a default tag, a placeholder verdict, or a "not assessed" label the server didn't send.

---

## 5. Contract guardrails

Before implementing anything that touches the API, the agent must read: the generated types, the runtime schemas, and the actual FastAPI router or schema file. Not one of the three — all three. It confirms enum values, nullability, error behavior, idempotency, authentication, and pagination.

Facts that are easy to get wrong and are already settled:

**These facts are a cache, not the source.** Each carries its source file. Re-verify against the file before relying on one; if it has drifted, fix this table in the same change.

| Fact | Value | Source |

|---|---|---|

| `clip_id` | **Server-generated** by `initiate-upload`. The client cannot supply one | `routers/clips_v1.py` |

| Upload | Two steps: `initiate-upload` → PUT → `complete-upload` | `routers/clips_v1.py` |

| `job_id` | Equals `clip_id` — poll `/clips/jobs/{clip_id}` to reconcile | `services/clip_v1_pipeline.py` |

| Quota | Charged at `complete-upload`; released **only** on enqueue failure | `services/clip_v1_pipeline.py` |

| Job status | `pending` · `processing` · `completed` · `failed` | `routers/clips.py` |

| Score range | 0–10, nullable | `schemas/clips.py` |

| Attempt outcome | `landed` \| `missed` — two values | `schemas/session_attempts.py` |

| Analysis landed | `yes` \| `no` \| `unclear` — a different field | `schemas/clips.py` |

| Attempt sync | **Upsert.** Replaying an ID overwrites session, trick, outcome, timestamp | `routers/session_attempts.py` |

| Clip limits | ≤ 30s, ≤ 100MB, `video/mp4` or `video/quicktime` | `schemas/clips.py` |

| Entitlement | The exact string `"onflow-lite Pro"` | `src/billing/constants.ts` |

| Rate limits | **Three different 429 shapes.** SlowAPI prose, `*_analysis_cap_reached`, and a concurrency message | `core/rate_limit.py`, `services/usage_limits.py`, `services/clip_v1_pipeline.py` |

| Analysis ETA | Static `now + 45s`. **Never displayed** | `services/clip_v1_pipeline.py` |

**Never branch on an English error string.** Branch on status code and `Retry-After`.

**Comments and docstrings explain intent; they do not prove behavior.** A docstring saying "idempotent batch upsert" sits directly above code that overwrites four fields. Verify against schemas, route bodies, and tests before declaring a contract fact.

If a required field does not exist, the agent labels it `BACKEND CHANGE REQUIRED`, names the affected screen, proposes the smallest migration that would satisfy it, does **not** fabricate a client-side substitute, and continues with unrelated work — **unless the current task explicitly authorizes the corresponding approved migration**, in which case it implements the migration per §20.

---

## 6. Architecture guardrails

- Routes stay thin. Logic lives in `domain/`.

- UI consumes domain models, never wire types.

- `domain/` imports no React, no React Native, no networking.

- The **client's** API transport layer contains no presentation copy. Backend responses may carry diagnostic detail; the client maps machine-readable codes to approved copy. New backend endpoints return structured codes rather than requiring clients to parse prose.

- Durable mutations live in SQLite. The query layer is read-through only.

- The in-memory store is not durable mutation storage.

- Sync KV holds only small synchronous values.

- Generated API files are never hand-edited.

- Runtime validation runs before mapping, always.

- User-facing error text comes from the approved copy catalog, not from a caught exception.

- Cross-layer imports obey the lint boundaries. Disabling a boundary rule to make something compile is a stop condition, not a workaround.

---

## 7. State guardrails

- The selected trick survives Another Clip and survives relaunch.

- The selected trick clears only on explicit change or session end.

- The active session recovers after termination.

- Draft outcomes survive backgrounding.

- Every durable operation has a stable **client** `local_id` before the first network call. The server `clip_id` arrives from `initiate-upload` and is adopted then — the agent never pretends to know it earlier.

- A retried `initiate-upload` is **not** server-idempotent today. A lost response can leave an orphan pending clip. Reconcile it; do not claim exactly-once.

- Duplicate taps produce one logical resource.

- Account-specific state never crosses accounts.

- No queued mutation is silently dropped.

- Schema-version mismatches are migrated or surfaced — never reinterpreted.

- Permanent failures are not retried silently.

---

## 8. Media guardrails

- **Never delete an imported original.** Cancellation drops the reference, not the user's file.

- Distinguish app-recorded files, app-created derivatives, and user-owned library assets in code, not by convention.

- Preserve footage when quota is exhausted.

- Preserve footage after analysis failure.

- Confirm ownership before any local delete.

- Never log media URLs or presigned URLs.

- Validate MIME type, duration, and size client-side before `initiate-upload` — the server limits are known, so a rejected upload after a full transfer is a preventable waste of a skater's data.

- Keep capture controls one-handed. No filters, no decorative camera controls.

---

## 9. Upload and idempotency guardrails

- Anchor the outbox on a client `local_id`; adopt the server `clip_id` when `initiate-upload` returns.

- Persist recoverable state **before** starting the upload, not after.

- Re-request expired presigned URLs.

- Calculate progress only from observed bytes.

- Never describe a single-shot PUT as resumable.

- Distinguish retryable from permanent failure; never retry auth or validation failures indefinitely.

- Respect server quota and 429 decisions. A 429 is not a network blip.

- Never trust a client-computed hash as server authority.

- Correctness never depends solely on a response-replay cache — a device can be offline longer than any TTL.

- **Where the server lacks permanent idempotency, the agent documents the limitation, minimizes duplicate risk, and does not claim exactly-once behavior.** `initiate-upload` is currently in this category.

- Treat a `409` from `complete-upload` as a reconciliation signal, not an upload failure. Poll the job and recover.

- Idempotency behavior is covered by tests, not assumed.

---

## 10. Authentication and account isolation

- Production uses Apple and Google only. Any development auth path must be impossible in production, and the agent verifies that rather than assuming it.

- Sign-out addresses queued media explicitly and names the count.

- Preserved media stays sealed to the account that filmed it. Another account cannot see, upload, or delete it.

- Tokens and sensitive identifiers are never logged.

- A revoked session routes safely without unexpectedly destroying footage.

---

## 11. Billing guardrails

- Prices come only from live RevenueCat objects. A hardcoded price is a release blocker, not a placeholder.

- Entitlements are never inferred from UI state.

- Purchase completion does not fabricate immediate backend synchronization.

- Restore Purchases is always available.

- Pro users see subscription management, not purchase options.

- A failed analysis does not consume quota unless the server returned a usable result.

- A quota failure never deletes footage.

- Store and backend disagreement resolves to a recoverable sync state, never a paywall shown to a paying user.

---

## 12. UI guardrails

- Use approved tokens. No arbitrary colors.

- Semantic red is never decorative. Recording red stays in media controls and is a separate namespace.

- Volt means action or positive state.

- **Color is never the only indicator.** Every state carries a label or glyph too.

- Body text is never all uppercase. Mono is never used for human-written prose.

- Touch target minimums are respected: 48pt general, 56 primary, 64 outcome, 76 capture.

- Bottom navigation hides on capture, analyzing, and result.

- Loading, empty, partial, error, and offline states are implemented before a screen is called done.

- An unsupported metric renders as an empty state, never as zero.

---

## 13. Accessibility guardrails

Every control has an accessible label · focus order matches visual order · Dynamic Type tested to 200% (Capture overlay caps visual scale at 130% but keeps labels unclamped) · feedback text wraps rather than truncating · reduced motion disables ambient loops · outcome states carry glyph and label alongside color · errors are announced · critical actions remain usable outdoors and one-handed.

---

## 14. Testing expectations

Test scope is risk-based, not uniform:

| Change | Suite |

|---|---|

| Copy, styling, single component | Affected tests only |

| A meaningful feature | Full relevant package suite |

| Contract, schema, auth, billing, upload, or shared models | **Full client and backend suites** |

Always run affected tests. Always state explicitly which suites were **not** run.

The agent must never:

- Claim success because the code compiles or typechecks.

- Test only the happy path.

- Weaken an assertion to make a test pass.

- Delete or skip a failing test without explicit justification.

- Claim device testing it did not perform.

"I ran the unit tests; I did not run this on a device" is a good report. "Done ✅" after a typecheck is not.

---

## 15. Visual implementation expectations

Compare against approved mockups · test on representative phone dimensions including the smallest supported · verify safe areas and keyboard behavior · verify long-copy and loading layouts · verify 200% Dynamic Type · verify contrast · use real media only where permitted · **do not redesign while implementing** · record every intentional visual deviation in the handoff.

---

## 16. Change management

**Before changing code:** inspect the relevant files, read repository instructions, check the working tree for uncommitted user changes, identify affected tests, and state any assumption that materially shapes the implementation.

**During:** make the smallest coherent change · preserve unrelated work · avoid unnecessary dependency changes · no broad refactors without approval · keep migrations reversible where possible · never hand-edit generated files.

**After, report:**

- What changed and why

- Files affected

- Tests run, and tests not run

- Remaining risks

- Backend dependencies introduced or discovered

- Manual verification steps

- Any deviation from the specification

---

## 17. Prohibited

The agent must not: rewrite stable backend systems without authorization · change product scope to make implementation easier · add unrequested features · hide incomplete work behind fake data · hardcode secrets · expose tokens or presigned URLs · delete user media without confirmed ownership · bypass authentication · disable validation · loosen a type to `any` to avoid fixing a contract mismatch · swallow errors · retry permanent failures forever · mark work complete while required tests fail · claim untested work is tested · modify billing products or prices · deploy, publish, or submit a build without explicit authorization.

---

## 17b. Secrets in output

Beyond not logging secrets in code, the agent must never put them in conversation or tool output:

- Never print a `.env` file containing real values.

- Never include tokens, session JWTs, or API keys in output.

- Never expose presigned URLs.

- Redact connection strings.

- Inspect configuration by variable **name and presence**, never by value.

- Never paste production payloads containing user information, notes, spot labels, or media URLs.

---

## 17c. Backend migration guardrails

Any backend change ships with: a forward migration · backward compatibility for the currently deployed client · a rollback or compensating strategy · a data backfill plan where needed · lock-duration consideration · an index creation strategy (concurrent where the table is large) · verification against PostgreSQL, not only SQLite · OpenAPI regeneration · a minimum compatible client version · and an explicit deployment order relative to the client release.

---

## 17d. Ticket sizing

**Never hand an agent the whole specification and ask for the app.** A 40,000-line generated codebase is technically yours and practically unmaintainable — you cannot review what you did not decide, and you cannot debug what you never understood.

One specification section, one ticket, one commit. The task is not "build OnFlow." It is:

> Implement the five-state contextual center action defined in §6. No backend calls. No camera. No analysis.

Then you read it, understand it, test it, and commit it before the next one starts.

A task that spans more than one screen, or that touches both the client and the backend, is two tasks. An agent that proposes to "also handle" an adjacent screen while implementing one is expanding scope and should be told no.

---

## 18. Stop conditions

The agent stops the affected work and asks for direction when:

- Product requirements conflict with each other.

- The live API contradicts the specification.

- A required backend field does not exist.

- A destructive migration would be required.

- User data or footage could be lost.

- Account isolation is uncertain.

- Billing behavior is unclear.

- Legal copy or pricing is missing.

- The action requires credentials or authority not provided.

- A design choice would materially change the approved experience.

- Tests reveal a larger architectural conflict than the task assumed.

- A lint boundary or validation rule would have to be disabled to proceed.

- A documented contract fact turns out to be false against the code.

Stopping is cheap. A wrong assumption implemented across six files is not.

---

## 19. Definition of done

A task is complete only when the requested behavior is implemented · relevant acceptance criteria pass · truth rules remain intact · required tests pass · loading and failure states are handled · accessibility requirements are addressed · no unrelated user changes were overwritten · backend dependencies are documented · deviations are disclosed · and remaining unverified work is named explicitly.

---

## 20. Task template

```text

Task:

[One concrete outcome]

Specification:

[Section numbers from the Product & Build Specification]

In scope:

[Exact behavior to implement]

Out of scope:

[Adjacent behavior not to touch]

Backend contract:

[Endpoints, schemas, known migrations, verified facts]

Acceptance criteria:

- [...]

Required states:

- Loading

- Empty

- Error

- Offline

- Permission / entitlement, if applicable

Truth constraints:

- [...]

Files likely involved:

- [...]

Tests required:

- [...]

Do not:

- [...]

Handoff must include:

- Files changed

- Tests run, and tests not run

- Remaining risks

- Manual verification steps

- Any spec deviation

```