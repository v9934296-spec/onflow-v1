# Phase 0 final gate audit

**Date:** 2026-09-01  
**Against:** `onflow-product-build-spec (1).md` as it sits in this repo  
**Client evidence:** this tree only. `services/api` is not here; OF-003–005 remain working-tree / Railway-unverified as already recorded.

This is the Phase 0 closeout inventory. It is **not** a new OF-007 ticket. Remaining work is either already ticketed, deferred with a standing rule, or an owner waiver.

---

## Verdict

**Approved** 2026-09-01 by owner. Phase 1 may start.

Item 7 is still unmeasured. Font-on-device was not confirmed on a physical iPhone. Railway parity for BE-001–004 is unverified. Those remain carry-forward debt. They no longer block Phase 1.

---

## 1. Every remaining `UNVERIFIED` (and UNVERIFIED-by-omission)

The spec’s own trap is §8: *“Anything not listed here is `UNVERIFIED`.”* Literal `UNVERIFIED` tokens were few. Omissions and stale “still open” sentences were the rest.

| Item | Spec locus | Evidence | Disposition |
|------|------------|----------|-------------|
| `pte_rating` / `pte_score` bound | §8.4 | OpenAPI: integer \| null, **no min/max**. Client never maps or renders PTE. Out of launch scope (§3, §8.4). | **Closed for launch.** Bound still unknown; do not display. |
| `best_pte_score` / `average_pte_score` bound | §8.4 | OpenAPI: number \| null, **no min/max**. Same as above. | **Closed for launch.** Do not display. |
| Compression parameters | §7.5, Q&A 11 | Candidate `6_000_000` in `src/domain/compression.ts`. No encoder. EXP-001 table empty. OF-006 owner-closed 2026-09-01. | **Still OPEN.** Same as §18 item 7. Not a locked launch number. |
| Cross-provider score comparability | Q&A 1, §8.4, §11.4 | No calibration run. Launch rule already coded: `providerModel` retained; no averages. | **Deferred** under §11.4. Not a Phase 0 value to invent. |
| Display rounding / `limited` score | §11.4 “still open before Phase 3” vs Q&A 5 | Stale. Mapper + tests: whole numbers 0–10; `insufficient` hides score; `limited` shows only when present. | **Closed.** Spec text brought in line with Q&A 5. |
| Evidence option (a) vs (b) | §11.5 “Pending change-1” | Stale. Option (b) decided. `ReadinessBanner` exists; no `EvidenceTag`. | **Closed.** |
| `GET /api/v1/tricks` | Missing from §8.1; BE-005 | In OpenAPI + `fetchTricks`. | **Closed.** Added to §8.1. |
| `GET /api/v1/sessions/{id}/attempts` | Missing from §8.1 | In OpenAPI + `fetchSessionAttempts`. | **Closed.** Added to §8.1. |
| Fonts | Q&A 9 still said Rubik | Code loads Bebas Neue + Sora + JetBrains Mono (`app/_layout.tsx`). OFL via `@expo-google-fonts`. **Not** rendered on a physical iPhone in this audit. | **Selected in code.** Device render still unconfirmed (Phase 0 exit). |
| Attempt-sync “today’s endpoint is an upsert” | §11.6 | Stale vs OF-003 working-tree close. | **Noted.** Railway unverified. |
| PATCH `ended_at` overwrite | Q&A 7 | Stale vs OF-005 working-tree remediation. Launch client already skips PATCH when `endedAt` is set (`endSession`). | **Noted.** Railway unverified. |
| 100 MB initiate vs 200 MiB complete | OF-006 pin | Inspected, not equated. | **Out of this closeout.** Separate if ever pinned. |

---

## 2. §18 launch gate (the nine items)

