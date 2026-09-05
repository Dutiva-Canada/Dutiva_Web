import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/**
 * Service-status board data (the /status page + the founder control). Reads are
 * public (RLS `using (true)`); writes go through the admin-gated
 * `set-service-status` edge function. When Supabase isn't configured (prerender,
 * local dev), reads fall back to an all-`operational` default so the page still
 * renders. Component / status vocab mirrors migration 0017.
 */

export type ServiceComponent = 'platform' | 'advisor' | 'documents' | 'support'
export type ServiceStatusLevel = 'operational' | 'degraded' | 'maintenance' | 'outage'

export const SERVICE_COMPONENTS: readonly { id: ServiceComponent; label: Bi }[] = [
  { id: 'platform', label: bi('Platform', 'Plateforme') },
  { id: 'advisor', label: bi('AI Advisor', 'Conseiller IA') },
  { id: 'documents', label: bi('HR documents', 'Documents RH') },
  { id: 'support', label: bi('Support', 'Soutien') },
]

export const STATUS_LEVEL_LABELS: Record<ServiceStatusLevel, Bi> = {
  operational: bi('Operational', 'Opérationnel'),
  degraded: bi('Degraded', 'Dégradé'),
  maintenance: bi('Maintenance', 'Maintenance'),
  outage: bi('Outage', 'Panne'),
}

/** CSP-safe status dot classes (pair with `.status-dot`). */
export const STATUS_DOT_CLASS: Record<ServiceStatusLevel, string> = {
  operational: 'status-dot-operational',
  maintenance: 'status-dot-maintenance',
  degraded: 'status-dot-degraded',
  outage: 'status-dot-outage',
}

/** CSP-safe lucide icon tint classes. */
export const STATUS_ICON_CLASS: Record<ServiceStatusLevel, string> = {
  operational: 'status-icon-operational',
  maintenance: 'status-icon-maintenance',
  degraded: 'status-icon-degraded',
  outage: 'status-icon-outage',
}

/** Severity order for rolling up an overall status (higher = worse). */
const STATUS_SEVERITY: Record<ServiceStatusLevel, number> = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  outage: 3,
}

export interface ServiceStatusRow {
  component: ServiceComponent
  status: ServiceStatusLevel
  message: string | null
  updatedAt: string
}

const rowSchema = z.object({
  component: z.enum(['platform', 'advisor', 'documents', 'support']),
  status: z.enum(['operational', 'degraded', 'maintenance', 'outage']),
  message: z.string().nullable(),
  updated_at: z.string(),
})

function defaults(): ServiceStatusRow[] {
  return SERVICE_COMPONENTS.map((c) => ({
    component: c.id,
    status: 'operational',
    message: null,
    updatedAt: '',
  }))
}

/** All four components in canonical order, filling gaps with `operational`. */
export async function getServiceStatus(): Promise<ServiceStatusRow[]> {
  if (!supabase) return defaults()
  const { data, error } = await supabase
    .from('service_status')
    .select('component, status, message, updated_at')
  if (error || !data) return defaults()
  const rows = z.array(rowSchema).parse(data)
  return SERVICE_COMPONENTS.map((c) => {
    const row = rows.find((r) => r.component === c.id)
    return row
      ? {
          component: row.component,
          status: row.status,
          message: row.message,
          updatedAt: row.updated_at,
        }
      : { component: c.id, status: 'operational' as const, message: null, updatedAt: '' }
  })
}

/** Worst component status — drives the overall banner. */
export function overallStatus(rows: ServiceStatusRow[]): ServiceStatusLevel {
  return rows.reduce<ServiceStatusLevel>(
    (worst, r) => (STATUS_SEVERITY[r.status] > STATUS_SEVERITY[worst] ? r.status : worst),
    'operational',
  )
}

export async function setServiceStatus(
  component: ServiceComponent,
  status: ServiceStatusLevel,
  message?: string,
): Promise<void> {
  if (!supabase) throw new Error('Service status updates are not available in this environment.')
  const { error } = await supabase.functions.invoke('set-service-status', {
    body: { component, status, message: message ?? '' },
  })
  if (error) throw error
}
