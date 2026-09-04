import { describe, expect, it } from "vitest";
import { unsafeBrand } from "../types/brand";
import type { Score } from "../models";
import {
  groupScoredClipsByTrick,
  mapTimelineSession,
  mergeHistoryClips,
} from "../history";
import { mintAttemptId, mintSessionId, mintTrickId } from "../mappers/ids";
import { groupHistoryTricks } from "../history";

describe("history relationships and comparability", () => {
  it("drops best_pte_score from the session view model", () => {
    const session = mapTimelineSession({
      session_id: "s1",
      ended_at: "2026-09-01T12:00:00Z",
      focus_trick: "Kickflip",
      clips_count: 2,
      attempt_count: 3,
      best_pte_score: 9.4,
    });
    expect(session).toEqual({
      sessionId: "s1",
      endedAt: "2026-09-01T12:00:00Z",
      focusTrick: "Kickflip",
      clipsCount: 2,
      attemptCount: 3,
    });
    expect(session).not.toHaveProperty("best");
    expect(JSON.stringify(session)).not.toContain("9.4");
  });

  it("joins server jobs to local outbox rows by clip id, newest first", () => {
    const clips = mergeHistoryClips({
      jobs: [
        {
          job_id: "job-2",
          status: "completed",
          clip_label: "Heelflip",
          updated_at: "2026-09-02T00:00:00Z",
        },
        {
          job_id: "job-1",
          status: "processing",
          clip_label: "Kickflip",
          updated_at: "2026-09-01T00:00:00Z",
        },
      ],
      outbox: [
        {
          localId: "local-1",
          clipId: "job-1",
          sessionId: "sess-1",
          state: "analyzing",
          durationSeconds: 8,
          capturedAt: "2026-09-01T00:00:00Z",
          mediaKind: "recorded",
        },
      ],
      scores: {
        "job-2": {
          jobId: "job-2",
          score: unsafeBrand<Score>(7),
          providerModel: "gemini",
          readiness: "usable",
        },
      },
      seenJobIds: new Set(),
    });
    expect(clips.map((row) => row.jobId)).toEqual(["job-2", "job-1"]);
    expect(clips[0]?.score).toBe(7);
    expect(clips[0]?.unread).toBe(true);
    expect(clips[1]?.localId).toBe("local-1");
    expect(clips[1]?.sessionId).toBe("sess-1");
    expect(clips[1]?.unread).toBe(false);
  });

  it("titles local-only clips as Clip, not the media kind", () => {
    const clips = mergeHistoryClips({
      jobs: [],
      outbox: [
        {
          localId: "local-2",
          clipId: null,
          sessionId: "sess-1",
          state: "pending",
          durationSeconds: 4,
          capturedAt: "2026-09-03T00:00:00Z",
          mediaKind: "recorded",
        },
      ],
      scores: {},
      seenJobIds: new Set(),
    });
    expect(clips).toHaveLength(1);
    expect(clips[0]?.label).toBe("Clip");
    expect(clips[0]?.label).not.toBe("recorded");
  });

  it("lists gemini and pegasus scores as separate rows and never averages them", () => {
    const groups = groupScoredClipsByTrick([
      {
        key: "a",
        jobId: "a",
        localId: null,
        clipId: "a",
        sessionId: null,
        label: "Kickflip",
        state: "ready",
        updatedAt: "2026-09-02T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: unsafeBrand<Score>(8),
        providerModel: "gemini",
        unread: false,
      },
      {
        key: "b",
        jobId: "b",
        localId: null,
        clipId: "b",
        sessionId: null,
        label: "Kickflip",
        state: "ready",
        updatedAt: "2026-09-01T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: unsafeBrand<Score>(4),
        providerModel: "pegasus",
        unread: false,
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.rows.map((row) => ({ score: row.score, provider: row.providerModel }))).toEqual([
      { score: 8, provider: "gemini" },
      { score: 4, provider: "pegasus" },
    ]);
    expect(groups[0] && "average" in groups[0]).toBe(false);
    expect(groups[0] && "best" in groups[0]).toBe(false);
    expect(groups[0]?.rows.map((row) => row.score)).toEqual([8, 4]);
  });

  it("skips clips with no score and lists remaining rows newest first", () => {
    const groups = groupScoredClipsByTrick([
      {
        key: "old",
        jobId: "old",
        localId: null,
        clipId: "old",
        sessionId: null,
        label: "Kickflip",
        state: "ready",
        updatedAt: "2026-09-01T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: unsafeBrand<Score>(3),
        providerModel: "gemini",
        unread: false,
      },
      {
        key: "none",
        jobId: "none",
        localId: null,
        clipId: "none",
        sessionId: null,
        label: "Kickflip",
        state: "analyzing",
        updatedAt: "2026-09-03T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: null,
        providerModel: null,
        unread: false,
      },
      {
        key: "new",
        jobId: "new",
        localId: null,
        clipId: "new",
        sessionId: null,
        label: "Kickflip",
        state: "ready",
        updatedAt: "2026-09-02T00:00:00Z",
        durationSeconds: null,
        thumbnailUrl: null,
        score: unsafeBrand<Score>(9),
        providerModel: "pegasus",
        unread: false,
      },
    ]);
    expect(groups[0]?.rows.map((row) => row.id)).toEqual(["new", "old"]);
    expect(groups[0]?.rows.every((row) => row.score != null)).toBe(true);
  });

  it("keeps manual outcomes as the attempt record without folding in engine scores", () => {
    const groups = groupHistoryTricks(
      [
        {
          id: mintAttemptId("att-1"),
          sessionId: mintSessionId("s1"),
          trickId: mintTrickId("kickflip"),
          canonicalName: "Kickflip",
          outcome: "landed",
          loggedAt: "2026-09-01T12:00:00Z",
        },
      ],
      [],
    );
    expect(groups[0]?.rows[0]?.outcome).toBe("landed");
    expect(groups[0]?.rows[0]?.score).toBeNull();
  });
});
