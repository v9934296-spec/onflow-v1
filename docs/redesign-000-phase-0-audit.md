# REDESIGN-000 — Phase 0 audit and owner decisions

**Date:** 2026-09-05  
**Against:** the working tree at `41fee0d` (main), all checks green (33 tests).  
**Purpose:** record what the V1 mobile redesign found before changing anything,
and the owner decisions that scope it.

## Owner decisions

| # | Question | Decision |
|---|---|---|
| B1 | Brief specified `#54FF00` / `#FF0044`; spec locks `#00FFA6` / `#FF3B3B` | **`#54FF00` as primary accent. Keep `#FF3B3B`** for errors and recording. Locked decision 14 (red never decorative) stands |
| B2 | Brief wanted four outcomes; backend enum is `landed \| missed` (OpenAPI + zod + domain + test) | **Two outcomes, skate wording.** No contract change. Four-outcome backend change is a separate ticket |
| B3 | Brief wanted a terrain field; none exists client or server | **No terrain.** The stance-sync gap (stance is collected, never sent) is ticketed separately |

## Structural findings

1. **There is no Active Session screen.** Trick confirm `replace()`s straight
   to Capture. `app/(tabs)/flow.tsx` is a 31-line stub unreachable during the
   loop. Session time, attempt number and what's been landed are never shown.
2. **The trick name is the smallest important thing on every screen.** Bebas
   is used only for screen titles; `KICKFLIP` renders in 17pt Sora while a
   score renders in 42pt Bebas.
3. **Footage is never shown.** `videoPlaybackUrl` / `thumbnailUrl` are mapped
   and dropped. `expo-video` is installed and unused.
4. **No review step.** Recording resolves straight into upload; a bad clip
   cannot be discarded. Import has no preview or confirm.
5. **Recap and History data already exist server-side and are unused:**
   `GET /me/sessions` (tricks attempted, counts, preview thumbnail) and
   `GET /sessions/{id}/recap` (duration, landed counts, per-trick breakdown,
   clips with thumbnails). Nothing needs inventing.
6. Tap counts already meet targets: new user 4, returning user 2.

## Dead or misleading controls

| Control | Finding |
|---|---|
| Paywall → Restore purchases | `onPress={() => undefined}`. `storeFailed` hardcoded. `react-native-purchases` never imported |
| History rows | Not tappable. Cannot reopen a result |
| Home → Latest clip thumbnail | `stillFrameUri()` only accepts image extensions; outbox holds video URIs; always renders nothing |
| Home → recent TrickCard | Pushes `/trick` without preselecting the tapped trick |
| Profile | No export, deletion, legal, plan, statistics (spec §7.10). `deleteAccount` / `exportAccount` exist and are never called |
| Flow → End session | No confirm, no recap. `pendingEnd` is written on failure and never re-synced |
| Trick picker → Popular | `rememberRecentId` de-duplicates, so `popularFromRecent` counts are always 1; the section is a copy of Recent |
| `fetchSessionAttempts`, `syncBilling`, `Stepper` | Implemented, never used |

## Integration defects to fix during the redesign

- `reportOutcomeAndMaybeContinue()` discards the `syncAttempts` result. Offline
  or on 5xx the attempt is silently lost. Needs a persisted pending-attempt queue.
- Stance and direction are collected and displayed but never sent
  (`SessionAttemptIn` has no field; `client_hint_trick_id` on initiate-upload
  is never populated).
- Upload progress is binary (0% → 100%) because `FileSystem.uploadAsync` has no
  progress callback. Honest, but the bar implies granularity.
- The outbox persists to MMKV JSON, not SQLite (spec §11.3). Harmless; recorded.

## Template patterns removed by the redesign

Rounded hero card with decorative SVG (`ScreenHero`) · card stack Home ·
cards inside cards · six screens opening with the identical header · neon
drop-shadow glow · pill chips everywhere · 24pt padding on all four sides of
every screen · generic tab glyphs · Result as an undifferentiated stack.

## What stays

`resolveCenterAction` + `CenterActionButton` · `RecordControl` · `CameraScrims`
· `StageList` · `UploadProgress` · `FeedbackRow` · `ReadinessBanner` ·
`OutcomeSelector` semantics (glyph + label + color) · `ErrorPanel` /
`EmptyState` · the full `errors.ts` copy catalog · the token file structure ·
the lint-enforced layer boundaries · every truth rule and every test.

## Implementation order

| Phase | Work | Gate |
|---|---|---|
| 1 | Tokens + primitives (REDESIGN-001) | Full `verify:phase0` |
| — | Skater personalization onboarding on the new primitives (owner sequencing decision 2026-09-05) | Full suite + new tests |
| 2 | Canonical session flow: Active Session → trick picker → capture (+attempt number) → **review step** → import preview → analyzing → result (+video) → outcome → next attempt. Fix attempt-sync loss, fix Popular | Full suite, new tests |
| 3 | Home | Full suite |
| 4 | History + Recap on `/me/sessions` and `/sessions/{id}/recap` | Full suite + `api:check` |
| 5 | Profile / Paywall — wire export, deletion, legal; no dead Restore button | Full suite |
| 6 | Polish: safe areas, Dynamic Type 200%, reduced motion, VoiceOver, haptics, performance | Full `verify:phase0` |

## Standing risks

- **No device in the loop.** Every visual claim is code-level.
- Layer boundary: new server data goes `endpoints → zod → mapper → store →
  screen`; `app/**` and `src/ui/**` cannot import `@/api`.
- `centerActionLabel.test.ts` pins center-action strings; it is updated, not
  deleted, if wording changes.
