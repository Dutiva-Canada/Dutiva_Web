import { supabase } from '@/lib/supabaseClient'
import type { CommsUsageControls } from './types'

function fromRow(raw: unknown): CommsUsageControls {
  const row = raw as {
    monthly_content_budget: number | null
    monthly_interaction_budget: number | null
    alert_threshold_percent: number | null
    default_review_days: number | null
    content_retention_days: number | null
  }
  return {
    monthlyContentBudget: row.monthly_content_budget ?? undefined,
    monthlyInteractionBudget: row.monthly_interaction_budget ?? undefined,
    alertThresholdPercent: row.alert_threshold_percent ?? undefined,
    defaultReviewDays: row.default_review_days ?? undefined,
    contentRetentionDays: row.content_retention_days ?? undefined,
  }
}

function toRow(item: CommsUsageControls) {
  return {
    monthly_content_budget: item.monthlyContentBudget ?? null,
    monthly_interaction_budget: item.monthlyInteractionBudget ?? null,
    alert_threshold_percent: item.alertThresholdPercent ?? null,
    default_review_days: item.defaultReviewDays ?? null,
    content_retention_days: item.contentRetentionDays ?? null,
  }
}

export async function getUsageControls(workspaceOrgId: string): Promise<CommsUsageControls | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_usage_controls')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data ? fromRow(data) : null
}

export async function updateUsageControls(
  workspaceOrgId: string,
  item: CommsUsageControls,
): Promise<CommsUsageControls> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_usage_controls')
    .upsert({ organization_id: workspaceOrgId, ...toRow(item) } as any, { onConflict: 'organization_id' })
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}
