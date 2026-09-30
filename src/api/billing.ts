import { z } from "zod";
import { apiRequest } from "./client";
import type { ApiResult } from "./types";
import { fail, ok } from "./types";

const billingSyncSchema = z.object({
  tier: z.string().min(1),
  bonus_analyses: z.number().int().min(0),
  monthly_free_remaining: z.number().int().min(0).nullable(),
});

export type BillingSync = z.infer<typeof billingSyncSchema>;

export async function syncBillingState(input: {
  hasPro: boolean;
  rcAppUserId: string;
}): Promise<ApiResult<BillingSync>> {
  const res = await apiRequest<unknown>("/api/v1/billing/sync", {
    method: "POST",
    json: {
      has_pro: input.hasPro,
      rc_app_user_id: input.rcAppUserId,
    },
  });
  if (!res.ok) return res;
  const parsed = billingSyncSchema.safeParse(res.data);
  return parsed.success ? ok(parsed.data) : fail({ kind: "contract" });
}
