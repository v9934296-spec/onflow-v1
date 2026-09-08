# OnFlow v1 — Phase 0 docs

File paths in OF-001–OF-005 that point at `services/api` refer to the Onflow Demo reference backend, not this client tree.

| Document | Purpose |
|----------|---------|
| [of-001-analysis-path.md](./of-001-analysis-path.md) | OF-001 **closed:** live clip analysis path map. |
| [of-002-intelligence-contract.md](./of-002-intelligence-contract.md) | OF-002 **closed:** characterization tests freezing the current AI parse/assemble contract. |
| [of-003-attempt-sync-immutability.md](./of-003-attempt-sync-immutability.md) | OF-003 **closed** (working-tree verification): attempt-sync immutability (spec BE-001). Railway parity unverified. |
| [of-004-quota-reservation.md](./of-004-quota-reservation.md) | OF-004 **closed** (working-tree verification): quota reserve/finalize/release (spec BE-002). Stale 429 fixture corrected; no production quota change. Railway parity unverified. |
| [of-005-session-lifecycle.md](./of-005-session-lifecycle.md) | OF-005 **closed** (working-tree verification): ended-session uploads + session-end conflict (spec BE-004 / BE-003). Production remediation for concurrent `ended_at` and `clips.captured_at`. Railway parity unverified. |
| [of-006-compression-contract.md](./of-006-compression-contract.md) | OF-006 **closed by owner** (EXP-001). Steps 1–2 only. No PUT-file matrix, no encoder. §18 item 7 unmeasured. |
| [of-007-doc-001.md](./of-007-doc-001.md) | OF-007 **superseded.** DOC-001 closeout is the Phase 0 gate audit, not a new ticket. |
| [phase-0-gate-audit.md](./phase-0-gate-audit.md) | Phase 0 final gate audit. Spec **Approved** 2026-09-01 (item 7 accepted unmeasured). |
| [exp-001-compression.md](./exp-001-compression.md) | Launch-client EXP-001 device table (empty; 6 Mbps still a candidate). |
| [launch-qa-checklist.md](./launch-qa-checklist.md) | Physical-device TestFlight GO / NO-GO matrix. |
| [repo-hygiene.md](./repo-hygiene.md) | Vendor skills stay out; PR scope split; CODEOWNERS + required review. |

## Phase 0 ledger

Contract verification against the V1 build spec. **Phase 0 closed by owner 2026-09-01.** Spec is **Approved.** Item 7 / Q&A 11 remain measurement debt. See [phase-0-gate-audit.md](./phase-0-gate-audit.md).

| Ticket | Contract | Status |
|--------|----------|--------|
| OF-001 | Live analysis-path mapping | **Closed** |
| OF-002 | Intelligence parse/assemble freeze | **Closed** |
| OF-003 | BE-001 attempt immutability | **Closed** (working tree; Railway unverified) |
| OF-004 | BE-002 quota reservation/finalization | **Closed** (working tree; Railway unverified) |
| OF-005 | BE-003 + BE-004 session lifecycle | **Closed** — production remediation (Railway unverified; `clips.captured_at` migration must deploy with app code) |
| OF-006 | EXP-001 compression | **Closed by owner** (no PUT-file matrix; no encoder; Q&A 11 OPEN) |
| OF-007 | DOC-001 remaining UNVERIFIED / §18.3 | **Superseded** by the Phase 0 gate audit |

Phase 1 may start. Do not treat 6 Mbps as measured. Q&A 11 stays OPEN as measurement debt.

## V1 mobile redesign ledger

The redesign supersedes spec §7 (screen presentation) and §10 (design system) by owner decision. Contract, truth rules and state ownership are unchanged.

| Document | Purpose |
|----------|---------|
| [redesign-000-phase-0-audit.md](./redesign-000-phase-0-audit.md) | Audit findings, dead-control list, owner decisions B1–B3, implementation order. |
| [redesign-001-design-foundation.md](./redesign-001-design-foundation.md) | Phase 1 **implemented:** tokens, primitives, what changed and what is guarded by test. |
| [redesign-002-session-screen.md](./redesign-002-session-screen.md) | Phase 2 slice 1 **implemented:** the canonical SESSION screen, persisted attempt queue, pending session-end retry. |
| [redesign-003-review-step.md](./redesign-003-review-step.md) | Phase 2 slice 2 **implemented:** attempt review with real footage playback, USE CLIP / RETAKE / CANCEL, media-ownership rule. |
| [redesign-004-result-screen.md](./redesign-004-result-screen.md) | Phase 2 slice 3 **implemented:** Result reordered around the read, footage restored, score demoted, LANDED / DIDN'T, loop closed. |
| [redesign-005-trick-picker.md](./redesign-005-trick-picker.md) | Phase 2 slice 4 **implemented, closes Phase 2:** trick rows, segmented modifiers, and a real usage tally behind MOST CALLED. |

## Skater personalization

| Document | Purpose |
|----------|---------|
| [personalization-001-client.md](./personalization-001-client.md) | Client **implemented** against the designed contract. Age step **paused** (P2). Backend deliverables listed; endpoint not yet in `openapi.json`. |
