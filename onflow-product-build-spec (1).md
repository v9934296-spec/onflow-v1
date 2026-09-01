# OnFlow — Product & Build Specification

**Product:** OnFlow
**Scope:** Launch release
**Status:** **Approved** 2026-09-01 by owner (Vincent). Phase 1 feature implementation may start. §18 gate item 7 is **accepted unmeasured** — 6 Mbps remains a candidate, not a locked launch number. Q&A 11 stays OPEN as a measurement debt, not a Phase 0 blocker.
**Owner:** Vincent (Toner)
**Reference client:** `onflow-lite` (Expo 53 / RN 0.79.6 / React 19 / expo-router 5)
**Backend:** `services/api` (FastAPI), unchanged except §9
**Target platform:** iOS first
**Supersedes:** all prior build-spec drafts

Release stages are named — **Launch**, **Next release**, **Post-launch** — not numbered.

---

## 1. Product objective

> **OnFlow helps a skater film an attempt, receive an honest evidence-based read, record what actually happened, and quickly try again.**

**User problem.** A skater filming their own attempts has no fast way to know what went wrong, and no record of what they actually landed. Existing tools either overclaim (automatic trick detection that guesses) or underdeliver (a camera roll full of unlabeled clips).

**Target user.** A skater practicing a specific trick, filming themselves or being filmed by a friend, outdoors, in sunlight, on cellular, one hand on the phone and the other holding a board.

**Value proposition.** An honest read on a single attempt, in the time it takes to walk back to the top of the ramp.

### Positioning

- The skater calls the trick. OnFlow reviews the attempt against that called trick.
- OnFlow does not claim to identify arbitrary tricks from video.
- Manual skater outcomes are authoritative. Analysis supports the skater; it never overrules them.
- OnFlow is not a social network at launch.
- OnFlow is not an analytics dashboard.
- OnFlow is not a replacement for a coach.

### The long game

> **Every saved attempt contributes to a durable skate history. Analysis helps with today's attempt; history creates value across years of skating.**

This is a principle, not scope. It adds nothing to Launch and authorizes no feature. What it does is settle a class of decisions that are cheap now and expensive to retrofit:

| Decision | Consequence of getting it wrong |
|---|---|
| Clip deletion | A hard delete that also removes the attempt destroys history to reclaim storage. Clips and attempts have separate lifecycles for this reason (§7.8) |
| Trick canonicalization | If "nollie heel" and "Nollie Heelflip" resolve differently, a decade of history fragments into unqueryable dust. The server registry is the only source (§7.3) |
| Timestamps | `logged_at` is when the skater skated, not when the row synced. An offline batch must not collapse a week of sessions into one afternoon |
| Provider and result versioning | Without provider metadata on every result, no future calibration can ever reconcile old scores (§11.4) |
| Identity | Account continuity across auth providers and reinstalls is what makes a long record possible at all |
| Export | A history the skater cannot take with them is not their record |

None of these require Video Parts, feeds, or discovery to exist. They require the launch build not to foreclose them.

---

## 2. Locked decisions

| # | Decision | Resolution | Reason | Revisit when |
|---|---|---|---|---|
| 1 | Client | New Expo client, new repo | Presentation rebuild too large to do in place safely | — |
| 2 | Backend | Existing `services/api`, unchanged except §9 | Hardened, tested, and not the problem | — |
| 3 | Reference client | `onflow-lite` stays live until §14 parity passes | It is the executable spec for hardened behavior | Parity green |
| 4 | Platform | iOS first | Existing build pipeline is EAS iOS | Android demand |
| 5 | Auth | **Apple only at launch** | `/auth/google` exists server-side and `signInWithGoogle` exists in `src/api/authApi.ts`, but there is **no Google sign-in SDK in `package.json`** and no Google plugin in `app.json` — the client can call the endpoint but cannot obtain an `id_token`. Google is backend inheritance, not a shipped feature | Android, or a deliberate decision to add the SDK |
| 6 | Session mode | Free skate by default, no mode screen | Removes two taps from the core loop | Battle returns |
| 7 | Trick Battle | Post-launch | Not needed to validate the loop | Loop validated |
| 8 | Feed / Discovery | Removed from the shell entirely | Not real enough to ship honestly | Post-launch |
| 9 | Share | Post-launch | Only ships when raw clip sharing is proven reliable | Sharing verified |
| 10 | Progression chart | Next release; launch ships a raw attempt list | Not enough data to validate a trend | Data exists |
| 11 | Upload | Retryable single-shot presigned PUT | Matches the existing two-step endpoint pair | Cellular field data |
| 12 | Clip ceiling | ≤ 30s, ≤ 100MB, `video/mp4` or `video/quicktime` | **Already enforced server-side** | Engine changes |
| 13 | Capture | In-app camera (`expo-camera`), tap to start / tap to stop | Reference client uses `expo-image-picker` only | — |
| 14 | Color | Semantic red for errors and destructive only; separate media red for recording | Truth rules; camera convention | — |
| 15 | Feedback voice | One neutral voice | Two voices split testing before either is validated | Post-launch |
| 16 | Background analysis | Guaranteed foreground reconciliation; notification is an enhancement | Permission cannot be assumed | — |
| 17 | Quota on failure | Must not consume quota unless usable analysis returns | Fairness | — |
| 18 | Display font | **Bebas Neue (display) + Sora (body)**; JetBrains Mono retained for machine-truth only | From the design comp; both OFL, both on `@expo-google-fonts` | — |
| 19 | Minimum iOS | **15.1** — the Expo 53 default, since `app.json` sets no explicit target | Matches the reference client's effective floor, so no existing user is stranded. Confirm against `expo-camera` and `expo-video` minimums in Phase 0 and raise only if a dependency forces it | A dependency requires higher |

---

## 3. Scope

### Included at launch

Authentication (Apple) · Home · session creation · active-session recovery · trick selection with stance and direction modifiers · in-app camera capture · library selection · compression · upload · analysis polling and recovery · result and feedback · manual outcome reporting · save confirmation · History · Profile and settings · Paywall · purchase restoration · subscription management · data export · account deletion.

### Excluded

| Item | Classification |
|---|---|
| Progression chart, multipart/background upload | Next release |
| Trick Battle, Share, named coach voices, deferred server-side deletion | Post-launch |
| Public feed, following, reactions, comments, public profiles, discovery, video parts, collaborative editing, community rankings, complex P.T.E. dashboards, advanced coaching plans | Indefinitely excluded from this scope |

The reference client has live routes for several of these (`app/feed.tsx`, `app/pte.tsx`, `app/notifications.tsx`). **They are not ported.** Their absence is intentional and recorded in §14.2 so parity testing cannot drag them back.

---

## 4. Core flow

```
Home
→ Start Session                    (free skate, created immediately)
→ Choose Trick                     (preserved across attempts)
→ Capture Clip
→ Upload                           (initiate-upload → PUT → complete-upload)
→ Analyze                          (poll job)
→ View Result
→ Report Outcome                   (landed | missed)
→ Save Attempt
→ Another Clip  |  End Session
→ History
```

### Alternate paths

