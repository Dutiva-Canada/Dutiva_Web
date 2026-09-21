import { supabase } from '@/lib/supabaseClient'
import type { ProductionCandidateStatus } from './candidates'

/* ── Funnel Metrics ─────────────────────────────────────────────────────── */

export interface ProductionFunnelMetrics {
  totalApplications: number
  basicQualified: number
  evidenceQualified: number
  workSamples: number
  interviews: number
  hires: number
}

const STAGE_ORDER: ProductionCandidateStatus[] = [
  'application',
  'basic_qualified',
  'evidence_qualified',
  'work_sample',
  'interview',
  'hired',
]

export async function getFunnelMetrics(organizationId: string): Promise<ProductionFunnelMetrics> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data: candidates, error } = await client
    .from('hr_candidates')
    .select('status')
    .eq('organization_id', organizationId)
  if (error) throw error
  const active = (candidates ?? []).filter(
    (c): c is { status: ProductionCandidateStatus } =>
      !!c.status &&
      c.status !== 'rejected' &&
      STAGE_ORDER.includes(c.status as ProductionCandidateStatus),
  )
  return {
    totalApplications: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 0).length,
    basicQualified: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 1).length,
    evidenceQualified: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 2).length,
    workSamples: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 3).length,
    interviews: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 4).length,
    hires: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 5).length,
  }
}