| # | Gate | Status | Evidence |
|---|------|--------|----------|
| 1 | Generic 429 + `Retry-After`, no prose parsing | **Closed** | `src/api/client.ts` `parseRetryAfter` + `kind: "rate_limited"`. Copy is generic (`errors.ts`). `structuredCode` ignores detail strings that contain spaces (SlowAPI prose). |
| 2 | Attempt-ID mutation | **Closed (working tree)** | OF-003. Railway unverified. This repo has no `services/api`. |
| 3 | Failed-analysis quota release | **Closed (working tree)** | OF-004. Railway unverified. OF-004 itself recorded no production quota change. |
| 4 | Uploads into ended sessions | **Closed (working tree)** | OF-005. Railway unverified. `clips.captured_at` migration must still deploy with app code. |
| 5 | Evidence option (b), no per-component inference | **Closed** | Spec §9 option (b). `ReadinessBanner`. Truth tests. No `EvidenceTag`. |
| 6 | No cross-provider aggregation | **Closed** | §11.4. `providerModel` stored. No PTE / trend UI. |
| 7 | Compression measured and filled | **Accepted unmeasured** | Owner closed OF-006 without PUT files. Candidate bitrate only. **Waived for Phase 1.** |
| 8 | `complete-upload` 409 reconciled by job poll | **Closed** | §8.3. `runOutboxRow` treats 409 as `analyzing`; `job_id == clip_id`; `fetchClipJob` fails contract if completed job has no result. |
| 9 | Remaining `UNVERIFIED` values | **Closed or deferred** | PTE out of launch scope. Rounding / evidence stale lines closed. Compression remains item 7, not a second pile. Q&A 1 deferred under §11.4. |

**Also required to enter Phase 1 (not numbered in the nine):** §9 rows ticketed (OF-003–006 exist) · boundary lint bites (passed 2026-09-01) · font selected in code. Device render **accepted as code-only** by owner 2026-09-01.

---

## 3. Already-proven, not rewritten

No encoder. No PTE mapper. No Google SDK. No `EvidenceTag`. No fake analysis %.

Client already matches the launch rules that were sitting in the spec:

- Apple only (`app/sign-in.tsx`; no Google plugin)
- Bundle `com.onflow.lite` (`app.json`)
- Two outcomes (`OutcomeSelector` / attempt schema)
- Named analyzing phases from real state (`analyzingPhase`; determinate % only while `uploading`)
- 409 → poll, not a skater-facing error
- 429 → retryable, generic copy
- `endSession` does not PATCH over an existing `ended_at`

---

## 4. Genuine remaining gaps (only these)

1. **§18 item 7 / Q&A 11** — compression unmeasured. Owner waived OF-006. Still not “measured and filled.”
2. **Railway / staging parity** for BE-001–004. Working-tree closeouts are not production.
3. **OF-005 migration pair** — `clips.captured_at` + Alembic must deploy with the app.
4. **Font on a physical iPhone** — Phase 0 exit. Code + OFL license are not a device screenshot.
5. **Stray `files/` garage UI** — not OnFlow. Broke `npm run lint` until ignored. Still untracked.

---

## 5. Verification run (2026-09-01)

| Check | Result |
|-------|--------|
| `tsc --noEmit` | Pass |
| `eslint .` on product tree | Pass after ignoring `files/**` |
| `verify:boundaries` | Pass (6 probes bite; clean file accepted) |
| `api:check` | Pass (generated types match `openapi/openapi.json`) |
| `vitest run` | **15 passed** (`centerAction`, `outbox`, `truth`) |
| `npm run verify:phase0` as a single script | **Fail** until `files/` was ignored — garage `View` unused |

Backend pytest from OF-003–005 was **not** re-run. `services/api` is not in this tree.

---

## 6. OF-007

Not invented. `docs/of-007-doc-001.md` was a placeholder for DOC-001. This audit **is** the DOC-001 closeout. Remaining compression work stays on Q&A 11 / EXP-001, not a new ticket.

---

## 7. Approval

**Approved** 2026-09-01 by Vincent. Spec is Approved. Phase 1 may start.

Carry-forward (not blockers): Q&A 11 / no encoder; Railway unverified for OF-003–005; `clips.captured_at` deploy pair; font not confirmed on a physical iPhone.