| Path | Behavior |
|---|---|
| Returning user, preserved trick | Home → center action reads `FILM` → Capture. Recording in ≤ 3 taps |
| Active-session recovery | Session restored on foreground; center action reflects real state |
| Offline | Capture allowed; clip queues in the outbox; visible in History as `QUEUED` |
| Quota exhausted | Detected at `complete-upload`. Footage retained locally, paywall offered |
| Insufficient evidence | Routes to Result with an explainer. Not an error |
| Upload failure | Retryable or permanent, classified; footage never discarded |
| Analysis failure | Retry / Film Again / Home. Clip retained |
| App termination | Outbox recovers on next foreground |
| Session end | Local `pending_end`, synced on reconnect (§9 change 6) |

---

## 5. Success criteria

| # | Criterion | Acceptance test |
|---|---|---|
| 1 | New user understands the product from Home | 5-user comprehension test, unprompted, no taps |
| 2 | First session reaches recording | ≤ 5 taps, excluding system permission prompts |
| 3 | Returning user with preserved trick reaches recording | ≤ 3 taps from cold open |
| 4 | Modified tricks selectable unassisted | 0 wrong-trick selections in test sessions |
| 5 | Cellular upload succeeds | ≥ 95% |
| 6 | No fabricated analysis progress | No determinate percentage outside observed upload bytes |
| 7 | Feedback readable outdoors | Legible at arm's length in direct sun, on device |
| 8 | One actionable improvement identified | Users state "what to work on" unprompted |
| 9 | Manual outcome recorded | ≥ 80% of completed analyses |
| 10 | Saved attempt appears in History | Deterministic; E2E covered |
| 11 | Another Clip preserves session and trick | Verified by test 33 (§13) |
| 12 | Beta users return | ≥ 40% start a second session within 7 days |

---

## 6. Navigation

Bottom tabs: **Home · Flow · [context action] · History · Profile**

| State | Label | Destination |
|---|---|---|
| No active session | `START` | Create free-skate session → trick selection |
| Session, no trick | `CHOOSE TRICK` | Trick selection |
| Session + trick | `FILM` | Capture, trick preserved |
| Recoverable outbox draft | `RESUME` | Resume / Discard dialog |
| Hydrating | disabled, spinner | — |

Rules: the center action is visually dominant in every state · bottom nav hidden on capture, analyzing, and result · tab state, scroll position, and filters persist · unauthenticated users redirect to sign-in · the paywall presents modally · Feed and Discovery have no route.

---

## 7. Screens

Every screen implements: loading, empty, partial-data, offline, error, and — where applicable — permission and entitlement states.

### 7.1 Authentication
**Sign in with Apple only.** `POST /auth/google` remains available server-side and is not called by the launch client (§2 decision 5). Cancellation returns silently. Revoked credentials route to sign-in without destroying queued footage. Session expiry refreshes or re-prompts. Sign-out follows §12.

### 7.2 Home
First-run hero uses brand footage; returning hero uses the user's most recent clip. Start Session; most recent session; recent tricks; small progression summary. Maximum four cards. Offline renders cached content with a mono `OFFLINE — QUEUED n` strip. An active session surfaces as Continue.

### 7.3 Trick selection
Search, categories, Recent, Popular, stance and direction modifier chips. Canonical trick identity comes from the server registry. Max 12 results before scroll. Selection is unmistakable (outline + tonal fill shift). One Confirm Trick action. No-results offers nearest matches. Thumbnails only where a complete real asset set exists; typographic tiles otherwise.

### 7.4 Capture
Camera fills the frame. Overlay: selected trick on scrim, elapsed time, max duration, record control, library picker, close. **Tap to start, tap to stop** — no hold-to-record path exists. Auto-stop at the 30s ceiling with haptic feedback. Record ring uses media red (§10.1), which is not an error state. Permission states: not requested, granted, denied, permanently denied (Settings deep link), library-only fallback. Low storage and compression-pressure states are explicit. Imported originals are never modified or deleted (§11.2). Overlay caps visual Dynamic Type at 130%; accessible names stay unclamped. No filters, resolution pickers, or exposure controls.

### 7.5 Upload

**Compression contract** — required before Capture is done. **Not device-measured.** OF-006 was owner-closed 2026-09-01 without PUT-file evidence. These are launch *targets*, not locked numbers. Q&A 11 remains OPEN. There is still no compress-before-initiate stage in the client:

| Parameter | Launch value |
|---|---|
| Container / codec | MP4 / H.264 (`video/mp4`) |
| Resolution ceiling | 1080p long edge; never upscale |
| Bitrate target | Candidate 6 Mbps. OF-006 closed 2026-09-01 without device measurement; see `docs/exp-001-compression.md` |
| Frame rate | Preserve source up to 60fps; never interpolate |
| Orientation | Rotation metadata preserved; never re-encode into a wrong orientation |
| Audio | Preserved — the engine may use it; confirm in Phase 0 |
| Metadata | Location stripped before upload |
| Temp storage | App-private; derivative deleted after successful `complete-upload` |
| Failure fallback | If compression fails, offer upload of the original when it already satisfies the ceilings; otherwise fail with a re-film action. **Never silently upload something the server will reject** |
| 30s clip still over 100MB | Recompress at a lower bitrate once, then reject with plain-language copy |

Compress before `initiate-upload`. Progress is computed only from observed bytes. Retry on foreground and network regain with backoff. Expired presigned URLs are re-requested. Outbox persists before the first byte is sent. Quota is charged at `complete-upload`, so an abandoned upload never burns a slot. Foreground only at launch.

### 7.6 Analyzing

| Phase shown | Source | Determinate? |
|---|---|---|
| `UPLOADING` | Client-observed bytes | Yes |
| `QUEUED` | `status === "pending"` | No |
| `REVIEWING CLIP` | `status === "processing"` | No |
| Result | `status === "completed"` | — |
| Failure | `status === "failed"` + `failure_reason` | — |

Polling: 2s for 30s, then 5s, capped at 5 minutes. Only transient failures retry — network, 5xx, 429. Any other 4xx terminates polling and surfaces the error. Slow copy at 45s. Leaving does not cancel the job; copy promises only what is guaranteed: *"You can keep filming — this'll be in your History when it's done."* Every terminal state offers one recovery action plus a safe exit.

### 7.7 Result
Order: clip playing prominently · called trick · evidence sufficiency · score (only when present) · feedback components · outcome selector · optional attempts, spot, notes.

Score rules and evidence rules are §11.4 and §11.5 respectively. Save to History is primary; Another Clip is the fastest continuation and saves first when an outcome is reported (§7.8). Unsaved outcomes are protected by one confirm on back-navigation. Partial and insufficient evidence, video playback failure, and contract errors all have defined states.

### 7.8 Save and continuation

| Action | Behavior |
|---|---|
| Save to History | Persists the attempt |
| Another Clip, outcome reported | Saves, then opens Capture |
| Another Clip, no outcome | Opens Capture. Clip retained; no attempt created |
| Back / Home with unsaved outcome | Confirm: Save and leave / Discard outcome |

An attempt is never auto-created without a reported outcome — that would corrupt the authoritative manual record.

Confirmation screen shows saved state, trick, outcome, attempt number, session duration. Three facts maximum.

