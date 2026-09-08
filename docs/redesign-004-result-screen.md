# REDESIGN-004 — Result screen (Phase 2, slice 3)

**Date:** 2026-09-05  
**Status:** Implemented. Third slice of Phase 2.

The old Result screen led with a 42pt volt number. The trick name sat under it
in 17pt body, the footage was never shown at all, and two fields the mapper
already produced — `reviewSummary` and `primaryIssueLabel` — were dropped on
the floor. It read as a score report from a model, which is precisely what the
brief says OnFlow must not be.

## Hierarchy, reordered

```
┌──────────────────────────────────────────────┐
│         FOOTAGE — video_playback_url         │  ← plays, loops; absent → nothing
└──────────────────────────────────────────────┘
KICKFLIP                                          ← slate, Bebas 60
REGULAR · FRONTSIDE
ATTEMPT 08
══════════════════════════════════════════════════
READ
Back foot low on the catch                        ← primary_issue_label
You had enough height. Your back foot stayed…     ← review_summary
WORK ON
Get the back foot over before the catch           ← best_cue
──────────────────────────────────────────────────
POP          Good                            8    ← mechanics, two columns
ROTATION     Late                            5
CATCH        Back foot low                   4
──────────────────────────────────────────────────
SCORE 7 / 10                                      ← mono, near the bottom
══════════════════════════════════════════════════
WHAT HAPPENED?
      ●                    ×
   LANDED               DIDN'T                    ← 76pt targets, volt/alum rule
──────────────────────────────────────────────────
[ █████████  NEXT ATTEMPT  █████████ ]
[ CHANGE TRICK ]                    END SESSION
```

The score is still shown when the server provides one (spec §7.7) and still
obeys §11.4 — it just isn't the headline. `providerModel` stays retained and
**undisplayed**: naming the model is the AI-forward move the brief rules out.

## What this fixes

| Audit finding | Fix |
|---|---|
| Footage never shown; `videoPlaybackUrl` mapped and dropped | `FootagePlayer` at the top. Missing URL renders nothing, never a placeholder |
| `reviewSummary`, `primaryIssueLabel` mapped and never rendered | Both drive the READ block |
| Score was the largest element on screen | Demoted to one mono line below the mechanics |
| Trick name in 17pt body | `TrickSlate`, same identity carried from Session → Capture → Review → Result |
| Loop ended at Home | NEXT ATTEMPT → Capture · CHANGE TRICK → picker · END SESSION → confirm → Session |

## Outcome wording (owner decision B2)

`LANDED` / `DIDN'T`, in `src/ui/copy/index.ts`. Domain values are untouched —
`landed | missed`, exactly the backend enum. Only the words changed. Each
choice carries a glyph and a word as well as color, and `DIDN'T` announces as
"Didn't land" so VoiceOver is unambiguous.

Truth rule 6 holds: when the engine disagrees with the skater, both are shown
and the line still reads *"Your call is the record."*

## Leaving without a call

An attempt is never auto-created without a reported outcome (spec §7.8), so
NEXT ATTEMPT and CHANGE TRICK now prompt when nothing is recorded rather than
silently continuing. The confirm's default action is to go back; leaving
unrecorded is the secondary. END SESSION saves the call first when there is
one, and says plainly that there isn't when there isn't.

## Also in this slice

`ReadinessBanner` now renders only for `limited` and `insufficient`. `usable`
is the ordinary case and does not need a banner announcing normality — the
information is still carried by the notes and by absence.

## Verification

`verify:phase0` green, 83 tests. No new tests: this slice is composition over
already-tested mappers (`truth.test.ts` covers score gating, mechanics
suppression and engine/skater separation) and already-tested attempt
arithmetic.

**Not verified on a device.** `video_playback_url` is a remote URL — buffering,
first-frame latency and failure behaviour are unseen, and unlike the review
screen's local file this one depends on the network. A playback failure
currently renders as an empty 16:9 area; a real failure state is worth adding
once the behaviour has been observed on hardware.
