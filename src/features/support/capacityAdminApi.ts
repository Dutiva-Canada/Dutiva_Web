import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

export interface CapacityStatus {
  current: number
  limit: number
  remaining: number | null
  isAtCapacity: boolean
  enforcementEnabled: boolean
  mode: 'unlimited' | 'capped' | 'waitlist'
  utilization: number
  thresholdStatus: string
  waitlistCount: number
}

const statusSchema = z.object({
  current: z.number().int(),
  limit: z.number().int(),
  remaining: z.number().int().nullable(),
  is_at_capacity: z.boolean(),
  enforcement_enabled: z.boolean(),
  mode: z.enum(['unlimited', 'capped', 'waitlist']),
  utilization: z.number(),
  threshold_status: z.string(),
  waitlist_count: z.number().int(),
})

export async function getCapacityStatus(): Promise<CapacityStatus | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.rpc('get_organization_capacity_status')
    if (error || !data) return null
    const parsed = statusSchema.parse(data)
    return {
      current: parsed.current,
      limit: parsed.limit,
      remaining: parsed.remaining,
      isAtCapacity: parsed.is_at_capacity,
      enforcementEnabled: parsed.enforcement_enabled,
      mode: parsed.mode,
      utilization: parsed.utilization,
      thresholdStatus: parsed.threshold_status,
      waitlistCount: parsed.waitlist_count,
    }
  } catch (e) {
    console.error('capacity status failed', e)
    return null
  }
}

export async function updateCapacityConfig(values: {
  limit: number
  enforcementEnabled: boolean
  mode: 'unlimited' | 'capped' | 'waitlist'
}): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.rpc('update_capacity_config', {
      p_capacity_limit: values.limit,
      p_capacity_enforcement_enabled: values.enforcementEnabled,
      p_capacity_mode: values.mode,
    })
    return !error
  } catch {
    return false
  }
}