### 7.9 History
Views: Tricks · Sessions · Clips. Newest first. Queued, uploading, analyzing, completed, and failed items are all visible with honest state and no placeholder values. Missing thumbnails render as nothing, not a fake frame. Reopening a result or a session recap is one tap. Cursor pagination (`next_cursor` already exists). Offline reads from cache. Unread results are marked (§9 change 5). Progression is a raw attempt list — no trend claims. Score display must respect §11.4 comparability rules.

### 7.10 Profile and settings
Identity, plan, three core statistics. Links: session history · notifications · subscription · data export · legal pages · account deletion · sign out. Destructive actions sit in a visually separated block; deletion requires typed confirmation.

### 7.11 Paywall
Free-tier state with remaining analyses. Packages resolved live from RevenueCat (§8.6). Purchase, Restore, Customer Center, Terms, Privacy, renewal disclosure. Store-load failure shows a retry state — **never a hardcoded price**. Store/backend entitlement disagreement resolves per §12.3.

---

## 8. Contract snapshot

Verified by reading `services/api` and `onflow-lite` at the time of writing. Anything not listed here is `UNVERIFIED` and must be confirmed in Phase 0 before dependent work starts.

### 8.1 Endpoints

| Method | Path |
|---|---|
| POST | `/api/v1/auth/apple` · `/api/v1/auth/google` · `/api/v1/auth/session` |
| GET/POST | `/api/v1/auth/clip-retention`, `/api/v1/auth/clip-retention-consent` |
| GET | `/api/v1/account/me` · `/api/v1/account/quota` · `/api/v1/account/export` |
| PUT | `/api/v1/account/profile-image` |
| DELETE | `/api/v1/account` |
| POST | `/api/v1/sessions` |
| GET/PATCH/DELETE | `/api/v1/sessions/{session_id}` |
| GET | `/api/v1/sessions/{session_id}/recap` · `/api/v1/sessions/{session_id}/attempts` · `/api/v1/me/sessions` |
| GET | `/api/v1/tricks` |
| POST | `/api/v1/clips/initiate-upload` |
| POST | `/api/v1/clips/{clip_id}/complete-upload` |
| GET | `/api/v1/clips/jobs` · `/api/v1/clips/jobs/{job_id}` |
| POST | `/api/v1/session-attempts/sync` |
| GET | `/api/v1/stats/tricks` · `/api/v1/stats/tricks/{trick_name}` · `/api/v1/stats/tricks/{trick_name}/progression` · `/api/v1/stats/sessions/latest` · `/api/v1/stats/sessions/{session_id}` · `/api/v1/stats/progression/overview` · `/api/v1/stats/progression/whats-next` · `/api/v1/stats/milestones` |
| GET | `/api/v1/progression/timeline` |
| POST | `/api/v1/billing/sync` · `/api/v1/webhooks/revenuecat` |
| GET | `/health`, `/health/deep` |

Not used at launch: `/api/v1/feed*`, `/api/v1/lines*`, `/api/v1/admin/*`, session participants.

### 8.2 Upload — two-step, server-owned clip ID

```
POST /api/v1/clips/initiate-upload   → 201 { clip_id, upload_url, upload_method: "PUT",
                                             upload_expires_at, storage_key }
PUT  <upload_url>                    → R2
POST /api/v1/clips/{clip_id}/complete-upload → ClipResponse + estimated_analysis_completion_at
```

Request constraints, already enforced:

| Field | Constraint |
|---|---|
| `duration_seconds` | `> 0`, `<= 30` |
| `size_bytes` | `> 0`, `<= 100MB` |
| `content_type` | `video/mp4` or `video/quicktime` |
| `session_id` | Optional. 404 if missing/deleted, 403 if another user's. Ended sessions still accept uploads |
| `client_hint_trick_id` | Optional |

**`clip_id` is generated by the server.** Client-side generation is not supported and is not requested — the outbox anchors on a local ID until `initiate-upload` returns, then stores the server `clip_id`. Idempotency is handled per §11.6.

Quota is charged at `complete-upload`, not `initiate-upload`. Abandoned uploads burn nothing.

**There are three distinct `429` sources on this flow, with three different response shapes.** The client must branch on status and `Retry-After`, never on prose.

| Source | Where | Body |
|---|---|---|
| SlowAPI decorators (`clip_abuse_limit_per_hour/day`) | `initiate-upload`, `complete-upload` | SlowAPI prose (`"Rate limit exceeded: ..."`) + `Retry-After` derived from the limit string |
| `check_analysis_quota` | `initiate-upload` | `detail: "hourly_analysis_cap_reached"` / `"daily_analysis_cap_reached"` |
| Concurrency limit | `complete-upload` | `detail: "Too many clips are still processing. Finish or wait before uploading another."` |

**Client rule at launch:** treat any `429` as rate-limited, honor `Retry-After`, show generic copy. **Do not parse English error strings.** Structured rate-limit codes are §9 change 10.

### 8.3 Analysis job

```ts
status: "pending" | "processing" | "completed" | "failed"
```

`GET /clips/jobs/{job_id}` returns one of four response shapes; `failed` carries `failure_reason` (string, defaults `"unknown"`). A completed job missing `result_json` returns 500 — the client must treat that as a contract error, not an empty result.

`ClipResultPayload` fields relevant to Result:

| Field | Type |
|---|---|
| `review_readiness` | `"usable" \| "limited" \| "insufficient"` |
| `landed` | `"yes" \| "no" \| "unclear" \| null` |
| `land_score` | `float 0.0–10.0 \| null` |
| `review_summary`, `clip_label` | string |
| `observations`, `uncertainty_notes`, `processing_notes` | `string[]` |
| `skate_clip_review` | strengths / improvement_areas / actionable_cues |
| `coaching` | body_position, foot_placement, timing, board_control, commitment, balance, style_notes, improvement_drill |
| `quality_signals` | duration, frames_sampled, motion_detected, video_readable, fps, brightness, laplacian variance, `mechanics_dimensions[]` |
| `primary_issue_key`, `primary_issue_label`, `best_cue` | string \| null |
| `video_playback_url`, `thumbnail_url` | string \| null |
| `schema_version` | int, ≥ 1 |

`MechanicsDimensionPayload` carries `name`, `score` (0–10, nullable), `assessment`, `evidence` (free-text string).

**`estimated_analysis_completion_at` is a static `now + 45s`, not a queue forecast.** It is not displayed anywhere. Showing it would be a fabricated progress claim under truth rule 4.

**`complete-upload` is retry-tolerant but not uniformly idempotent.** Verified behavior:

| Clip / job state on retry | Response |
|---|---|
| `upload_status == "analyzed"` | `409 "Clip upload already completed."` |
| `upload_status == "analyzing"` | Returns current clip state (safe replay) |
| Existing job `completed` | `409` |
| Existing job `pending`/`processing` | Returns current clip state as in-flight |
| Existing job `failed` | Job reset to `pending` and re-enqueued, **quota not re-charged** |
| Concurrent insert loses the race (`JobAlreadyExists`) | Treated as in-flight |
| Enqueue throws | Quota released, job and clip marked `failed`, `503` |

