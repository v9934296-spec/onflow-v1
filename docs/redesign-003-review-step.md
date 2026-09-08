# REDESIGN-003 — Attempt review (Phase 2, slice 2)

**Date:** 2026-09-05  
**Status:** Implemented. Second slice of Phase 2.

Before this, recording resolved straight into upload. A clip the skater knew
was worthless — bailed before the trick, filmed the wrong person, camera
pointed at the ground — still cost an upload and an analysis. There was no
way to discard one, and the product had never shown footage at all.

## The screen — `app/review.tsx`

```
┌──────────────────────────────────────────────┐
│                                              │
│          FOOTAGE — 16:9, looping, muted      │  ← FootagePlayer, plays on arrival
│                                              │
└──────────────────────────────────────────────┘
KICKFLIP                                          ← the same slate as Session and Capture
REGULAR · FRONTSIDE
ATTEMPT 07
00:08 · 18 MB · FILMED                            ← mono, what the file actually is
──────────────────────────────────────────────────
[ ███████████  USE CLIP  ███████████ ]            ← hero, volt, haptic
[ RETAKE ]                          CANCEL        ← secondary · quiet
```

The footage is the hero and carries no chrome — no card, no border, no
radius. The slate identity established on Session follows the clip here
unchanged, so the skater never re-reads what they were trying.

For an imported clip the middle action reads **CHOOSE ANOTHER** and returns to
the library rather than the camera.

## Flow change

```
before   record ─────────────────────────────► enqueue ──► analyzing
after    record ──► ceilings ──► REVIEW ──┬──► enqueue ──► analyzing   (USE CLIP)
                                          ├──► capture                 (RETAKE)
                                          └──► session                 (CANCEL)
```

Ceilings (30s / 100MB) are still checked in `capture.tsx` **before** review —
there is no point watching a clip the server would reject, and the error is
more useful next to the record button. Nothing uploads from the capture
screen any more; `enqueueClip` is called only by USE CLIP.

`captured_at` is now stamped when the clip is **filmed**, not when it is
confirmed. Review time no longer drifts into the capture timestamp, which
matters to the `capture_after_session_end` rule (OF-005).

## Media ownership

`mayDeleteWorkingFile` (`src/domain/media.ts`) encodes spec §11.2 as a rule
with a test rather than a decision inside a screen:

| Clip | On RETAKE / CANCEL |
|---|---|
| Recorded by OnFlow | Working file deleted (`idempotent`, best effort, never blocks) |
| Imported from the library | **Never touched.** The reference is dropped and nothing else |

## Route params are not trusted

`parseReviewParams` rejects a missing uri, a non-positive duration or size, an
unknown media kind, or an unparseable timestamp, and the screen sends the
skater back to capture with `clip_unreadable` copy instead of rendering an
empty frame. `reviewHref` builds the query with `URLSearchParams`, so a path
containing `&` or `?` round-trips — covered by test.

## New

`FootagePlayer` — one `expo-video` player per mounted screen, looping, muted,
`contentFit="contain"`, no native controls, paused on unmount so audio never
outlives the screen. **Never mount it in a list**; lists use
`FootageThumbnail`. This is the first use of `expo-video`, which was an
installed-but-unused dependency.

`src/domain/media.ts` — `MediaKind`, deletion rule, size/length formatting,
param parsing and href building.

## Verification

`verify:phase0` green, 79 tests (6 new: deletion rule, formatting, param
parsing, href round-trip).

**Not verified on a device.** Video decode on a real file, the loop, first-frame
latency, audio session behaviour, and memory under repeated
retakes are all unseen. `expo-video` has never run in this app before, so this
slice carries the most device risk of any so far.
