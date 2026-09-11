# PERSONALIZATION-001 — Skater personalization, client

**Date:** 2026-09-05  
**Design:** "OnFlow V1 Skater Personalization Design" (approved 2026-09-05).  
**Status:** Client implemented against the designed contract. Backend lives in
this repo at `services/api` (`GET`/`PATCH /api/v1/account/skater-profile`).
Refresh `openapi/openapi.json` from a running API; do not hand-edit it.

## Owner decisions recorded here

| # | Question | Decision |
|---|---|---|
| P1 | Sequence against the mobile redesign | Redesign Phase 1 (tokens + primitives) first; onboarding built on those primitives; redesign Phase 2 resumes after |
| P2 | `under_13` age range: the design collects it but does not say what happens next, and this app uploads video of the user to an AI provider | **Age step paused.** Built everything except the age-range screen. `AGE_STEP_ENABLED = false`; `ageRange` is not required for client-side completion. **The backend must not require `age_range` at completion while this is paused.** Product/legal own the `under_13` decision |

## Contract the client is built against

```
GET   /api/v1/account/skater-profile      200 → SkaterProfile | null
PATCH /api/v1/account/skater-profile      200 → SkaterProfile
      body: all profile fields (snake_case) + optional complete_onboarding: true
```

`openapi/openapi.json` is a snapshot refreshed from a running API and is never
hand-edited. The skater-profile paths are in the snapshot as of 2026-09-08.
`src/api/schemas/runtime.ts` remains the runtime contract check.

Client interpretation of responses:

| Response | Client behavior |
|---|---|
| `200 null` | No profile yet → onboarding |
| `200 {…, onboarding_completed_at: null}` | Incomplete → onboarding, resuming at the persisted step |
| `200 {…, onboarding_completed_at: "…"}` | Complete → Home. Cached as the server-confirmed profile |
| `404` on GET | **Feature not deployed.** Status `unavailable` → Home. Never blocks. Retried on next foreground |
| `401` | Existing unauthorized handler → sign-out → purge |
| `422` on PATCH | `profile_invalid` copy. FastAPI's default `detail` is prose/array and `client.ts` ignores prose, so the client shows generic copy unless the backend returns a bare code |
| offline / 5xx / timeout | `profile_save_failed` (retryable). Draft retained. On load, cache personalizes if present; otherwise `unavailable` → Home |
| unsupported enum value | zod rejects → `contract_error`. Never substituted |

## What the backend must deliver

1. The two endpoints above, owner-scoped, with `GET` returning `200 null`
   (not 404) before a profile exists — the client reads 404 as "not deployed".
   **Done** in `services/api`.
2. Server-generated `onboarding_completed_at`, idempotent on repeat completion.
   **Done.**
3. **While P2 stands: completion must not require `age_range`.**
   **Done** (`REQUIRE_AGE_RANGE_FOR_COMPLETION = false`).
4. Bare-string error codes on 4xx (`detail: "profile_incomplete"`), so the
   client can map them; prose is ignored by design. **Done.**
5. Profile in account export; deleted in the account-deletion transaction.
   **Done.**
6. The live `GET /tricks` category vocabulary (or a `styles` field on
   `TrickOut`) so `CATEGORY_STYLE_MAP` can be populated. Until then trick
   ranking is the identity. **Not done.**
7. Optional: consider embedding `skater_profile` in `/account/me`, which
   already carries `consent` and `profile_image_url`; it would save one
   round-trip on cold start. The client handles either shape. **Not done.**

Completed-job analysis may include allowlisted profile fields (stance, styles,
primary, level) in prompt notes. City, home park, and brands are never sent.

## Design clarifications applied

- **Natural stance never preselects a trick modifier.** A goofy skater's normal
  stance is still called *Regular* when calling a trick. The trick picker shows
  an explainer line instead ("Regular here means your natural goofy stance").
- **No client-side AI-context helper.** The design says the backend loads the
  profile when preparing analysis; the client never transmits profile data
  with an upload, so a client sanitizer would imply a path that doesn't exist.
  The allowlist (stance, styles, primary, level; never city/park/brands) is
  the backend's to enforce.
- **Ranking never hides a trick.** `rankTricksForProfile` is a stable partition.

## Client files

| Layer | File |
|---|---|
| domain | `src/domain/skaterProfile.ts` — enums, normalization, completion, steps, entry routing, ranking, greeting |
| domain/mappers | `src/domain/mappers/skaterProfile.ts` |
| api | `src/api/schemas/runtime.ts` (+`skaterProfileSchema`), `src/api/endpoints.ts` (+`fetchSkaterProfile`, `patchSkaterProfile`) |
| store | `src/store/skaterProfileStore.ts`; `src/store/kv.ts` (+`kvUserKeys`); `src/store/authStore.ts` (sign-out purge) |
| routing | `app/_layout.tsx` — `resolveEntryRoute` guard; `(onboarding)` and `personalization` routes |
| screens | `app/(onboarding)/{_layout,greeting,stance,styles,experience,spots,brands,confirm}.tsx`; `app/personalization.tsx` |
| ui | `OptionList`, `TagInput`, `OnboardingFrame`; `src/ui/hooks/useOnboardingStep.ts`; `src/ui/copy/personalization.ts`; two new catalog error kinds |
| integration | `app/trick.tsx` (ranking + stance explainer), `app/(tabs)/index.tsx` (greeting kicker), `app/(tabs)/profile.tsx` (link) |
| tests | `src/domain/__tests__/skaterProfile.test.ts`, `src/domain/mappers/__tests__/skaterProfile.test.ts`, `src/api/schemas/__tests__/skaterProfile.test.ts`, `src/store/__tests__/skaterProfileStore.test.ts` |

## Acceptance criteria — client

| Criterion | Status |
|---|---|
| New users enter Greeting after auth | Routing guard; unit-tested decision |
| Existing incomplete users enter onboarding once | `200 null` → onboarding |
| Completed users enter Home | Unit-tested |
| Interrupted onboarding restores step + answers | Store test |
| Required-field validation blocks only completion | `completionErrors`; steps gate their own Continue |
| Natural stance never corrupts modifiers | Explainer only; no preselect |
| Multi-style + primary consistent in onboarding and editor | `toggleStyle` / `setPrimaryStyle` shared; tested |
| Edits persist; failed edits roll back | `saveProfile` restores previous; **rollback path not unit-tested** (needs a mocked transport) |
| Offline finalization retains draft, retries safely | Store test |
| Runtime schema rejects malformed responses | Schema test |
| Sign-out purges the previous user's data | `authStore.signOut` → `purge`; purge scoping tested |
| Dynamic Type, VoiceOver, keyboard, safe areas on device | **Not verified** — no device in this environment |

## Not done here

- `openapi.json` refresh — **done locally** from `http://127.0.0.1:8000/openapi.json`. Re-run after API schema changes: `npm run api:generate -- --from-url http://127.0.0.1:8000/openapi.json`.
- `GET /tricks` style vocabulary for ranking (`CATEGORY_STYLE_MAP`).
- Embedding the profile on `/account/me`.
- The age-range screen (P2).
- Device verification.