**`job_id == clip_id`.** After any ambiguous `complete-upload`, the client polls `GET /clips/jobs/{clip_id}` to reconcile rather than treating the ambiguity as an upload failure. **A `409` is a reconciliation signal, not an error to show the skater.**

Other verified `complete-upload` failures: `404` object missing at storage key · `422` empty, unreadable, or failing the `looks_like_video` magic-byte check · `413` over the size ceiling. Rejected objects are deleted server-side.

### 8.4 Scores — 0 to 10

| Field | Type | Range |
|---|---|---|
| `land_score` | float | 0.0–10.0 |
| `NormalizedReviewPayload.score` | int | 0–10 |
| `MechanicsDimensionPayload.score` | float | 0.0–10.0 |
| `pte_rating` / `pte_score` | int \| null | **Closed for launch (2026-09-01).** OpenAPI: integer, no min/max. Out of launch scope. Do not display. |
| `best_pte_score`, `average_pte_score` | number \| null | **Closed for launch (2026-09-01).** OpenAPI: number, no min/max. Out of launch scope. Do not display. |

`null` already means abstention in every case. **The scale is 0–10, not 0–100.** Display precision is **whole numbers 0–10** (DOC-001). `land_score` floats are rounded to nearest int at the mapper. Values outside 0–10 are rejected, never clamped. `insufficient` never shows a score. `limited` may show a score only when the payload has one.

`pte_rating` / `pte_score` and session averages are **out of launch scope** (PTE / Battle excluded). Do not display them.

**Comparability warning.** Analysis provider is tier-routed: `pro` → Twelve Labs Pegasus, everything else → Gemini, with a `force_gemini_for_pro` rollback flag. A user's scores can therefore come from two different engines across their own history. History must not compare scores across providers without confirming they are calibrated to the same scale. This is open question Q1.

### 8.5 Attempts — client IDs already supported

```
POST /api/v1/session-attempts/sync
  { attempts: [{ id, session_id, trick_id, canonical_name,
                 outcome: "landed" | "missed", logged_at }] }   // ≤ 100 per batch
  → { accepted: string[], rejected: [{ id, reason }] }
```

Client-supplied `id` (≤ 80 chars) plus batch sync means **offline attempt reporting is already solved server-side.** The outbox uses this endpoint directly.

**`outcome` has two values, not three.** The reference client's analysis carries `landed: "yes"|"no"|"unclear"`, but a *reported* attempt is `landed` or `missed` only. **Closed (§18): the outcome selector ships with two options.** §9 change 7 is not taken.

**Sync is immutable replay (BE-001).** Identical payload for an existing id is accepted with no write. A changed payload is rejected with `session_immutable` / `outcome_immutable` / `attempt_immutable`. Deleted rows stay deleted (`attempt_deleted`). `_to_out` omits unknown outcomes instead of coercing them to `"missed"`.

### 8.6 Billing

| Item | Value |
|---|---|
| Entitlement identifier | `"onflow-lite Pro"` (exact) |
| Package identifiers | `lifetime`, `yearly`, `monthly`, with `$rc_*` aliases accepted |
| Tiers | `free`, `trial`, `free_expired`, `pro`, `session_reup` |
| Unlimited analyses | `trial`, `pro`, `session_reup` |
| Upload gate | `tier_has_feature(tier, "upload_clip")`; 403 with trial-ended copy |
| Sync | `POST /billing/sync`, `POST /webhooks/revenuecat` |

**Closed (§18): the launch client ships under the existing bundle `com.onflow.lite` with the entitlement string `"onflow-lite Pro"` unchanged.** Products are `com.onflow.lite.lifetime` / `.yearly` / `.monthly` and are bound to that bundle. A new bundle ID means a new App Store app — subscriptions do not transfer and every paying user loses Pro. Display name may change freely.

### 8.7 Reference client stack

Expo ~53, RN 0.79.6, React 19, expo-router ~5, TypeScript 5.8, vitest. Fonts: Rubik + JetBrains Mono. Auth via `expo-apple-authentication` + `expo-secure-store`. Storage via `@react-native-async-storage/async-storage`. Media via **`expo-image-picker` only — there is no in-app camera today.** Billing via `react-native-purchases` 10.4.

The launch client adds: `expo-camera`, `expo-video`, `expo-sqlite`, a state library, a query library, `zod`, and a display typeface. Each addition is justified in §15 and is a real cost, not a free upgrade.

---

## 9. Backend change inventory

Every server-side dependency in this document. Nothing is buried in a lifecycle description or a test case. Each row needs a ticket covering database impact, request/response change, backward compatibility, deployment order, OpenAPI update, fixture update, minimum client version, rollback, and staging verification.

| # | Change | Why | Blocks | Status |
|---|---|---|---|---|
| 1 | Per-component evidence state | Richer per-row labeling | **Nothing — next release.** Option (b) is chosen | **New concept.** No per-component evidence exists today — only `review_readiness`, `uncertainty_notes`, and a free-text `evidence` string on mechanics dimensions |
| 2 | `unavailable_reason` per component | Abstention renders as content per row | **Nothing — next release.** Depends on 1 | — |
| 3 | Structured `failure_reason` codes | Plain-language recovery copy | Analyzing | Today it is a free-text string |
| 4 | Idempotency on `complete-upload` | Duplicate-safe retries | Nothing — client reconciles | **Verified (§8.3).** Retry-tolerant but not uniformly idempotent. Launch works via job polling on `409`; a true replay contract is next-release |
| 5 | `viewed_at` on job/analysis | Cross-device unread markers | History | Local fallback exists |
| 6 | **Session-end conflict handling** | `PATCH` currently accepts any `ended_at` and overwrites unconditionally (§11.9) | Capture | Verified: late timestamps are accepted; there is no conflict detection. Needs: reject or flag an `ended_at` when one already exists, or define explicit last-write semantics and return the winning value |
| 7 | Third attempt outcome (`unsure`) | Only if Q2 resolves that way | Result | Optional |
| 8 | Score scale documentation + display precision | Q1 | Result, History | Documentation, possibly no code |
| 9 | Provider/profile version on the result | Cross-engine comparability (§8.4) | History | `NormalizedReviewPayload.model` exists (`gemini`); Pegasus path needs the equivalent |
| 10 | Structured rate-limit codes with `retry_after_seconds` | Client must not parse prose (§8.2) | Nothing — generic copy works | Three inconsistent 429 shapes today |
| 11 | **Attempt-sync immutability** | Prevents silent mutation of the authoritative record (§8.5) | Result | Required: same ID + identical payload → accepted replay; same ID + changed payload → rejected with reason; an attempt may never move session; unique `(user_id, attempt_id)`; remove the `"missed"` coercion in `_to_out` |
| 12 | **Quota release on provider failure** | §2 decision 17 is not current behavior | Result | Today quota is released **only** when `enqueue_clip_job` throws. A job that reaches Gemini or Pegasus and then fails keeps the charge. Needs: reserve at accepted submission, finalize on usable completion, release on provider or infrastructure failure, explicit policy for unreadable footage, all idempotent |
| 13 | **Reject clips captured after `ended_at`** | Ended sessions currently accept uploads, contradicting `pending_end` (§11.8) | Capture | Permit delayed upload only when the client capture timestamp predates `ended_at`; define a reconciliation window |

