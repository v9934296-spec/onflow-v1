# REDESIGN-005 — Trick picker (Phase 2, slice 4)

**Date:** 2026-09-05  
**Status:** Implemented. Closes Phase 2.

## The bug in "Popular"

`popularFromRecent` counted occurrences in `recentTrickIds`. But
`rememberRecentId` de-duplicates that list by definition:

```ts
const next = [trickId, ...existing.filter((id) => id !== trickId)];
```

so every count was exactly `1`, the sort was a no-op, and "Popular" rendered
the recent list in a slightly different order. It looked like a feature and
was arithmetic that could not produce a different answer.

Recency and frequency are different questions and now have different storage.
`kvKeys.trickUsage` holds a real tally, bumped on every confirm alongside the
recency list. `popularFromUsage` requires `minUses: 2` — a trick tried once is
recent, not established — and the tally is capped at 60 entries so a
long-lived install cannot grow it without bound. The section is renamed **MOST
CALLED**, which is what it now measures.

Existing installs start with an empty tally, so the section stays hidden until
counts build. No migration needed.

## The screen

```
CHOOSE TRICK                                        CLOSE
[ Search                                     ]
ALL   FLIP   GRIND   SLIDE   TRANSITION             ← text tabs, volt when active
──────────────────────────────────────────────────
RECENT
▍KICKFLIP                              flip · 7×    ← TrickRow, Bebas 34
 TRE FLIP                              flip · 3×
MOST CALLED
 HEELFLIP                              flip · 4×
ALL TRICKS
 …
══════════════════════════════════════════════════  ← appears only once picked
KICKFLIP
STANCE      [REGULAR][SWITCH][NOLLIE][FAKIE]
Regular here means your natural goofy stance.       ← from the skater profile
DIRECTION   [FRONTSIDE][BACKSIDE]
[ ███████████  CONFIRM  ███████████ ]
```

Two composition decisions worth naming:

**The modifier footer appears only after a trick is picked.** Stance and
direction are meaningless without a trick to modify, and hiding them until
then leaves the list as tall as the screen allows. The old screen showed
search, categories, list, stance, direction and confirm simultaneously, which
left the list about a third of the viewport.

**Categories became text tabs, not pills.** A category is a filter on the list
below it; a pill reads as a tag on the thing it sits inside. Tapping the
active tab clears it.

## Components

| New | Role |
|---|---|
| `TrickRow` | Name in Bebas 34, category and call count as quiet meta, volt rule + fill when selected. A row, not a card |
| `SegmentedSelector` | Hard-edged segments for a short fixed vocabulary. Tapping the selected segment clears it, because these modifiers are optional |

| Deleted | Why |
|---|---|
| `Chip` / `FilterPill` | Last consumer was this screen. Replaced by `SegmentedSelector` and the category tabs |
| `Stepper` | Never had a consumer — flagged dead in the Phase 0 audit |

`TrickCard` survives only because Home still uses it; it goes in Phase 3.

## Preserved

Canonical identity still comes from the server registry: search falls back to
`nearestTricks` and never to an invented name. Results still cap at 12.
Profile style ranking still reorders and never removes. The stance explainer
still explains rather than preselecting — a goofy skater's normal stance is
still called Regular.

## Verification

`verify:phase0` green, 87 tests (4 new on usage counting, the bound, the
two-use floor, and unknown ids).

**Not verified on a device.** Keyboard avoidance with the footer visible, and
`SegmentedSelector` text at 200% Dynamic Type (it shrinks to 0.7 rather than
truncating) are unseen.

---

## Phase 2 closed

Session → Film → Review → Analyzing → Result → Session runs end to end, with
the same trick slate carried through every screen. Four defects were fixed
along the way that the redesign surfaced but did not cause: lost offline
outcomes, unretried session ends, `captured_at` drift, and this one.
