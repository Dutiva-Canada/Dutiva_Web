import { z } from 'zod'
import { bi, type Bi } from '@/i18n/core'
import { supabase } from '@/lib/supabaseClient'

/**
 * Production in-app notifications for org admins (signing complete/decline).
 * Demo mode continues to use fixture data in the Topbar.
 */

export interface WorkspaceNotification {
  id: string
  kind: 'signing_completed' | 'signing_declined'
  title: Bi
  body: Bi | null
  href: string | null
  documentId: string | null
  unread: boolean
  createdAt: string
}

const rowSchema = z.object({
  id: z.string(),
  kind: z.enum(['signing_completed', 'signing_declined']),
  title_en: z.string(),
  title_fr: z.string(),
  body_en: z.string().nullable().optional(),
  body_fr: z.string().nullable().optional(),
  href: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
  read_at: z.string().nullable().optional(),
  created_at: z.string(),
})

function formatRelativeTime(iso: string, now = Date.now()): Bi {
  const ms = Math.max(0, now - new Date(iso).getTime())
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return bi('Just now', 'À l’instant')
  if (minutes < 60) {
    return bi(`${minutes}m ago`, `Il y a ${minutes} min`)
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return bi(`${hours}h ago`, `Il y a ${hours} h`)
  }
  const days = Math.floor(hours / 24)
  if (days === 1) return bi('Yesterday', 'Hier')
  return bi(`${days} days ago`, `Il y a ${days} jours`)
}

export function relativeTimeLabel(iso: string, now = Date.now()): Bi {
  return formatRelativeTime(iso, now)
}

export async function listWorkspaceNotifications(limit = 30): Promise<WorkspaceNotification[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_workspace_notifications')
    .select(
      'id, kind, title_en, title_fr, body_en, body_fr, href, document_id, read_at, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((raw) => {
    const row = rowSchema.parse(raw)
    return {
      id: row.id,
      kind: row.kind,
      title: bi(row.title_en, row.title_fr),
      body:
        row.body_en || row.body_fr
          ? bi(row.body_en ?? row.body_fr ?? '', row.body_fr ?? row.body_en ?? '')
          : null,
      href: row.href ?? null,
      documentId: row.document_id ?? null,
      unread: !row.read_at,
      createdAt: row.created_at,
    }
  })
}

export async function markWorkspaceNotificationRead(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.rpc('mark_hr_workspace_notification_read', {
    p_id: id,
  })
  if (error) throw error
}

export async function markAllWorkspaceNotificationsRead(): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.rpc('mark_all_hr_workspace_notifications_read')
  if (error) throw error
}