**No change in this table blocks Launch except 11, 12, 13, and 6.** Choosing option (b) means Result builds against the contract as it exists today. Changes 1–3, 5, 7–10 are next release or optional.

Changes 11 and 12 are correctness bugs, not features. Change 12 in particular means **decision 17 in §2 describes the desired backend, not the current one** — a skater whose analysis fails inside the provider is charged today.

**Change 1 was the largest, and the decision is made: option (b).** For the record, the two options were:

- **(a) Build it.** Add per-component evidence to the analysis schema. Full truth model, larger backend change, Result blocked until it deploys.
- **(b) Map honestly onto what exists.** Use `review_readiness` for overall sufficiency, render `uncertainty_notes` and `processing_notes` as the explicit uncertainty surface, use `quality_signals.video_readable` / `motion_detected` as evidence gates, and show mechanics dimensions with their existing free-text `evidence` field. No per-component tags at launch.

Option (b) ships sooner and violates nothing — it labels less, which is the correct failure direction. **Launch uses (b); (a) is next release.**

**Option (b) UI rules, binding:**

- Show exactly **one analysis-level banner**: Usable · Limited · Insufficient, mapped from `review_readiness`.
- **Do not render `EvidenceTag` on any individual row.** The component does not appear in the launch build at all — the backend supplies no per-component evidence, so any tag would be client-assigned (truth rule 2).
- Render server-provided `uncertainty_notes` and `processing_notes` verbatim as an explicit uncertainty block.
- Omit unsupported feedback fields rather than showing them empty.
- **Never infer evidence from whether a string is present.** A populated `assessment` is not proof of detection.
- Never label an individual observation "detected."
- Mechanics dimensions render with their server-provided free-text `evidence` string as prose, not as a status tag.

---

## 10. Design system

### 10.1 Color

| Token | Value | Meaning |
|---|---|---|
| `bg` | `#080808` | Background |
| `surface` / `surfaceAlt` | `#1A1A1A` / `#222222` | Card, raised card |
| `hairline` / `hairlineHi` | `#2A2A2A` / `#3A3A3A` | Borders, active borders |
| `textPrimary` / `textSecondary` / `textTertiary` | `#F5F5F5` / `#9A9A9A` / `#6A6A6A` | Text |
| `neon` | `#00FFA6` | Primary action, positive state, landed |
| `amber` | `#FFB020` | Warning, uncertain state — **DOC-001 closed.** Carries `limited` readiness. Color is never the only indicator; the banner always includes the word Limited. |
| `red` | `#FF3B3B` | **Errors and destructive actions only** |
| `alum` | `#9EA1A6` | Outlines, technical labels, missed outcome |
| `media.recording` | `#FF3B3B` | **Camera convention. Not an error. Separate namespace** |
| `scrimTop` / `scrimBottom` | `rgba(10,10,11,0.72)` / `0.88` | Over video |

Rules: volt means action or positive state · semantic red never decorates · recording red stays in media controls · a missed trick is not an application error · tonal elevation for hierarchy, hairlines for grouping and affordance · glow only on the raised center action and the capture control · **color is never the only indicator**.

### 10.2 Typography

**Decided from the design comp: Bebas Neue Bold for display, Sora for body (SemiBold / Regular).** Both OFL and both available via `@expo-google-fonts`. This replaces Rubik + JetBrains Mono from the reference client — a font swap, not an addition.

Two consequences of Bebas Neue that must be designed around, not discovered later:

- **It has no lowercase.** Every display string renders uppercase regardless of input, so it is headings only — never body, never a feedback verdict, never an error message.
- **It has no true bold weight and a very tall x-height with tight default tracking.** Long trick names ("Nollie Backside Heelflip") need a tested line length before Trick Select is built.

A monospaced face is still needed for machine-truth (timestamps, versions, state tags). JetBrains Mono is already bundled and can stay for that role only.

Scale: hero 42/44 · h1 30/33 · h2 22/26 · bodyLg 17/25 · body 15/22 · bodySm 13/19 · label 13/16 · mono 11/14.

Rules: minimum body 15pt for outdoor legibility · body text never uppercase · mono reserved for machine-truth (evidence tags, timestamps, versions) and never for prose · Dynamic Type to 200% everywhere except the Capture overlay, capped at 130% with unclamped accessible names.

### 10.3 Spacing, layout, motion

Spacing `4 / 8 / 12 / 16 / 24 / 32 / 48`. Radii `6 / 10 / 14 / pill`. Touch targets: minimum 48pt, primary button 56, outcome selector 64, capture control 76. Safe areas respected on every screen.

Motion: press 90ms at 0.97 scale · enter 220ms · exit 160ms · ambient 1800ms. Every animated component reads reduced-motion and degrades to opacity or none. Haptics on record start/stop and outcome selection. No decorative motion.

### 10.4 Media

16:9 default with the clip letterboxed rather than cropped · poster frames generated from real footage or omitted · missing media renders as nothing · scrims over any text on video · results loop by default, muted · **imported originals are never modified or deleted** (§11.2).

### 10.5 Components

Primary / secondary / destructive button · record control · chip · filter pill · trick card · video thumbnail · session card · feedback row · stage list · upload progress · empty state · error panel · toast · bottom navigation · outcome selector · stepper · text field · confirmation dialog · offline badge · queued badge · skeleton loader.

Each ships with loading, empty, error, and disabled states where applicable. Feedback rows accept a domain object, not loose primitives.

**`EvidenceTag` is deliberately absent.** Under §9 option (b) there is no per-component evidence to render, so the component is not built. Building it in Phase 2 would hand Phase 9 a loaded gun. It returns with §9 change 1, next release.

**A `ReadinessBanner` replaces it** — one analysis-level component with three states mapped from `review_readiness`.

---

## 11. Truth, data, and durability rules

### 11.1 Truth rules

1. No score without server support. Absent means absent — never zero, never a dash inside a score component.
2. No client-assigned evidence. A missing component is omitted, never labeled.
3. No client-computed confidence.
4. No timer-driven analysis progress. Determinate percentages come only from observed upload bytes.
5. Abstention renders as content, with the server's reason in plain language.
6. The manual outcome is authoritative and is never overwritten by engine output. Where they disagree, both are shown and the manual outcome wins in all statistics.
7. Missing metrics render as empty states, not zeros.
8. Every failure has plain-language copy and at least one recovery action.
9. Unknown or unexpected fields never become optimistic claims.

### 11.2 Media ownership

| File | On cancellation |
|---|---|
| App-recorded working file | May be deleted |
| App-created compressed derivative | May be deleted |
| **Imported library or camera-roll asset** | **Never deleted, moved, or modified** — the outbox holds a reference; cancellation drops the reference only |
| Uploaded R2 object | Requires an explicit server delete or lifecycle rule |

### 11.3 State ownership

| Store | Owns |
|---|---|
| MMKV (or equivalent sync KV) | Auth token pointer, active session ID, selected trick + modifiers, onboarding flags, last-seen version |
| SQLite | Outbox rows, local clip records, pending attempt reports, reconciliation log |
| Query layer | Server-derived read state, read-through only |
| In-memory store | Session projection, hydrated on launch |
| Server | All authoritative records |
| RevenueCat | Entitlement truth, subject to §12.3 |

