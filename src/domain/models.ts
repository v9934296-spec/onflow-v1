import type { Brand } from "./types/brand";
import type { AttemptId, ClipId, JobId, LocalId, SessionId, TrickId, UserId } from "./types/ids";

export type Readiness = "usable" | "limited" | "insufficient";

/** Engine opinion about whether the trick landed. Distinct from the skater's outcome. */
export type EngineLanded = "yes" | "no" | "unclear";

/** Skater-reported outcome. Two values, never a third. */
export type AttemptOutcome = "landed" | "missed";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type OutboxState =
  | "pending"
  | "presigning"
  | "uploading"
  | "uploaded"
  | "requesting_analysis"
  | "analyzing"
  | "ready"
  | "failed_retryable"
  | "failed_permanent"
  | "cancelled";

/** 0–10 integer. Absent means the engine abstained — never coerce to 0. */
export type Score = Brand<number, "Score">;

export interface QualitySignals {
  readonly videoReadable: boolean | null;
  readonly motionDetected: boolean | null;
}

export interface MechanicsRow {
  readonly name: string;
  readonly score: Score | null;
  readonly assessment: string | null;
  readonly evidence: string | null;
}

export interface AnalysisResult {
  readonly clipId: ClipId;
  readonly jobId: JobId;
  readonly status: JobStatus;
  readonly readiness: Readiness | null;
  readonly score: Score | null;
  readonly engineLanded: EngineLanded | null;
  readonly calledTrick: string | null;
  readonly reviewSummary: string | null;
  readonly uncertaintyNotes: readonly string[];
  readonly processingNotes: readonly string[];
  readonly primaryIssueLabel: string | null;
  readonly bestCue: string | null;
  readonly quality: QualitySignals;
  readonly mechanics: readonly MechanicsRow[];
  readonly videoPlaybackUrl: string | null;
  readonly thumbnailUrl: string | null;
  readonly providerModel: string | null;
  readonly failureReason: string | null;
}

export interface SelectedTrick {
  readonly trickId: TrickId;
  readonly canonicalName: string;
  readonly stance: string | null;
  readonly direction: string | null;
}

export interface CatalogTrick {
  readonly trickId: TrickId;
  readonly name: string;
  readonly category: string;
  readonly aliases: readonly string[];
  readonly difficultyTier: number;
}

export interface Attempt {
  readonly id: AttemptId;
  readonly sessionId: SessionId;
  readonly trickId: TrickId;
  readonly canonicalName: string;
  readonly outcome: AttemptOutcome;
  readonly loggedAt: string;
}

export interface SkateSession {
  readonly id: SessionId;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly spotLabel: string | null;
  readonly focusTrick: string | null;
}

export interface Account {
  readonly userId: UserId;
  readonly email: string | null;
  readonly tier: string;
}

export interface OutboxRow {
  readonly schemaVersion: 1;
  readonly localId: LocalId;
  readonly ownerUserId: UserId;
  readonly clipId: ClipId | null;
  readonly sessionId: SessionId | null;
  readonly state: OutboxState;
  readonly mediaKind: "recorded" | "imported" | "derivative";
  readonly localUri: string;
  readonly mimeType: "video/mp4" | "video/quicktime";
  readonly durationSeconds: number;
  readonly sizeBytes: number;
  readonly capturedAt: string;
  /** Present only when the picker or a probe measured the file. Absent is not 1080. */
  readonly widthPx?: number | null;
  readonly heightPx?: number | null;
  readonly bytesUploaded: number | null;
  readonly attemptCount: number;
  readonly nextRetryAt: string | null;
  readonly errorKind: string | null;
}
