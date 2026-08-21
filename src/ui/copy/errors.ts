/**
 * Approved copy catalog (guardrails 6, truth rule 8).
 *
 * User-facing text is looked up by machine-readable kind. A caught exception
 * message never reaches the screen, and no branch here reads an English error
 * string off the wire. Every entry carries at least one recovery action.
 */

export type ErrorKind =
  | "offline"
  | "rate_limited"
  | "quota_exhausted"
  | "tier_gate"
  | "auth_expired"
  | "upload_failed_retryable"
  | "upload_failed_permanent"
  | "clip_too_long"
  | "clip_too_large"
  | "clip_unsupported_type"
  | "clip_unreadable"
  | "analysis_failed"
  | "contract_error"
  | "session_missing"
  | "session_already_ended"
  | "capture_after_session_end"
  | "attempt_conflict"
  | "store_unavailable"
  | "entitlement_syncing"
  | "unknown";

export interface ErrorCopy {
  readonly title: string;
  readonly body: string;
  /** Every terminal state offers an action that actually works (spec 7.6). */
  readonly primaryAction: string;
}

export const errorCopy: Record<ErrorKind, ErrorCopy> = {
  offline: {
    title: "No connection",
    body: "You can keep filming. Clips stay on your phone and upload when you're back online.",
    primaryAction: "Keep filming",
  },
  rate_limited: {
    title: "Slow down a moment",
    body: "You've hit a temporary limit. Give it a minute and try again.",
    primaryAction: "Try again",
  },
  quota_exhausted: {
    title: "Out of analyses",
    body: "Your clip is saved. Upgrade to keep getting reads on your attempts.",
    primaryAction: "See plans",
  },
  tier_gate: {
    title: "Your trial has ended",
    body: "Your footage is safe. Upgrade to analyze new clips.",
    primaryAction: "See plans",
  },
  auth_expired: {
    title: "Sign in again",
    body: "Your session expired. Your queued clips are still here, saved to your account.",
    primaryAction: "Sign in",
  },
  upload_failed_retryable: {
    title: "Upload didn't finish",
    body: "The connection dropped. Your clip is saved and ready to send again.",
    primaryAction: "Retry upload",
  },
  upload_failed_permanent: {
    title: "This clip can't be uploaded",
    body: "Your footage is still on your phone. Try filming this one again.",
    primaryAction: "Film again",
  },
  clip_too_long: {
    title: "Clip is too long",
    body: "Clips need to be 30 seconds or under. Trim it or film a shorter attempt.",
    primaryAction: "Film again",
  },
  clip_too_large: {
    title: "Clip is too large",
    body: "This file is over the 100MB limit even after compression. Try a shorter attempt.",
    primaryAction: "Film again",
  },
  clip_unsupported_type: {
    title: "Unsupported video format",
    body: "OnFlow reads MP4 and QuickTime video. Pick a different clip.",
    primaryAction: "Choose another clip",
  },
  clip_unreadable: {
    title: "Couldn't read this footage",
    body: "The file looks damaged. Your original is untouched — try filming the attempt again.",
    primaryAction: "Film again",
  },
  analysis_failed: {
    title: "Analysis didn't finish",
    body: "Your clip is saved and this didn't use an analysis. You can try the read again.",
    primaryAction: "Try again",
  },
  contract_error: {
    title: "Something's out of sync",
    body: "We got a response we couldn't read, so we're not going to guess. Your clip is safe.",
    primaryAction: "Try again",
  },
  session_missing: {
    title: "That session is gone",
    body: "Your clip is safe. Choose where it belongs.",
    primaryAction: "Choose a session",
  },
  session_already_ended: {
    title: "Session already ended",
    body: "This session was closed on another device, so we kept that end time.",
    primaryAction: "Got it",
  },
  capture_after_session_end: {
    title: "Filmed after the session ended",
    body: "This clip was filmed after the session closed, so it needs a session of its own.",
    primaryAction: "Choose a session",
  },
  attempt_conflict: {
    title: "Already recorded",
    body: "This attempt is already saved with a different result, so we left your record alone.",
    primaryAction: "View attempt",
  },
  store_unavailable: {
    title: "Can't reach the App Store",
    body: "We won't show prices we can't confirm. Check your connection and try again.",
    primaryAction: "Try again",
  },
  entitlement_syncing: {
    title: "Confirming your plan",
    body: "Your purchase went through and we're syncing it now. This usually takes a moment.",
    primaryAction: "Retry sync",
  },
  unknown: {
    title: "Something went wrong",
    body: "We're not sure what happened. Your footage is safe on your phone.",
    primaryAction: "Try again",
  },
};