Anything that must survive app termination lives in SQLite. No optimistic mutation state lives in the query cache. Every persisted shape carries a schema version and is migrated or discarded on mismatch, never reinterpreted.

### 11.4 Score specification

Scale 0–10 (§8.4). `null` means abstention and renders as absence.

**Launch rule — decided, not deferred.** Result and History view models are built before Phase 11, so this cannot wait:

- A score may be displayed on its own individual result.
- History may list individual scores.
- **No combined trend, average, "best", or improvement comparison across providers.**
- Provider and model metadata are stored and retained on every result.
- Gemini and Pegasus scores are never presented on one continuous scale until calibration is proven.

**Closed (DOC-001 / Q&A 5):** whole numbers 0–10. `limited` may show a score only when the payload has one. `insufficient` never does. Mapper: `src/domain/mappers/score.ts`.

### 11.5 Evidence specification

**Closed — option (b).** Overall sufficiency maps from `review_readiness` (`usable` → sufficient, `limited` → partial, `insufficient` → insufficient); `uncertainty_notes` and `processing_notes` render as an explicit uncertainty block; `quality_signals.video_readable` and `motion_detected` gate whether any read is shown at all; mechanics dimensions render with their server-provided free-text `evidence` string and never with a client-assigned tag.

Under option (a), the states, required fields per state, prohibited combinations, display labels, colors, and VoiceOver announcements are defined in the change-1 ticket. Unknown states from a future server version render as unavailable, never as detected.

### 11.6 Idempotency and durability

Because `clip_id` is server-generated, the outbox anchors on a client `local_id` and transitions through server identity:

| Stage | Identifier | Duplicate protection |
|---|---|---|
| Local capture | `local_id` (client) | Local only |
| Initiate upload | `local_id` → server `clip_id` | Retry before response can create an orphan clip row — **§9 change 4** |
| PUT to R2 | `storage_key` | Overwrite-safe |
| Complete upload | `clip_id` | Must be idempotent — §9 change 4 |
| Attempt report | client `id` | Client ID supported. **OF-003 closed BE-001 at working-tree verification.** Railway / deployed parity unverified. |
| Session end | `session_id` | §9 change 6 |

A response-replay cache alone is not correctness — a device can be offline longer than any cache TTL. Correctness rests on permanent uniqueness at the resource level; caching only avoids repeat work.

**Orphan risk, explicitly:** if `initiate-upload` succeeds but its response is lost, the client retries and the server creates a second pending clip row. At launch this is reconciled by a client-side sweep that abandons unreferenced local rows and by the existing `clip_pending_reaper` service. Confirm the reaper's window in Phase 0.

### 11.7 Outbox states

`pending` · `presigning` · `uploading` · `uploaded` · `requesting_analysis` · `analyzing` · `ready` · `failed_retryable` · `failed_permanent` · `cancelled`.

Retryable and permanent failures are distinct. Permanent failures — unreadable media, revoked auth, 403 tier gate — are never retried silently. Each row stores schema version, local and server IDs, media ownership, size, MIME type, byte progress, attempt count, next retry time, structured error kind, and the owning account ID.

### 11.8 Offline behavior

| Surface | Offline |
|---|---|
| Home, History, Profile | Cached reads |
| Session creation | Local, synced on reconnect |
| Session end | Local `pending_end`; **reconcile against the server row before `PATCH`** (§11.9). Last-write-wins is the server's behavior, not the client's strategy |
| Trick selection | Cached registry |
| Capture | Allowed; queues |
| Upload, analysis request | Queued |
| Attempt reporting | Queued via batch sync |
| Paywall, subscription change, account deletion | **Blocked** with a plain "needs a connection" state; nothing queued |

### 11.9 Session end — verified server behavior

**Working-tree OF-005 (Railway unverified):** first concurrent end wins; the loser receives the winning `ended_at`. The launch client still does not trust the server to arbitrate: `endSession` sends `ended_at` only when the fetched row has none.

Historical note from the spec’s original read of `update_session` (pre-OF-005): `PATCH` accepted `ended_at` with no conflict handling and overwrote blindly. **Launch client rule:** if the server already shows the session ended, discard the local value, keep the server’s, and tell the user once.

**Session recovery.** If the original session no longer exists server-side, the clip is never silently re-homed. The user chooses: attach to the current session, recover a session using the original local start time, or keep it unassigned. Original times and spot metadata are retained in all three paths.

---

## 12. Security, privacy, and account isolation

### 12.1 Sign-out with queued media

| Question | Policy |
|---|---|
| Account association | Every outbox row carries the owning user ID and is **sealed** to it |
| Cross-account visibility | Another account signing in can neither see, upload, nor delete sealed rows |
| Resuming | Requires the original account to sign back in |
| Tokens | Cleared on sign-out. Sealed rows hold no credentials |
| Encryption | App-private storage with iOS file protection (complete-until-first-user-authentication) |
| Retention | Sealed media purged after 30 days; the sign-out confirmation names the count and the window |
| User-owned library assets | Never touched — sealing applies to the reference only |

### 12.2 General

Tokens in `expo-secure-store`, never logged · presigned URLs and media URLs never logged (`sanitize_public_media_url` already exists server-side) · R2 objects authorized per user · telemetry carries no media URLs, no notes text, no spot labels · account deletion and data export use the existing endpoints and are tested before beta · local files cleaned on account deletion.

### 12.3 Store and backend disagreement

RevenueCat can report Pro before the backend entitlement syncs. Resolution order: RevenueCat for *gating the UI*, backend for *charging quota*. The user never sees contradictory state; if the backend rejects an upload the client already has a Pro entitlement for, it shows a sync state with a retry, not a paywall.

---

## 13. Test matrix

**Lifecycle:** termination during upload · termination during analysis · double-tap analyze · double-tap save · expired presigned URL · **`initiate-upload` response lost, retry creates no usable orphan** · session missing server-side · quota reached at complete-upload · sign out with queued media · sign in as a different account with sealed rows present · clip deleted mid-job · analysis completing after account deletion begins · corrupt or unsupported codec · clip over 30s or 100MB rejected client-side before initiate · large clip on interrupted cellular · time-zone change · manual outcome disagreeing with engine output · low-memory camera recovery · storage pressure during compression · outbox row from an older schema version · app upgrade mid-operation · offline subscription change or deletion blocked · offline session end syncing · Another Clip with an unsaved outcome · analysis completing while backgrounded · completed job missing `result_json` (500) · score outside 0–10 · `null` score rendering as absence · malformed or rolled-back response · **scores from two providers in one user's history** · long-press on the record control behaving as a tap.

**Accessibility:** Dynamic Type at 200% on every screen · Capture at 200% (overlay capped, labels unclamped) · reduced motion · VoiceOver traversal order and meaningful announcements for evidence and outcome states · outcome selector distinguishable without color · touch target minimums · outdoor legibility on device.

**Billing:** free, trial, free_expired, pro, session_reup gating · restore · Customer Center · store/backend disagreement · 403 trial-ended upload gate · 429 hourly and daily abuse caps.

