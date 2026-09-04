import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const jobStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);

export const readinessSchema = z.enum(["usable", "limited", "insufficient"]);

export const engineLandedSchema = z.enum(["yes", "no", "unclear"]);

export const attemptOutcomeSchema = z.enum(["landed", "missed"]);

export const mechanicsDimensionSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(10).nullable().optional(),
  assessment: nullableString,
  evidence: nullableString,
});

export const qualitySignalsSchema = z
  .object({
    video_readable: z.boolean().nullable().optional(),
    motion_detected: z.boolean().nullable().optional(),
    mechanics_dimensions: z.array(mechanicsDimensionSchema).optional(),
  })
  .passthrough();

export const normalizedReviewSchema = z
  .object({
    score: z.number().int().min(0).max(10).nullable().optional(),
    model: z.string().nullable().optional(),
  })
  .passthrough();

export const clipResultSchema = z
  .object({
    review_readiness: readinessSchema.nullable().optional(),
    landed: engineLandedSchema.nullable().optional(),
    land_score: z.number().min(0).max(10).nullable().optional(),
    review_summary: nullableString,
    clip_label: nullableString,
    uncertainty_notes: z.array(z.string()).optional(),
    processing_notes: z.array(z.string()).optional(),
    primary_issue_label: nullableString,
    best_cue: nullableString,
    quality_signals: qualitySignalsSchema.optional(),
    video_playback_url: nullableString,
    thumbnail_url: nullableString,
    normalized_review: normalizedReviewSchema.nullable().optional(),
  })
  .passthrough();

export const clipJobSchema = z
  .object({
    job_id: z.string().min(1),
    status: jobStatusSchema,
    failure_reason: nullableString,
    result: clipResultSchema.nullable().optional(),
  })
  .passthrough();

export const sessionSchema = z
  .object({
    id: z.string().min(1),
    started_at: z.string().min(1),
    ended_at: z.string().nullable().optional(),
    spot_label: nullableString,
    focus_trick: nullableString,
  })
  .passthrough();

export const attemptSchema = z.object({
  id: z.string().min(1).max(80),
  session_id: z.string().min(1),
  trick_id: z.string().min(1),
  canonical_name: z.string().min(1),
  outcome: attemptOutcomeSchema,
  logged_at: z.string().min(1),
});

export const trickSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  difficulty_tier: z.number().int(),
  rotation: z.string().nullable().optional(),
});

export const trickListSchema = z.object({
  tricks: z.array(trickSchema),
});

export const accountMeSchema = z
  .object({
    user_id: z.string().min(1),
    email: nullableString,
    tier: z.string().min(1),
  })
  .passthrough();

export const appleAuthSchema = z.object({
  token: z.string().min(1),
  user_id: z.string().min(1),
  is_new_user: z.boolean().optional(),
});

export const jobListItemSchema = z
  .object({
    job_id: z.string().min(1),
    status: jobStatusSchema,
    clip_label: z.string(),
    updated_at: z.string().min(1),
    failure_reason: nullableString,
    video_playback_url: nullableString,
    thumbnail_url: nullableString,
  })
  .passthrough();

export const timelineItemSchema = z
  .object({
    session_id: z.string().min(1),
    ended_at: nullableString,
    spot: nullableString,
    focus_trick: nullableString,
    duration_seconds: z.number().int().nullable().optional(),
    clips_count: z.number().int().optional(),
    attempt_count: z.number().int().optional(),
    best_pte_score: z.number().nullable().optional(),
    thumbnail_url: nullableString,
  })
  .passthrough();

export const timelineSchema = z.object({
  items: z.array(timelineItemSchema).default([]),
  page: z.number().int(),
  page_size: z.number().int(),
  has_more: z.boolean(),
});

export const quotaSchema = z
  .object({
    tier: z.string().min(1),
    analyses_remaining: z.number().int(),
    trial_expires_at: nullableString,
    subscription_status: z.string().min(1),
    bonus_analyses: z.number().int(),
    monthly_free_remaining: z.number().int().nullable().optional(),
  })
  .passthrough();

export const billingSyncSchema = z
  .object({
    tier: z.string().min(1),
    bonus_analyses: z.number().int(),
    monthly_free_remaining: z.number().int().nullable(),
  })
  .passthrough();
