# Launch QA and TestFlight gate

Physical-device work. Automated rules in `src/domain/__tests__` cover only the subset that does not need an iPhone. Do not mark Phase 13 or 14 GO until every device checkbox is actually run.

## Phase 13 — device and resilience matrix (spec §13)

Every item asserts behavior, not the presence of a control. Terminal states must have an enabled action that works.

### Lifecycle

- [ ] Termination during upload recovers the outbox
- [ ] Termination during analysis reconciles on foreground
- [ ] Double-tap analyze produces one resource
- [ ] Double-tap save produces one attempt
- [ ] Expired presigned URL is re-requested
- [ ] Lost `initiate-upload` response does not present an orphan as the user's clip
- [ ] Session missing server-side offers attach / recover / unassigned
- [ ] Quota reached at complete-upload retains footage
- [ ] Sign-out names queued count and the 30-day window
- [ ] Sign-in as a different account cannot see, upload, or delete sealed rows
- [ ] Clip deleted mid-job does not invent a result
- [ ] Analysis completing after account deletion begins does not restore the account
- [ ] Corrupt or unsupported codec is a permanent failure with catalog copy
- [ ] Clip over 30s or 100MB rejected client-side before initiate
- [ ] Large clip on interrupted cellular retries without losing the local file
- [ ] Time-zone change does not shift logged times into a different day on device
- [ ] Manual outcome disagreeing with engine output keeps the skater's call
- [ ] Low-memory camera recovery returns to a usable capture state
- [ ] Storage pressure during compression surfaces `low_storage` and does not film
- [ ] Outbox row from an older schema version is ignored, not coerced
- [ ] App upgrade mid-operation resumes the same local id
- [ ] Offline subscription change is blocked and not queued
- [ ] Offline account deletion is blocked and not queued
- [ ] Offline session end stays local and syncs later
- [ ] Another Clip with an unsaved outcome asks to save or discard
- [ ] Analysis completing while backgrounded is ready on foreground
- [ ] Completed job missing `result_json` is a contract error (not a fake score)
- [ ] Score outside 0–10 is omitted, never clamped
- [ ] `null` score renders as absence
- [ ] Malformed or rolled-back response is a contract error
- [ ] Scores from two providers in one user's history stay on separate rows; never averaged
- [ ] Long-press on the record control behaves as a tap

### Accessibility

- [ ] Dynamic Type 200% on every screen
- [ ] Capture at 200% (overlay capped, labels unclamped)
- [ ] Reduced motion
- [ ] VoiceOver traversal order; evidence and outcome states announced in words
- [ ] Outcome selector distinguishable without color
- [ ] Touch targets meet the minimum
- [ ] Outdoor legibility at arm's length

### Billing

- [ ] free / trial / free_expired / pro / session_reup gating
- [ ] Restore Purchases; prices from the store, never hardcoded
- [ ] Customer Center opens
- [ ] Store/backend disagreement shows sync + retry, not a paywall
- [ ] 403 trial-ended upload gate keeps footage
- [ ] 429 hourly and daily abuse caps

## Phase 14 — TestFlight closed beta (spec §16.2 / §17)

**GO** only when Phase 13 is green or waived in writing, Phase 4 staging is compatible, and the items below are true.

- [ ] Staging backend compatible with this client
- [ ] Production backend version-pinned
- [ ] Minimum client version established
- [ ] Migrations deployed
- [ ] OpenAPI snapshot committed and CI-fresh
- [ ] RevenueCat products and entitlement `"onflow-lite Pro"` verified against bundle `com.onflow.lite`
- [ ] Legal links live (Terms, Privacy)
- [ ] Privacy declarations complete
- [ ] Account deletion tested end to end
- [ ] Data export tested
- [ ] Crash reporting enabled
- [ ] Analytics redacted (no media URLs, notes, or spot labels)
- [ ] TestFlight checklist complete
- [ ] Rollback plan written
- [ ] 5–10 skaters on cellular, outdoors, real devices

**NO-GO** if attempt sync can still mutate, failed analysis consumes quota, analysis % is faked, EvidenceTag shipped, Google sign-in shipped, or a new bundle ID is used.

Automated coverage started (not a device pass): clip ceilings, outbox schema skip, account seal, two-provider History rows, null / out-of-range scores, gated unreadable Result, save confirmation cap.
