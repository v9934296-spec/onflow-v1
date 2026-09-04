import { mintClipId, mintJobId } from "./ids";
import type { AnalysisResult, JobStatus, MechanicsRow, Readiness } from "../models";
import { mapScore, scoreForDisplay } from "./score";

/** Validated wire shape. Constructed only after runtime schema checks in api/. */
export interface ClipJobInput {
  job_id: string;
  status: JobStatus;
  failure_reason?: string | null;
  result?: {
    review_readiness?: string | null;
    landed?: "yes" | "no" | "unclear" | null;
    land_score?: number | null;
    review_summary?: string | null;
    clip_label?: string | null;
    uncertainty_notes?: string[];
    processing_notes?: string[];
    primary_issue_label?: string | null;
    best_cue?: string | null;
    quality_signals?: {
      video_readable?: boolean | null;
      motion_detected?: boolean | null;
      mechanics_dimensions?: Array<{
        name: string;
        score?: number | null;
        assessment?: string | null;
        evidence?: string | null;
      }>;
    };
    video_playback_url?: string | null;
    thumbnail_url?: string | null;
    normalized_review?: {
      score?: number | null;
      model?: string | null;
    } | null;
  } | null;
}

export function mapReadiness(raw: string | null | undefined): Readiness | null {
  if (raw === "usable" || raw === "limited" || raw === "insufficient") return raw;
  return null;
}

export function mapClipJob(job: ClipJobInput): AnalysisResult {
  const result = job.result ?? null;
  const quality = result?.quality_signals;
  const readiness = mapReadiness(result?.review_readiness ?? null);
  const rawScore = result?.normalized_review?.score ?? result?.land_score ?? null;
  const score = scoreForDisplay(readiness, mapScore(rawScore ?? null));

  const mechanics: MechanicsRow[] = [];
  for (const row of quality?.mechanics_dimensions ?? []) {
    mechanics.push({
      name: row.name,
      score: mapScore(row.score ?? null),
      assessment: row.assessment ?? null,
      evidence: row.evidence ?? null,
    });
  }

  const videoReadable = quality?.video_readable ?? null;
  const motionDetected = quality?.motion_detected ?? null;
  const unreadable = videoReadable === false || motionDetected === false;
  const gatedMechanics = unreadable ? [] : mechanics;
  const gatedScore = unreadable ? null : score;

  return {
    clipId: mintClipId(job.job_id),
    jobId: mintJobId(job.job_id),
    status: job.status,
    readiness,
    score: gatedScore,
    engineLanded: result?.landed ?? null,
    calledTrick: result?.clip_label ?? null,
    reviewSummary: unreadable ? null : (result?.review_summary ?? null),
    uncertaintyNotes: unreadable ? [] : (result?.uncertainty_notes ?? []),
    processingNotes: unreadable ? [] : (result?.processing_notes ?? []),
    primaryIssueLabel: unreadable ? null : (result?.primary_issue_label ?? null),
    bestCue: unreadable ? null : (result?.best_cue ?? null),
    quality: { videoReadable, motionDetected },
    mechanics: gatedMechanics,
    videoPlaybackUrl: result?.video_playback_url ?? null,
    thumbnailUrl: result?.thumbnail_url ?? null,
    providerModel: result?.normalized_review?.model ?? null,
    failureReason: job.failure_reason ?? null,
  };
}