Every test asserts *behavior*, not the presence of a control. Terminal states must have an enabled action that actually works.

---

## 14. Parity and approved deviations

### 14.1 Parity required

Verified against `onflow-lite`, not against this document: Apple sign-in including cancellation and revocation · session creation, recovery, and lookup · trick registry and modifier identity · library upload and permission edge cases · analysis polling including non-transient termination · manual outcome logging and its authority · history and progression API consumption · RevenueCat entitlement resolution, restore, Customer Center · tier gating and quota counting · account deletion and hard-delete pipeline · data export · clip retention consent.

### 14.2 Approved deviations

| Reference behavior | Launch behavior | Reason |
|---|---|---|
| `expo-image-picker` capture | In-app `expo-camera`, tap to start/stop | Core loop speed; accident prevention |
| Existing navigation | Contextual five-slot shell | New design |
| `app/feed.tsx`, `app/pte.tsx`, `app/notifications.tsx` | Removed | Out of launch scope |
| Client-side score defaults | Score absent when the engine abstains | Truth rule 1 |
| Existing result mapping | Validated mapping in a pure domain layer | Truth enforcement |
| AsyncStorage | SQLite outbox + sync KV | Durability |
| Online-only session end | Local `pending_end` with sync | Skatepark connectivity |
| Progression charts | Raw attempt list | Insufficient data to validate |

---

## 15. Architecture

**Layers.** `api/` (transport, generated types, runtime validation) · `domain/` (pure mapping and rules, framework-free) · `ui/` (renders domain models) · `store/` (session projection + SQLite outbox).

**Enforced boundaries.** `ui/` cannot import from `api/` · `domain/` cannot import React, React Native, or networking · `api/` contains no user-facing copy · only `domain/mappers/` constructs branded domain types. All four are lint rules, not conventions.

**Generated types.** `openapi-typescript` against the live schema; CI fails if the committed file is stale. Generated files are never hand-edited.

**Runtime validation.** Every response is schema-validated before mapping. Generated types describe the contract; runtime validation enforces it. A validation failure becomes a contract error with plain-language copy and a recovery action — it never reaches the UI as data.

**Provenance.** Branded types make fabrication conspicuous, not impossible. Provenance is enforced by six layers together: boundary lint, runtime validation, mappers-only construction, an AST lint rule on branded assertions, mapper unit tests, and whole-object component props.

**New dependencies and their cost.** `expo-camera` (no in-app camera today) · `expo-video` (no video playback library today) · `expo-sqlite` (AsyncStorage today) · a state library · a query library · `zod` · possibly a display font. Each is justified above; each is also a new failure surface in an app that currently has none of them.

---

## 16. Build phases and gates

| Phase | Work | Exit condition |
|---|---|---|
| 0 | Repo, CI, contract verification of every `UNVERIFIED` item, change-inventory tickets, font decision, tokens, lint boundaries, type generation | Every `UNVERIFIED` resolved; §9 rows ticketed; boundary lint fails on a deliberate violation; font renders on device with license confirmed |
| 1 | Navigation shell + context action | All five center states resolve |
| 2 | Component library | Every component renders all its states |
| 3 | `api/` + schemas + `domain/` + mapper tests | Score and evidence decisions closed; all nine truth rules covered by tests |
| 4 | Backend changes (§9) | Deployed to staging |
| 5 | Home | First run, returning, offline |
| 6 | Trick selection | Trick and modifiers survive relaunch |
| 7 | Capture + outbox | Kill-app-mid-upload recovers; media ownership honored |
| 8 | Analyzing | All phases, failure, slow, abandon-and-return, foreground reconciliation |
| 9 | Result | Usable / limited / insufficient readiness paths |
| 10 | Save + continuation | Result → recording in 2 taps |
| 11 | History | Relationships verified against the real API; provider comparability applied |
| 12 | Profile + Paywall | Live packages, restore, deletion, sign-out sealing |
| 13 | Parity + device and resilience testing | §13 matrix green |
| 14 | TestFlight closed beta | 5–10 skaters (§16.2) |

### 16.2 Validation ladder

5–10 skaters answers one question only: does it function in the real world? It does not tell you whether OnFlow works as a product.

| Cohort | Question it answers |
|---|---|
| 5–10 | Does it function outdoors, on real devices, on cellular? |
| 20–30 | Do people understand it without Vincent explaining it? |
| 50+ | Do retention patterns appear? |

The metric that matters is already criterion 12: **≥ 40% start another session within seven days.** Downloads are not the victory. Accounts are not the victory. Analyses run are not the victory. Coming back to skate with OnFlow again is the victory.

The launch question, stated plainly: **will skaters repeatedly film attempts through OnFlow because the analysis and history experience beats just using their camera?** If no, nothing on the post-launch list matters. If yes, there is something here.

### 16.3 Phase 0 tickets

Phase 0 is engineering, not more planning. In order:

**`BE-001 — Make attempt sync immutable`**
- Same `(user_id, attempt_id)` + identical payload → accepted replay, no mutation
- Same `(user_id, attempt_id)` + changed payload → rejected with a structured reason
- An attempt can never change sessions
- A deleted attempt cannot resurrect through stale sync
- An unknown outcome is rejected, never coerced to `missed`
- Migration establishes the uniqueness constraint
- Tests prove every one of the above

**`BE-002 — Quota reservation and finalization`** — reserve at accepted submission, finalize on usable completion, release on provider or infrastructure failure, explicit policy for unreadable footage, all idempotent.

**`BE-003 — Session-end conflict contract`** — define and return the winning `ended_at` rather than silently overwriting.

**`BE-004 — Ended-session clip reconciliation`** — accept a delayed upload only when the capture timestamp predates `ended_at`; 24-hour window.

**`EXP-001 — Compression experiment`** — physical. Ten real 30s clips on the target device, encoded at candidate bitrates, checked against the 100MB ceiling and against whether the engine can still read them.

**`DOC-001`** — close the remaining `UNVERIFIED` values and the §18.3 design conflicts.

Only then does Phase 1 start.

### Phase 0 order of work

Dependency-ordered, because several of these gate each other:

1. **Attempt immutability (§9 change 11).** First, because it protects the record the whole truth model rests on. Everything else is recoverable; a silently mutated outcome is not.
2. **Quota reservation and finalization (§9 change 12).** A precise economic contract before real users start consuming paid inference.
3. **Ended-session upload rules (change 13) and session-end conflict handling (change 6).** Together these determine whether offline reconciliation is correct.
4. **Measure compression physically (§7.5).** Shoot real clips at 30s, encode at candidate bitrates, check sizes against 100MB, and confirm the engine can still read the output. Not a number from a forum post.
5. **Close every remaining `UNVERIFIED`.**
6. **Resolve the design conflicts in §18.3.**

**This document moves from Draft to Approved only when all of the following are closed:**

