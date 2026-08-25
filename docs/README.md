# OnFlow v1 — Phase 0 docs

File paths in OF-001–OF-005 that point at `services/api` refer to the Onflow Demo reference backend, not this client tree.

| Document | Purpose |
|----------|---------|
| [of-001-analysis-path.md](./of-001-analysis-path.md) | OF-001 **closed:** live clip analysis path map. |
| [of-002-intelligence-contract.md](./of-002-intelligence-contract.md) | OF-002 **closed:** characterization tests freezing the current AI parse/assemble contract. |
| [of-003-attempt-sync-immutability.md](./of-003-attempt-sync-immutability.md) | OF-003 **closed** (working-tree verification): attempt-sync immutability (spec BE-001). Railway parity unverified. |
| [of-004-quota-reservation.md](./of-004-quota-reservation.md) | OF-004 **closed** (working-tree verification): quota reserve/finalize/release (spec BE-002). Stale 429 fixture corrected; no production quota change. Railway parity unverified. |
| [of-005-session-lifecycle.md](./of-005-session-lifecycle.md) | OF-005 **closed** (working-tree verification): ended-session uploads + session-end conflict (spec BE-004 / BE-003). Production remediation for concurrent `ended_at` and `clips.captured_at`. Railway parity unverified. |
| [of-006-compression-contract.md](./of-006-compression-contract.md) | OF-006 **open / device-blocked** (EXP-001). Steps 1–2 done. No encoder until PUT-file matrix. Phase 0 not complete. |
| [of-007-doc-001.md](./of-007-doc-001.md) | OF-007 **open / blocked on OF-006** (DOC-001). Remaining UNVERIFIED values + §18.3 design conflicts. |
| [exp-001-compression.md](./exp-001-compression.md) | Launch-client EXP-001 device table (empty until physical iPhone). |
| [launch-qa-checklist.md](./launch-qa-checklist.md) | Physical-device TestFlight GO / NO-GO matrix. |

## Phase 0 ledger

Contract verification against the V1 build spec. **Not complete** while OF-006 / §18 gate item 7 is open. Do not start launch-client feature implementation.

| Ticket | Contract | Status |
|--------|----------|--------|
| OF-001 | Live analysis-path mapping | **Closed** |
| OF-002 | Intelligence parse/assemble freeze | **Closed** |
| OF-003 | BE-001 attempt immutability | **Closed** (working tree; Railway unverified) |
| OF-004 | BE-002 quota reservation/finalization | **Closed** (working tree; Railway unverified) |
| OF-005 | BE-003 + BE-004 session lifecycle | **Closed** — production remediation (Railway unverified; `clips.captured_at` migration must deploy with app code) |
| OF-006 | EXP-001 compression | **OPEN — physical-device blocked** |
| OF-007 | DOC-001 remaining UNVERIFIED / §18.3 | **OPEN — blocked on OF-006** |

Resume OF-006 only with the five PUT-file artifacts → probe → matrix → Step 4 remediation. Do not add an encoder or invent work while waiting.
