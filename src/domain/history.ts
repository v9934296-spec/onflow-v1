import type { Attempt, AttemptOutcome, OutboxState, Score } from "./models";

export type HistoryTab = "clips" | "sessions" | "tricks";

export interface HistoryScoreRecord {
  readonly jobId: string;
  readonly score: Score | null;
  readonly providerModel: string | null;
  readonly readiness: "usable" | "limited" | "insufficient" | null;
}

export interface HistoryClipItem {
  readonly key: string;
  readonly jobId: string | null;
  readonly localId: string | null;
  readonly clipId: string | null;
  readonly sessionId: string | null;
  readonly label: string;
  readonly state: string;
  readonly updatedAt: string;
  readonly durationSeconds: number | null;
  readonly thumbnailUrl: string | null;
  readonly score: Score | null;
  readonly providerModel: string | null;
  readonly unread: boolean;
}

export interface HistorySessionItem {
  readonly sessionId: string;
  readonly endedAt: string | null;
  readonly focusTrick: string | null;
  readonly clipsCount: number;
  readonly attemptCount: number;
}

export interface HistoryTrickRow {
  readonly id: string;
  readonly canonicalName: string;
  readonly outcome: AttemptOutcome | null;
  readonly score: Score | null;
  readonly providerModel: string | null;
  readonly loggedAt: string;
}

export interface HistoryTrickGroup {
  readonly canonicalName: string;
  readonly rows: readonly HistoryTrickRow[];
}

export function jobStateLabel(status: "pending" | "processing" | "completed" | "failed"): string {
  if (status === "pending") return "queued";
  if (status === "processing") return "analyzing";
  if (status === "completed") return "ready";
  return "failed";
}

export function outboxStateLabel(state: OutboxState): string {
  if (state === "ready") return "ready";
  if (state === "analyzing" || state === "requesting_analysis") return "analyzing";
  if (state === "uploading" || state === "presigning") return "uploading";
  if (state === "failed_retryable" || state === "failed_permanent") return "failed";
  if (state === "cancelled") return "cancelled";
  return "queued";
}

/** Timeline `best_pte_score` is never copied onto the History view model (§11.4). */
export function mapTimelineSession(input: {
  session_id: string;
  ended_at?: string | null;
  focus_trick?: string | null;
  clips_count?: number;
  attempt_count?: number;
  best_pte_score?: number | null;
}): HistorySessionItem {
  return {
    sessionId: input.session_id,
    endedAt: input.ended_at ?? null,
    focusTrick: input.focus_trick ?? null,
    clipsCount: input.clips_count ?? 0,
    attemptCount: input.attempt_count ?? 0,
  };
}

export function mergeHistoryClips(input: {
  jobs: readonly {
    job_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    clip_label: string;
    updated_at: string;
    thumbnail_url?: string | null;
  }[];
  outbox: readonly {
    localId: string;
    clipId: string | null;
    sessionId: string | null;
    state: OutboxState;
    durationSeconds: number;
    capturedAt: string;
    mediaKind: string;
  }[];
  scores: Readonly<Record<string, HistoryScoreRecord>>;
  seenJobIds: ReadonlySet<string>;
}): HistoryClipItem[] {
  const byJob = new Map<string, HistoryClipItem>();

  for (const job of input.jobs) {
    const remembered = input.scores[job.job_id];
    byJob.set(job.job_id, {
      key: `job:${job.job_id}`,
      jobId: job.job_id,
      localId: null,
      clipId: job.job_id,
      sessionId: null,
      label: job.clip_label,
      state: jobStateLabel(job.status),
      updatedAt: job.updated_at,
      durationSeconds: null,
      thumbnailUrl: job.thumbnail_url ?? null,
      score: remembered?.score ?? null,
      providerModel: remembered?.providerModel ?? null,
      unread: job.status === "completed" && !input.seenJobIds.has(job.job_id),
    });
  }

  for (const row of input.outbox) {
    const jobId = row.clipId;
    if (jobId && byJob.has(jobId)) {
      const existing = byJob.get(jobId);
      if (!existing) continue;
      byJob.set(jobId, {
        ...existing,
        localId: row.localId,
        sessionId: row.sessionId,
        durationSeconds: row.durationSeconds,
      });
      continue;
    }
    const remembered = jobId ? input.scores[jobId] : undefined;
    byJob.set(row.localId, {
      key: `local:${row.localId}`,
      jobId,
      localId: row.localId,
      clipId: row.clipId,
      sessionId: row.sessionId,
      label: "Clip",
      state: outboxStateLabel(row.state),
      updatedAt: row.capturedAt,
      durationSeconds: row.durationSeconds,
      thumbnailUrl: null,
      score: remembered?.score ?? null,
      providerModel: remembered?.providerModel ?? null,
      unread: false,
    });
  }

  return [...byJob.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

export function groupHistoryTricks(
  attempts: readonly Attempt[],
  scores: readonly HistoryScoreRecord[],
): HistoryTrickGroup[] {
  const rows: HistoryTrickRow[] = attempts.map((attempt) => ({
    id: attempt.id,
    canonicalName: attempt.canonicalName,
    outcome: attempt.outcome,
    score: null,
    providerModel: null,
    loggedAt: attempt.loggedAt,
  }));

  for (const record of scores) {
    if (record.score == null) continue;
    rows.push({
      id: `score:${record.jobId}`,
      canonicalName: record.jobId,
      outcome: null,
      score: record.score,
      providerModel: record.providerModel,
      loggedAt: record.jobId,
    });
  }

  const byName = new Map<string, HistoryTrickRow[]>();
  for (const row of rows) {
    const list = byName.get(row.canonicalName) ?? [];
    list.push(row);
    byName.set(row.canonicalName, list);
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([canonicalName, groupRows]) => ({
      canonicalName,
      rows: groupRows.sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1)),
    }));
}

export function groupScoredClipsByTrick(
  clips: readonly HistoryClipItem[],
): HistoryTrickGroup[] {
  const byName = new Map<string, HistoryTrickRow[]>();
  for (const clip of clips) {
    if (clip.score == null) continue;
    const list = byName.get(clip.label) ?? [];
    list.push({
      id: clip.key,
      canonicalName: clip.label,
      outcome: null,
      score: clip.score,
      providerModel: clip.providerModel,
      loggedAt: clip.updatedAt,
    });
    byName.set(clip.label, list);
  }
  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([canonicalName, rows]) => ({
      canonicalName,
      rows: rows.sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : a.loggedAt > b.loggedAt ? -1 : 0)),
    }));
}
