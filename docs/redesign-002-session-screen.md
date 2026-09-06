# REDESIGN-002 — Active Session screen (Phase 2, slice 1)

**Date:** 2026-09-05  
**Status:** Implemented. First slice of Phase 2 (canonical session flow).

The canonical OnFlow screen. It did not exist: the `Flow` tab was a 31-line
stub unreachable during the loop. Trick confirm jumped straight to Capture and
nothing in the product ever showed session time, attempt number, or what had
been landed.

## The screen — `app/(tabs)/flow.tsx`, tab titled SESSION

```
SESSION                                   01:42        ← OnFlowHeader + SessionClock
● OPEN · 2 CLIPS PROCESSING                            ← meta from the outbox
──────────────────────────────────────────────────
KICKFLIP                                               ← TrickSlate, Bebas 60, tap → picker
REGULAR · FRONTSIDE
ATTEMPT 07                                             ← mono volt; counts recorded outcomes
[ ████████████  F I L M  ████████████ ]                ← hero, 76pt, haptic
[ IMPORT CLIP ]                                        ← secondary → capture?import=1
══════════════════════════════════════════════════
THIS SESSION
▍KICKFLIP                     7 ATTEMPTS · 3 LANDED    ← active trick carries the rule
 TRE FLIP                     2 ATTEMPTS · 0 LANDED
LOG
#07  ● LANDED   14:02   KICKFLIP
#06  × MISSED   13:58   KICKFLIP
#02  × MISSED   QUEUED  TRE FLIP                       ← unsynced rows say so
──────────────────────────────────────────────────
[ CHANGE TRICK ]                      END SESSION      ← quiet, alum — ending is not an error
```

No session: `NO SESSION. / GO SKATE.` in slate type, one hero START SESSION.
No trick: muted slate `CHOOSE A TRICK`, hero CHOOSE TRICK.

No cards. Structure is rules and type. Every number on the screen is a count
of something recorded; nothing is projected or averaged.

## Integration defects fixed on the way

| Defect (audit) | Fix |
|---|---|
| `reportOutcomeAndMaybeContinue` discarded the sync result; an offline outcome was silently lost | `src/store/sessionAttempts.ts`: attempts are written to MMKV (per user) **before** the request, flushed on record, sign-in and every foreground; accepted ids move to confirmed, rejected ids (BE-001 conflict) yield to the server's record. `recordOutcome()` replaces it |
| No attempt-number source | `src/domain/attempts.ts`: per-trick numbering over confirmed ∪ pending, deduped by id |
| `pendingEnd` written on failure and never retried; not persisted | `PendingSessionEnd {sessionId, endedAt}` persisted under `kvKeys.pendingSessionEnd`; `closeSession` now ends locally at once and `retryPendingSessionEnd()` runs on foreground. Non-transient failures clear it |
| `IMPORT` had no entry point outside the camera | `capture?import=1` launches the library picker once on mount |
| Capture overlay had no attempt number | Shows `ATTEMPT 07` from the same source as the session screen |

Result → **Save to History** now returns to SESSION, not Home; **Another
clip** still goes straight to Capture. The loop is Session → Film → Result →
Session.

## New primitives

`TrickSlate` (name / modifiers / attempt; `muted` for the empty state) ·
`SessionClock` · `TrickTallyRow` · `AttemptLogRow` · `OnFlowButton
variant="quiet"` · `TabGlyph name="session"`.

## Not in this slice

Review step (USE CLIP / RETAKE), capture overlay restyle, Result restyle with
video, next-attempt loop on Result, trick-picker restyle, Popular fix. Those
are the next Phase 2 slices. Footage thumbnails in the log wait for the recap
contract (Phase 4), which is where clips are linked to tricks server-side.

## Verification

`verify:phase0` green. Tests: attempt arithmetic (5), session attempt queue
(4). **No device:** the clock, slate scaling (`adjustsFontSizeToFit` to 0.55
for long trick names) and the 76pt hero under Dynamic Type are reasoned
about, not seen.
