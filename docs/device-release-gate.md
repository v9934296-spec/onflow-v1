# ONFLOW device release gate (Gemini Flash, Oct 2026)

The app is NOT launch-certified by CI alone. The required quality evidence comes
from a real iPhone, R2 upload, Gemini response, recovery, and StoreKit sandbox.
Do not treat a generated score or passing unit tests as measured AI accuracy.

## Preflight (operator / automated)

- GitHub `main` SHA must equal Railway API and worker deployment SHAs.
- `GET /health` must report `status=ok`,
  `analysis_providers_enabled=true`, `clip_review_ready=true`,
  `gemini_configured=true`, `storage_backend=s3`, and a recognizable `release_sha`.
- `GET /health/deep` checks database and queue metadata. A small queue depth
  does NOT prove the worker processed a job. Verify Railway worker logs during a clip.
- The actual authenticated `POST /api/v1/clips/initiate-upload` response must
  supply an HTTPS signed PUT URL, **never** `local://`. Do not paste URLs into
  tickets or chat: they are time-limited write credentials.
- Verify Apple Sign-In bundle/audience for `com.onflow.lite` and the correct
  RevenueCat entitlement `onflow-lite Pro` and monthly/annual packages. An
  API health 200 cannot establish App Store billing correctness.
- Release checks: `npm ci && npm run verify:phase0`; Python:
  `cd services/api && pip install -r requirements.txt && pytest tests -q`.
  GitHub Actions runs both suites on pull requests.

## Build for a physical iPhone (not Simulator)

1. Pull the reviewed `main` branch and sign in to EAS.
2. Register your iPhone in EAS's device list and check your Apple team/credentials.
3. Run `npm run build:device:ios` (equivalent to `eas build --profile device-preview --platform ios`).
4. Install the resulting device-preview IPA from the EAS install link on that
   registered iPhone. The `preview` profile is a Simulator build, not your phone.
5. Use `production` profile for TestFlight's store-signed build; physical internal
   preview and TestFlight are intentionally different signing paths.

## Required filmed-clip acceptance scenarios

| Scenario | Expected observable behavior |
| --- | --- |
| Landed kickflip, 4–12s | One queued clip, real R2 PUT, worker log with same clip id, accurate/limited feedback, manually confirmed landing authoritative, History reopens result. |
| Missed kickflip | No invented clean landing; outcome remains the skater's call; useful visible correction or honest uncertainty. |
| Board/landing off-camera | No fabricated landing/mechanics; reduced/absent confidence and explicit visibility limitations. |
| Airplane mode after Use clip | Local footage persists in Documents, row stays recoverable; after connectivity returns, same clip id reuses a refreshed HTTPS presign; no duplicate charge. |
| Terminate app mid-upload | Relauch resumes recoverable work with same id and no missing-file error. |
| Slow Gemini response (>5 minutes) | The UI stays 'still processing' rather than declaring a failed job until the server reports failure. |
| Monthly quota reached | HTTP 429 `quota_exhausted` routes to plans; generic `hourly_analysis_cap_reached` remains a retryable throttle, never a sales prompt. |
| Trial gate reached | HTTP 403 `tier_gate` routes to plans without checking English server prose. |
| StoreKit sandbox Pro purchase + restore | Entitlement becomes `onflow-lite Pro` in RevenueCat and server tier after sync; restoring on device works. |
| Crash/slow connection | No lost imported original, no duplicate review created; errors visible; logs identify clip without exposing video contents/keys. |

Record **pass/fail**, iPhone model, iOS version, EAS build id, Git SHA,
session/clip ids and timestamps, upload size/duration. Never include private
access tokens, signed URLs, or raw personal footage in bug reports.

## Gemini feedback quality gate (NOT satisfied by mock or prompt inspection)

`services/api/tests/regression/test_gemini_hallucination.py` is an existing
LIVE Gem-ini regression runner; `fixtures/registry.json` is currently empty.
Populate it with **consented, ground-truth-labeled** clips kept outside public
Git. Aim for **20–30 clips** across lands/misses, varied stances, daylight/
low-light, occlusion, off-camera landing and no-skater footage. A competent
skater labels the true landing, board visibility, primary visible mistake,
and whether the proposed cue would be actionable **before** reading AI output.

Run the production free/Pro prompt paths, including optional enrichment,
more than once on the same clips (`GEMINI_REGRESSION_ENABLED=1`). Calculate:
- Incorrect confident landing claims (must be near zero; **zero fabricated
  landings on off-camera/unreadable clips**).
- Land/miss accuracy on clips where humans can clearly see the outcome.
- Proportion with a **specific, visually supported** cue and sensible drill.
- Hallucinated foot/board/timing claims, generic filler, variance across runs.
- Real $ cost, total calls and end-to-end latency at the actual tier quotas.

**Do not assign feedback quality ≥8.5 without recorded fixture judgments**.
Stopping a false claim is better than an impressive score unsupported by video.

## Remaining manual constraints

- Physical iPhone signing, install, camera and cellular tests.
- App Store Connect + RevenueCat sandbox purchase and restoration.
- Obtain consented evaluation clips and skater ground truth for Gemini.
- Optionally supply a Sentry DSN if client crash telemetry is desired; Railway
  backend logs and health alone do not prove phone crash coverage.
