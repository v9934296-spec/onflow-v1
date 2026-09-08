import type { AnalysisResult } from "./models";
import { analyzingFailureKind, toCatalogErrorKind, type CatalogErrorKind } from "./outbox";

/** Same cadence as Analyzing: wait visibly before calling the job slow. */
export const RESULT_SLOW_MS = 45_000;
export const RESULT_POLL_CAP_MS = 5 * 60_000;

export type ResultLoadPhase = "loading" | "slow" | "ready" | "failed";

export type ResultPoll =
  | { readonly ok: true; readonly data: AnalysisResult }
  | { readonly ok: false; readonly errorKind: string };

export interface ResultLoadView {
  readonly phase: ResultLoadPhase;
  readonly analysis: AnalysisResult | null;
  readonly errorKind: CatalogErrorKind | null;
  readonly keepPolling: boolean;
}

/** Only a completed job is a result. Pending cache is a miss, not a read. */
export function completedResult(cached: AnalysisResult | null | undefined): AnalysisResult | null {
  if (cached?.status === "completed") return cached;
  return null;
}

export function jobPollDelayMs(elapsedMs: number): number {
  return elapsedMs > 30_000 ? 5_000 : 2_000;
}

/**
 * How the result screen behaves when the query cache is empty or the job is
 * still running. A miss is loading, not a contract error.
 */
export function interpretResultLoad(input: {
  readonly clipId: string | undefined;
  readonly poll: ResultPoll | null;
  readonly elapsedMs: number;
}): ResultLoadView {
  if (!input.clipId) {
    return { phase: "failed", analysis: null, errorKind: "contract_error", keepPolling: false };
  }

  if (input.poll == null) {
    return waiting(input.elapsedMs);
  }

  if (!input.poll.ok) {
    return {
      phase: "failed",
      analysis: null,
      errorKind: toCatalogErrorKind(input.poll.errorKind, "unknown"),
      keepPolling: false,
    };
  }

  const job = input.poll.data;
  if (job.status === "completed") {
    return { phase: "ready", analysis: job, errorKind: null, keepPolling: false };
  }
  if (job.status === "failed") {
    return {
      phase: "failed",
      analysis: null,
      errorKind: analyzingFailureKind(null, job.failureReason),
      keepPolling: false,
    };
  }
  if (input.elapsedMs >= RESULT_POLL_CAP_MS) {
    return { phase: "failed", analysis: null, errorKind: "analysis_failed", keepPolling: false };
  }
  return waiting(input.elapsedMs);
}

function waiting(elapsedMs: number): ResultLoadView {
  return {
    phase: elapsedMs >= RESULT_SLOW_MS ? "slow" : "loading",
    analysis: null,
    errorKind: null,
    keepPolling: elapsedMs < RESULT_POLL_CAP_MS,
  };
}
