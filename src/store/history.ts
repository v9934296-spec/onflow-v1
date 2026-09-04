import { fetchClipJobs, fetchProgressionTimeline, fetchSessionAttempts } from "../api/endpoints";
import { listOutboxForUser } from "./outbox";
import {
  cacheHistoryJobs,
  cacheHistoryTimeline,
  readCachedHistoryJobs,
  readCachedHistoryTimeline,
  readHistoryScores,
  readSeenJobIds,
} from "./historyCache";
import { listLocalAttempts } from "./attempts";
import { isOffline } from "./net";
import { mapTimelineSession, mergeHistoryClips, type HistoryClipItem, type HistorySessionItem } from "../domain/history";
import type { Attempt } from "../domain/models";

type JobListItem = {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  clip_label: string;
  updated_at: string;
  thumbnail_url?: string | null;
};

export async function loadHistory(userId: string): Promise<{
  clips: HistoryClipItem[];
  sessions: HistorySessionItem[];
  attempts: Attempt[];
  offline: boolean;
}> {
  const offline = isOffline();
  const outbox = await listOutboxForUser(userId);
  const jobsRes = offline ? ({ ok: false } as const) : await fetchClipJobs();
  const jobs: JobListItem[] = jobsRes.ok ? jobsRes.data : readCachedHistoryJobs<JobListItem[]>(userId, []);
  if (jobsRes.ok) cacheHistoryJobs(userId, jobsRes.data);

  const clips = mergeHistoryClips({
    jobs,
    outbox,
    scores: readHistoryScores(userId),
    seenJobIds: readSeenJobIds(userId),
  });

  const timelineRes = offline ? ({ ok: false } as const) : await fetchProgressionTimeline(1);
  let sessions: HistorySessionItem[] = [];
  if (timelineRes.ok) {
    cacheHistoryTimeline(userId, timelineRes.data);
    sessions = timelineRes.data.items.map(mapTimelineSession);
  } else {
    const cached = readCachedHistoryTimeline<{ items?: Array<Parameters<typeof mapTimelineSession>[0]> }>(userId, {
      items: [],
    });
    sessions = (cached.items ?? []).map(mapTimelineSession);
  }

  return { clips, sessions, attempts: listLocalAttempts(userId), offline };
}

export async function loadSessionAttemptList(sessionId: string): Promise<Attempt[]> {
  const res = await fetchSessionAttempts(sessionId);
  return res.ok ? res.data : [];
}
