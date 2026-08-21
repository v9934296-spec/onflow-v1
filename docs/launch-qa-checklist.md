# Launch QA and TestFlight gate

Physical-device work. Do not mark GO until every checkbox is actually run on an iPhone.

## Device matrix (spec 13)

- [ ] Termination during upload recovers the outbox
- [ ] Termination during analysis reconciles on foreground
- [ ] Double-tap analyze / save produces one resource
- [ ] Expired presigned URL is re-requested
- [ ] Lost `initiate-upload` response does not present an orphan as the user's clip
- [ ] Session missing server-side offers attach / recover / unassigned
- [ ] Quota 403 retains footage
- [ ] Sign-out names queued count; other account cannot see sealed rows
- [ ] Clip over 30s or 100MB rejected before initiate
- [ ] Long-press on record behaves as a tap
- [ ] `null` score renders as absence
- [ ] Scores from two providers never averaged
- [ ] Dynamic Type 200% on every screen; capture overlay 130% visuals, labels unclamped
- [ ] Reduced motion
- [ ] VoiceOver order and outcome without color
- [ ] Outdoor legibility at arm's length
- [ ] Restore Purchases; no hardcoded price
- [ ] Account deletion and export E2E

## TestFlight GO / NO-GO

**GO** only if Phase 0 backend tickets are on staging, the core loop works on cellular, and the matrix above is green or waived in writing.

**NO-GO** if attempt sync can still mutate, failed analysis consumes quota, analysis % is faked, EvidenceTag shipped, Google sign-in shipped, or a new bundle ID is used.
