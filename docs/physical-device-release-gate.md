# ONFLOW iPhone Release Gate (2026-10-11)

This is a **measurement protocol**, not evidence that the app passed.
Never call a clip review accurate without having independently labeled its video.

## Source and build integrity

- GitHub `main` and Railway `Onflow.skate` + `onflow-worker` must ship the **same release commit**.
- `npm ci && npm run verify:all` (TypeScript, ESLint, boundaries, API contract snapshot, Vitest, Python pytest) must pass.
- Verify `npm run verify:release-config`. EAS `preview` is simulator; `device-preview` is a physical iPhone; `production` is TestFlight.
- Verify `EXPO_PUBLIC_API_URL` on each build profile and RevenueCat environment before pressing build.
- Sign in to EAS with the correct account, register a real iPhone for internal distribution with `npx eas-cli device:create`, then `npm run build:device:ios`. Alternatively create store build with `npm run build:production:ios` and submit to TestFlight with `npm run submit:ios`.

## Real-device signed-in workflow

1. New install: Apple Sign-In, profile, Home, select **Kickflip / Switch**. Inspect tap count. Target at most five taps to film.
2. Record a **landed** attempt (10–20s). Accept clip. Before it uploads, confirm the queue holds a `file://` path in Documents, *not* CameraView's temporary cache. Complete and show feedback. Manually record **Landed**.
3. Change to **Tre flip / Fakie** while the earlier job processes; check the returned result retains **Kickflip / Switch** and the manual outcome from its own queued record.
4. Record a **missed** attempt; check the model acknowledges observable mechanics. Manually record **Missed**.
5. Import a 30s-or-shorter camera-roll video; confirm metadata and that cancelling import **does not delete the original**.
6. Toggle Airplane Mode during a real S3 upload; force-quit the app, relaunch offline, then reconnect on cellular. The same outbox item should resume, with no disappearing footage or duplicate paid charge.
7. Take a bad-angle/obstructed/no-action clip. Expected: limited/insufficient review, explicit uncertainty, **no fabricated landing or mechanic scores**, and no charged result for insufficient analysis.
8. Visit History, reopen the result, force quit, reopen History. Verify the local file still plays. Sign into a different account: no previous account's trick, session, or clip file should be accessible. Sign back in: local work restored.
9. Check server-backed History from a fresh installation. Prior completed clip receipts should appear even without the former phone's local video. **Do not claim remote playback**, since the backend currently deletes analysis-upload files unless retention is explicitly configured.
10. Test Profile → Export my data. Confirm the returned JSON belongs to the current account. Test account deletion **only with a disposable account**; server deletion is queued and app-owned local media should be erased.

## Quality and cost benchmark (do not invent results)

Use **at least 30 consented, human-labeled real clips**, with free and Pro, landed/missed, good/bad camera angles and different tricks. Never score the same clip as both training and blind validation. Record per clip:

| Field | Measure |
| --- | --- |
| Evidence | Filmer's trick, stance, outcome, visibility/lighting, timestamp |
| Pipeline | API initiate / S3 PUT / complete, job status, provider model, elapsed seconds |
| Correctness | Did the review describe only visible mechanics? Did it abstain where view was inadequate? |
| Helpfulness | Is the next attempt cue specific, visible and useful? 0–5 human rating |
| Safety | Hallucinated trick/outcome or invented detail, yes/no |
| Operations | Network type, upload retries, storage loss, unexpected job failure |
| Cost | Actual Gemini usage/invoices, Free single call, Pro optional second pass |

**Initial launch gates:** `>=95%` successful clip upload over cellular after retry (user target), `>=80%` of results accepting the manual outcome (user target), no invented visual evidence in the evaluation set, and at least `80%` human-rated useful coaching cues. These are **acceptance thresholds, not observed performance**.

## Known limits until physical testing

- There is **no verified transcoder** for imported videos. Camera settings aim for smaller files, but 100 MiB/30s rejection still applies.
- Video playback in History is durable **on the original device** only. Remote media is not retained by default.
- Tests and Railway deployment cannot prove Apple Sign-In, device camera, RevenueCat purchasing, real Gemini quality, or carrier conditions.
- Do not sell a production subscription until a real Pro purchase and expiry/restore path and real paid Gemini analysis pass on device.