1. Rate-limit contract corrected in the client (generic 429 + `Retry-After`, no prose parsing) — §8.2 ✅ `src/api/client.ts`
2. Attempt-ID mutation resolved — §9 change 11 ✅ OF-003 working tree; Railway unverified
3. Failed-analysis quota release decided and ticketed — §9 change 12 ✅ OF-004 working tree; Railway unverified
4. Uploads into ended sessions restricted — §9 change 13 ✅ OF-005 working tree; Railway unverified
5. Launch evidence behavior specified with no per-component inference — §9 option (b) rules ✅ `ReadinessBanner`; no `EvidenceTag`
6. Cross-provider score comparison prohibited — §11.4 ✅ documented and stored as `providerModel`
7. Compression contract measured and filled — §7.5 — **accepted unmeasured** (owner 2026-09-01). OF-006 closed without PUT files. Q&A 11 remains OPEN as measurement debt; 6 Mbps is still a candidate.
8. `complete-upload` idempotency limits documented and the client reconciliation path built — §8.3 ✅ `runOutboxRow` 409 → analyzing / poll
9. Every remaining `UNVERIFIED` value closed — ✅ 2026-09-01 audit (`docs/phase-0-gate-audit.md`). Compression stays item 7. Q&A 1 deferred under §11.4.

**Gate into Phase 1:** **open.** Owner approved 2026-09-01 with item 7 accepted unmeasured and font-on-device accepted as code-only (Bebas Neue + Sora + JetBrains Mono loaded in `app/_layout.tsx`). Railway parity for BE-001–004 remains unverified and is not a Phase 1 start blocker.

**Later gates:** Result cannot start until its §9 dependencies are on staging · History cannot start until attempt/clip/session relationships are verified against the real API · beta cannot start until a production-compatible backend is deployed and pinned against a minimum client version.

---

## 17. Release requirements

Staging backend compatible · production backend version-pinned · minimum client version established · migrations deployed · OpenAPI snapshot committed · RevenueCat products and the exact entitlement string verified against the new bundle · legal links live · privacy declarations complete · account deletion tested end to end · data export tested · crash reporting enabled · analytics redacted · TestFlight checklist complete · rollback plan written.

---

## 18. Open questions — answers

Six are closed by the code. Three are decisions made here. Three cannot be answered by any document and need measurement or an external system.

### Closed by the repository

| # | Question | Answer | Evidence |
|---|---|---|---|
| 6 | Is `complete-upload` idempotent? | **No, but it is retry-tolerant.** Full state matrix in §8.3. `job_id == clip_id`, so a `409` is reconciled by polling the job. No backend change needed to ship | `services/clip_v1_pipeline.py` |
| 7 | Does `PATCH /sessions/{id}` accept a late `ended_at`? | **Working-tree OF-005:** first-end wins; loser receives the winner. Railway / deployed parity unverified. Launch client still does not rely on the server: `endSession` PATCHes only when the server row has no `ended_at` | OF-005; `src/api/endpoints.ts` `endSession` |
| 8 | Pending-clip reaper window | **24 hours**, configurable via `clip_pending_reap_hours`, 200 rows per run, `pending` status only. Analyzing and analyzed clips are untouched | `services/clip_pending_reaper.py` |
| 9 | Minimum iOS and typeface | **No explicit deployment target is set** — Expo 53 defaults apply (iOS 15.1). Portrait only, `supportsTablet: false`, `newArchEnabled: true`, dark UI, `backgroundColor #080808`. Fonts: **Bebas Neue (display) + Sora (body) + JetBrains Mono (machine-truth)** via `@expo-google-fonts` (OFL). Loaded in `app/_layout.tsx`. Device render still unconfirmed. | `app.json`, `app/_layout.tsx` |
| 10 | Is Google sign-in a real launch option? | **No. Apple only.** `signInWithGoogle` exists in `src/api/authApi.ts` and the endpoint is live, but there is no Google sign-in SDK in `package.json` and no plugin in `app.json` — the only "google" packages are the two Google Fonts. The client can post an `id_token` it has no way to obtain. Shipping Google means adding an SDK, a plugin, account-linking rules, and a RevenueCat identity story — a feature, not a checkbox | `package.json`, `app.json` |
| — | Does the engine get audio? | **Yes.** `NSMicrophoneUsageDescription` is declared and Android requests `RECORD_AUDIO`. Compression must preserve audio unless the engine is confirmed to ignore it | `app.json` |

### Decided here

| # | Question | Decision | Reasoning |
|---|---|---|---|
| 2 | Two or three outcome values? | **Two: `landed` / `missed`** | Adding `unsure` means a schema change, a migration, and fixing the `_to_out` coercion that would silently turn it into `missed`. The engine's `unclear` is a separate field about the *analysis*, not about what the skater says happened. A skater who genuinely doesn't know can leave the attempt unlogged — the clip is still saved |
| 3 | Does the RevenueCat entitlement survive a rename? | **Keep bundle ID `com.onflow.lite` and the entitlement string `"onflow-lite Pro"` unchanged** | The real risk is larger than the string. Products are `com.onflow.lite.lifetime` / `.yearly` / `.monthly` and are tied to that bundle. A new bundle ID is a **new App Store app** — existing subscriptions do not transfer and every paying user loses access. The new client ships under the existing bundle. Display name may change freely |
| 4 | Per-component evidence: build or map? | **Map onto `review_readiness` at launch** (§9 option b) | Option (a) blocks Result behind a schema change, a prompt change, and an engine change. Option (b) violates no truth rule — it labels less, which is the correct failure direction |

### 18.3 Design conflicts — closed (DOC-001)

| Conflict | Decision |
|---|---|
| **Analyzing: 72% ring + four sequential checkmarks** | Named phases from real state only: UPLOADING (observed bytes), QUEUED, REVIEWING CLIP, READY, FAILED. No percentage, no fake checkmarks, no "Detecting trick". |
| **"Detecting trick" label** | Banned. The skater called the trick; the engine reviews against it. |
| **Result: evidence circles beside Pop / Flick / Landing / Style** | Dropped for launch under §9 option (b). One analysis-level `ReadinessBanner`. No `EvidenceTag` component exists. |
| **"Get discovered", Trending Tricks, Parts, Share Clip** | Cut. Not in the launch information architecture. |

Amber `#FFB020` fills the palette gap for `limited`.

### Canonical trick catalog (BE-005)

`GET /api/v1/tricks` returns `{ tricks: [{ id, name, category, aliases, difficulty_tier, rotation }] }` from `trick_registry.py`. The launch client does not keep a second catalog.

### Cannot be answered from documents

| # | Question | What it actually needs |
|---|---|---|
| 1 | Are Gemini and Pegasus scores comparable? | An empirical calibration run: the same 30–50 clips through both providers, correlation checked. Until then §11.4 stands — individual scores display, nothing aggregates across providers. This is a half-day experiment, not a decision |
| 5 | Score display rounding | **Closed DOC-001:** whole numbers 0–10. `limited` may show a score only when present. `insufficient` never does. |
| 11 | Compression parameters | **OPEN (measurement debt).** Spec **Approved** 2026-09-01 with this unmeasured. Candidate 6 Mbps in `src/domain/compression.ts` is not a locked launch number. |
| 12 | Reconciliation window for uploads into an ended session | **Closed BE-004:** 24 hours from `ended_at`. Capture must predate `ended_at`. Codes: `capture_after_session_end`, `session_end_upload_window_expired`. |