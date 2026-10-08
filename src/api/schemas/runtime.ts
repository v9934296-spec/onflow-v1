import { z } from "zod";
import {
  AGE_RANGES,
  EXPERIENCE_LEVELS,
  NATURAL_STANCES,
  SKATE_STYLES,
} from "../../domain/skaterProfile";

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

export const clipInitiateUploadSchema = z.object({
  clip_id: z.string().min(1),
  upload_url: z.string().min(1),
  upload_method: z.literal("PUT").optional(),
  upload_expires_at: z.string().min(1),
  storage_key: z.string().min(1),
});

export const sessionAttemptSyncSchema = z.object({
  accepted: z.array(z.string()),
  rejected: z.array(
    z.object({
      id: z.string().min(1),
      reason: z.string().min(1),
    }),
  ),
});

export const sessionAttemptsResponseSchema = z.object({
  attempts: z.array(z.unknown()),
});

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

/**
 * Skater profile. Enums are strict: an unsupported server value is a contract
 * failure, never a silently substituted preference.
 */
export const skaterProfileSchema = z
  .object({
    natural_stance: z.enum(NATURAL_STANCES).nullable().optional(),
    skate_styles: z.array(z.enum(SKATE_STYLES)).optional(),
    primary_skate_style: z.enum(SKATE_STYLES).nullable().optional(),
    experience_level: z.enum(EXPERIENCE_LEVELS).nullable().optional(),
    age_range: z.enum(AGE_RANGES).nullable().optional(),
    city: nullableString,
    home_park: nullableString,
    favorite_brands: z.array(z.string()).optional(),
    onboarding_completed_at: nullableString,
  })
  .passthrough();

/** `GET` returns `null` before a profile exists. */
export const skaterProfileResponseSchema = skaterProfileSchema.nullable();

export const appleAuthSchema = z.object({
  token: z.string().min(1),
  user_id: z.string().min(1),
  is_new_user: z.boolean().optional(),
});
