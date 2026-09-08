import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsExecutionEvent } from './types'

function fromRow(raw: unknown): CommsExecutionEvent {
  const row = raw as {
    id: string
    content_item_id: string
    action: string
    previous_status: string | null
    new_status: string | null
    actor: string
    note: unknown
    timestamp: string
  }
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    action: row.action as CommsExecutionEvent['action'],
    previousStatus: (row.previous_status as CommsExecutionEvent['previousStatus']) ?? undefined,
    newStatus: (row.new_status as CommsExecutionEvent['newStatus']) ?? undefined,
    actor: row.actor,
    note: row.note as Bi | undefined,
    timestamp: row.timestamp,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsExecutionEvent, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    content_item_id: item.contentItemId,
    action: item.action,
    previous_status: item.previousStatus ?? null,
    new_status: item.newStatus ?? null,
    actor: item.actor,
    note: item.note ?? null,
    timestamp: item.timestamp,
  }
}

export async function listExecutionEvents(workspaceOrgId: string): Promise<CommsExecutionEvent[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_execution_events')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('timestamp', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addExecutionEvent(
  workspaceOrgId: string,
  item: Omit<CommsExecutionEvent, 'id'>,
): Promise<CommsExecutionEvent> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_execution_events')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}
