import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsMetric } from './types'

function fromRow(raw: unknown): CommsMetric {
  const row = raw as {
    id: string
    initiative_id: string
    name: unknown
    period: unknown
    value: number | null
    baseline: number | null
    target: number | null
    provenance: string
    owner: string
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id,
    name: (row.name as Bi | undefined) ?? { en: '', fr: '' },
    period: row.period as Bi | undefined,
    value: row.value ?? undefined,
    baseline: row.baseline ?? undefined,
    target: row.target ?? undefined,
    provenance: row.provenance as CommsMetric['provenance'],
    owner: row.owner,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsMetric, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId,
    name: item.name as unknown,
    period: item.period ?? null,
    value: item.value ?? null,
    baseline: item.baseline ?? null,
    target: item.target ?? null,
    provenance: item.provenance,
    owner: item.owner,
  }
}

export async function listMetrics(workspaceOrgId: string): Promise<CommsMetric[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_metrics')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addMetric(
  workspaceOrgId: string,
  item: Omit<CommsMetric, 'id'>,
): Promise<CommsMetric> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_metrics')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function removeMetric(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_metrics')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
