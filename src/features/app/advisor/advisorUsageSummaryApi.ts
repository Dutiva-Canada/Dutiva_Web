import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Org-pooled Advisor usage snapshot from `advisor_usage_summary` (migration 0109).
 * Safe to call while feature gates are off — read-only; fails soft when the RPC
 * is not yet applied (`npm run db:types` after migrations land).
 */

const summarySchema = z.object({
  organization_id: z.string().uuid(),
  plan: z.string(),
  monthly_limit: z.number().int(),
  monthly_used: z.number().int(),
  monthly_remaining: z.number().int(),
  rollover_balance: z.number().int(),
  nearest_rollover_expiry: z.string().nullable(),
  pack_balance: z.number().int(),
  overage_enabled: z.boolean(),
  overage_used: z.number().int().optional(),
  overage_cap: z.number().int().optional(),
  next_reset_at: z.string(),
  consumption_order: z.array(z.string()).optional(),
})

export type AdvisorUsageSummary = {
  organizationId: string
  plan: string
  monthlyLimit: number
  monthlyUsed: number
  monthlyRemaining: number
  rolloverBalance: number
  nearestRolloverExpiry: string | null
  packBalance: number
  overageEnabled: boolean
  overageUsed: number
  overageCap: number
  nextResetAt: string
}

type UntypedRpc = {
  rpc(
    fn: 'advisor_usage_summary',
    args: { p_organization_id: string },
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export async function fetchAdvisorUsageSummary(
  organizationId: string,
): Promise<AdvisorUsageSummary | null> {
  if (!supabase || !organizationId) return null
  try {
    /* RPC not in database.types.ts until migrations apply + `npm run db:types`. */
    const { data, error } = await (supabase as unknown as UntypedRpc).rpc('advisor_usage_summary', {
      p_organization_id: organizationId,
    })
    if (error || data == null) return null
    const parsed = summarySchema.safeParse(data)
    if (!parsed.success) return null
    const row = parsed.data
    return {
      organizationId: row.organization_id,
      plan: row.plan,
      monthlyLimit: row.monthly_limit,
      monthlyUsed: row.monthly_used,
      monthlyRemaining: row.monthly_remaining,
      rolloverBalance: row.rollover_balance,
      nearestRolloverExpiry: row.nearest_rollover_expiry,
      packBalance: row.pack_balance,
      overageEnabled: row.overage_enabled,
      overageUsed: row.overage_used ?? 0,
      overageCap: row.overage_cap ?? 500,
      nextResetAt: row.next_reset_at,
    }
  } catch {
    return null
  }
}
