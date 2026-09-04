import type { AnalysisResult } from "../domain/models";
import type { HistoryScoreRecord } from "../domain/history";
import { kv, kvKeys } from "./kv";

function scoped(base: string, userId: string): string {
  return `${base}:${userId}`;
}

function readJson<T>(key: string, fallback: T): T {
  const raw = kv.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function rememberHistoryScore(userId: string, analysis: AnalysisResult): void {
  if (analysis.status !== "completed") return;
  const key = scoped(kvKeys.historyScores, userId);
  const scores = readJson<Record<string, HistoryScoreRecord>>(key, {});
  scores[analysis.jobId] = {
    jobId: analysis.jobId,
    score: analysis.score,
    providerModel: analysis.providerModel,
    readiness: analysis.readiness,
  };
  kv.set(key, JSON.stringify(scores));
}

export function readHistoryScores(userId: string): Record<string, HistoryScoreRecord> {
  return readJson(scoped(kvKeys.historyScores, userId), {});
}

export function markJobSeen(userId: string, jobId: string): void {
  const key = scoped(kvKeys.seenJobIds, userId);
  const seen = new Set(readJson<string[]>(key, []));
  seen.add(jobId);
  kv.set(key, JSON.stringify([...seen]));
}

export function readSeenJobIds(userId: string): Set<string> {
  return new Set(readJson<string[]>(scoped(kvKeys.seenJobIds, userId), []));
}

export function cacheHistoryJobs(userId: string, jobs: unknown): void {
  kv.set(scoped(kvKeys.historyJobs, userId), JSON.stringify(jobs));
}

export function readCachedHistoryJobs<T>(userId: string, fallback: T): T {
  return readJson(scoped(kvKeys.historyJobs, userId), fallback);
}

export function cacheHistoryTimeline(userId: string, payload: unknown): void {
  kv.set(scoped(kvKeys.historyTimeline, userId), JSON.stringify(payload));
}

export function readCachedHistoryTimeline<T>(userId: string, fallback: T): T {
  return readJson(scoped(kvKeys.historyTimeline, userId), fallback);
}

export function purgeHistoryCache(userId: string): void {
  kv.delete(scoped(kvKeys.historyJobs, userId));
  kv.delete(scoped(kvKeys.historyTimeline, userId));
  kv.delete(scoped(kvKeys.historyScores, userId));
  kv.delete(scoped(kvKeys.seenJobIds, userId));
}
