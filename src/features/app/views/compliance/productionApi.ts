import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Real persistence for Compliance (production mode) — the backend's own
 * public.compliance_findings table (no new schema: org-scoped, RLS lets
 * org members manage their org's findings, and the AI assessment pipeline
 * writes here too). Same boundary contract as the other productionApis:
 * zod-validated rows, throws on failure.
 *
 * The table's status vocabulary (open/accepted/in_progress/resolved/
 * dismissed) is richer than the register UI — the boundary treats
 * resolved/dismissed as closed, only ever writes 'open'/'resolved', and
 * tolerates the rest so pipeline-created findings render correctly.
 */

export type ProductionFindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

export const PRODUCTION_FINDING_SEVERITIES: readonly ProductionFindingSeverity[] = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
]

export interface ProductionFinding {
  id: string
  title: string
  description: string | null
  recommendation: string | null
  severity: ProductionFindingSeverity
  status: string
  resolved: boolean
}

interface NewFinding {
  title: string
  severity: ProductionFindingSeverity
  description: string
  recommendation: string
}

const rowSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  recommendation: z.string().nullable(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  status: z.string(),
})

const SELECT_COLUMNS = 'id, title, description, recommendation, severity, status'

function toFinding(row: z.infer<typeof rowSchema>): ProductionFinding {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    recommendation: row.recommendation,
    severity: row.severity,
    status: row.status,
    resolved: row.status === 'resolved' || row.status === 'dismissed',
  }
}

export async function listFindings(organizationId: string): Promise<ProductionFinding[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  const data = await fetchAllPages((from, to) =>
    client
      .from('compliance_findings')
      .select(SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  return z.array(rowSchema).parse(data).map(toFinding)
}

export async function addFinding(
  organizationId: string,
  fields: NewFinding,
): Promise<ProductionFinding> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('compliance_findings')
    .insert({
      organization_id: organizationId,
      title: fields.title,
      severity: fields.severity,
      description: fields.description || null,
      recommendation: fields.recommendation || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toFinding(rowSchema.parse(data))
}

/** Register toggle: resolved ⇄ open, stamping/clearing resolved_at. */
export async function setFindingResolved(id: string, resolved: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('compliance_findings')
    .update({
      status: resolved ? 'resolved' : 'open',
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function removeFinding(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('compliance_findings').delete().eq('id', id)
  if (error) throw error
}

/** Open-finding count for the nav badge — resolved and dismissed are closed. */
export async function countOpenFindings(organizationId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { count, error } = await supabase
    .from('compliance_findings')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .not('status', 'in', '(resolved,dismissed)')
  if (error) throw error
  return count ?? 0
}

/* ── Obligation register (0069, formula v3) ────────────────────────────── */

/**
 * Recurring statutory duties with an owner, a due date and an evidence
 * note — public.hr_obligations. Status is evidence-centric; "overdue" is
 * deliberately not a status but derived from due_on at read time, so it
 * can never go stale by someone forgetting to flip a flag. The score's
 * obligations component counts status 'ok' over all rows.
 */

export type ProductionObligationStatus = 'ok' | 'in_progress' | 'needs_evidence'

export const PRODUCTION_OBLIGATION_STATUSES: readonly ProductionObligationStatus[] = [
  'ok',
  'in_progress',
  'needs_evidence',
]

export interface ProductionObligation {
  id: string
  title: string
  area: string | null
  jurisdiction: string | null
  /** YYYY-MM-DD. */
  dueOn: string | null
  recurrence: string | null
  ownerName: string | null
  status: ProductionObligationStatus
  evidence: string | null
}

interface NewObligation {
  title: string
  area: string
  jurisdiction: string
  dueOn: string
  recurrence: string
  ownerName: string
  status: ProductionObligationStatus
  evidence: string
}

const obligationRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  area: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  due_on: z.string().nullable(),
  recurrence: z.string().nullable(),
  owner_name: z.string().nullable(),
  status: z.enum(['ok', 'in_progress', 'needs_evidence']),
  evidence: z.string().nullable(),
})

const OBLIGATION_COLUMNS =
  'id, title, area, jurisdiction, due_on, recurrence, owner_name, status, evidence'

function toObligation(row: z.infer<typeof obligationRowSchema>): ProductionObligation {
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    jurisdiction: row.jurisdiction,
    dueOn: row.due_on,
    recurrence: row.recurrence,
    ownerName: row.owner_name,
    status: row.status,
    evidence: row.evidence,
  }
}

export async function listObligations(organizationId: string): Promise<ProductionObligation[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  try {
    const data = await fetchAllPages((from, to) =>
      client
        .from('hr_obligations')
        .select(OBLIGATION_COLUMNS)
        .eq('organization_id', organizationId)
        .order('due_on', { ascending: true, nullsFirst: false })
        .order('id')
        .range(from, to),
    )
    return z.array(obligationRowSchema).parse(data).map(toObligation)
  } catch (err) {
    /* The app deploys ahead of migration 0069 (migrations are a manual
       owner step). Until the table exists, an empty register — obligations
       component null, three-component blend — is the honest degradation;
       a hard error here would take down the score card that worked
       yesterday. Any other failure still throws. */
    const code = (err as { code?: string } | null)?.code
    if (code === 'PGRST205' || code === '42P01') return []
    throw err
  }
}

export async function addObligation(
  organizationId: string,
  fields: NewObligation,
): Promise<ProductionObligation> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_obligations')
    .insert({
      organization_id: organizationId,
      title: fields.title,
      area: fields.area || null,
      jurisdiction: fields.jurisdiction || null,
      due_on: fields.dueOn || null,
      recurrence: fields.recurrence || null,
      owner_name: fields.ownerName || null,
      status: fields.status,
      evidence: fields.evidence || null,
    })
    .select(OBLIGATION_COLUMNS)
    .single()
  if (error) throw error
  return toObligation(obligationRowSchema.parse(data))
}

export async function setObligationStatus(
  id: string,
  status: ProductionObligationStatus,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('hr_obligations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function removeObligation(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_obligations').delete().eq('id', id)
  if (error) throw error
}
