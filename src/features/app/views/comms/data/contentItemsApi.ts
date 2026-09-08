import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsContentItem, CommsExecutionAction } from './types'

function fromRow(raw: unknown): CommsContentItem {
  const row = raw as {
    id: string
    initiative_id: string
    title: unknown
    language: string
    channel: string
    status: string
    delivery_status: string
    body: unknown
    revision_note: unknown
    due_date: string | null
    scheduled_for: string | null
    time_zone: string | null
    owner: string
    source_revision_id: string | null
    needs_translation_review: boolean | null
    delivery_note: unknown
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id,
    title: (row.title as Bi | undefined) ?? { en: '', fr: '' },
    language: row.language as 'en' | 'fr' | 'bilingual',
    channel: row.channel as CommsContentItem['channel'],
    status: row.status as CommsContentItem['status'],
    deliveryStatus: row.delivery_status as CommsContentItem['deliveryStatus'],
    body: row.body as Bi | undefined,
    revisionNote: row.revision_note as Bi | undefined,
    dueDate: row.due_date ?? undefined,
    scheduledFor: row.scheduled_for ?? undefined,
    timeZone: row.time_zone ?? undefined,
    owner: row.owner,
    sourceRevisionId: row.source_revision_id ?? undefined,
    needsTranslationReview: row.needs_translation_review ?? undefined,
    deliveryNote: row.delivery_note as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsContentItem, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId,
    title: item.title as unknown,
    language: item.language,
    channel: item.channel,
    status: item.status,
    delivery_status: item.deliveryStatus,
    body: item.body ?? null,
    revision_note: item.revisionNote ?? null,
    due_date: item.dueDate ?? null,
    scheduled_for: item.scheduledFor ?? null,
    time_zone: item.timeZone ?? null,
    owner: item.owner,
    source_revision_id: item.sourceRevisionId ?? null,
    needs_translation_review: item.needsTranslationReview ?? null,
    delivery_note: item.deliveryNote ?? null,
  }
}

function patchToRow(patch: Partial<CommsContentItem>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId
  if (patch.title !== undefined) row.title = patch.title as unknown
  if (patch.language !== undefined) row.language = patch.language
  if (patch.channel !== undefined) row.channel = patch.channel
  if (patch.status !== undefined) row.status = patch.status
  if (patch.deliveryStatus !== undefined) row.delivery_status = patch.deliveryStatus
  if (patch.body !== undefined) row.body = patch.body ?? null
  if (patch.revisionNote !== undefined) row.revision_note = patch.revisionNote ?? null
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate ?? null
  if (patch.scheduledFor !== undefined) row.scheduled_for = patch.scheduledFor ?? null
  if (patch.timeZone !== undefined) row.time_zone = patch.timeZone ?? null
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.sourceRevisionId !== undefined) row.source_revision_id = patch.sourceRevisionId ?? null
  if (patch.needsTranslationReview !== undefined)
    row.needs_translation_review = patch.needsTranslationReview ?? null
  if (patch.deliveryNote !== undefined) row.delivery_note = patch.deliveryNote ?? null
  return row
}

function actionToDeliveryStatus(
  action: CommsExecutionAction,
  current: CommsContentItem['deliveryStatus'],
): { deliveryStatus: CommsContentItem['deliveryStatus']; extra?: Partial<CommsContentItem> } {
  switch (action) {
    case 'schedule':
      return { deliveryStatus: 'scheduled' }
    case 'unschedule':
      return { deliveryStatus: current === 'scheduled' ? 'ready' : current, extra: { scheduledFor: undefined, timeZone: undefined } }
    case 'pause':
      return { deliveryStatus: 'paused' }
    case 'resume':
      return { deliveryStatus: 'ready' }
    case 'mark_sent':
      return { deliveryStatus: 'confirmed' }
    case 'mark_failed':
      return { deliveryStatus: 'failed' }
    case 'retry':
      return { deliveryStatus: 'sending' }
    case 'reconcile':
      return { deliveryStatus: 'ready' }
    case 'cancel':
      return { deliveryStatus: 'cancelled' }
    default:
      return { deliveryStatus: current }
  }
}

export async function listContentItems(workspaceOrgId: string): Promise<CommsContentItem[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_content_items')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addContentItem(
  workspaceOrgId: string,
  item: Omit<CommsContentItem, 'id'>,
): Promise<CommsContentItem> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_content_items')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateContentItem(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsContentItem>,
): Promise<CommsContentItem | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_content_items')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeContentItem(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_content_items')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}

export async function transitionDeliveryStatus(
  workspaceOrgId: string,
  id: string,
  action: CommsExecutionAction,
  note?: Bi,
): Promise<CommsContentItem | null> {
  const current = await listContentItems(workspaceOrgId).then((items) =>
    items.find((c) => c.id === id),
  )
  if (!current) return null
  const { deliveryStatus, extra } = actionToDeliveryStatus(action, current.deliveryStatus)
  const patch: Partial<CommsContentItem> = { deliveryStatus, ...extra }
  if (note) patch.deliveryNote = note
  return updateContentItem(workspaceOrgId, id, patch)
}
