import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { SCORE_FORMULA_VERSION } from './aggregation'

/**
 * Real persistence for what Analytics can't recompute later: monthly
 * snapshots — public.compliance_score_snapshots, org-scoped by RLS
 * (migrations 0062/0063). One row per org per month carries the blended
 * compliance score and the headcount at that point. Everything else on the
 * page aggregates live through the other modules' productionApi boundaries.
 *
 * Same boundary contract as those modules: zod-validated rows, throws on
 * failure (these calls only run for the signed-in admin in production).
 */

export interface ScoreSnapshot {
  /** First day of the month, YYYY-MM-DD. */
  monthISO: string
  score: number
  /** Active headcount when the snapshot was written; null for pre-0063 rows. */
  headcount: number | null
  /** Score formula the row was computed under (0068); pre-0068 rows read 1. */
  formulaVersion: number
}

export interface SnapshotComponent {
  key: string
  done: number
  total: number
  /** Severity-weighted numerator/denominator (findings, formula v2+). */
  weightedDone?: number
  weightedTotal?: number
}

const rowSchema = z.object({
  month: z.string(),
  score: z.number(),
  headcount: z.number().nullable(),
  /* Absent only on the pre-0068 fallback path below. */
  formula_version: z.number().optional(),
})

export async function listScoreSnapshots(organizationId: string): Promise<ScoreSnapshot[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const primary = await supabase
    .from('compliance_score_snapshots')
    .select('month, score, headcount, formula_version')
    .eq('organization_id', organizationId)
    .order('month', { ascending: true })
  let rows: unknown = primary.data
  let error = primary.error
  if (error?.code === '42703') {
    /* The app can deploy ahead of migration 0068 (migrations are a manual
       owner step). Until the column exists, read the legacy shape rather
       than degrade the score card — every pre-0068 row is v1 by definition. */
    const legacy = await supabase
      .from('compliance_score_snapshots')
      .select('month, score, headcount')
      .eq('organization_id', organizationId)
      .order('month', { ascending: true })
    rows = legacy.data
    error = legacy.error
  }
  if (error) throw error
  return z
    .array(rowSchema)
    .parse(rows)
    .map((row) => ({
      monthISO: row.month,
      score: row.score,
      headcount: row.headcount,
      formulaVersion: row.formula_version ?? 1,
    }))
}

/**
 * Upsert the current month's snapshot with the freshly computed live
 * numbers. Fire-and-forget from the view: recording history is an
 * enhancement — a failure must never take the dashboard down, so callers
 * catch and drop.
 */
export async function recordScoreSnapshot(
  organizationId: string,
  monthISO: string,
  score: number,
  components: readonly SnapshotComponent[],
  headcount: number | null,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const componentsJson = Object.fromEntries(
    components.map((c) => [
      c.key,
      {
        done: c.done,
        total: c.total,
        ...(c.weightedDone !== undefined && c.weightedTotal !== undefined
          ? { weighted_done: c.weightedDone, weighted_total: c.weightedTotal }
          : {}),
      },
    ]),
  )
  const row = {
    organization_id: organizationId,
    month: monthISO,
    score,
    components: componentsJson,
    headcount,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from('compliance_score_snapshots')
    .upsert(
      { ...row, formula_version: SCORE_FORMULA_VERSION },
      { onConflict: 'organization_id,month' },
    )
  if (error?.code === 'PGRST204') {
    /* Migration 0068 not applied yet (the app deploys ahead of the manual
       migration step) — write the legacy shape rather than lose the month;
       losing a close that crosses the gap is permanent, while the missing
       version label self-heals: the daily job re-stamps the current month
       on its next pass once the column exists. */
    const { error: legacyError } = await supabase
      .from('compliance_score_snapshots')
      .upsert(row, { onConflict: 'organization_id,month' })
    if (legacyError) throw legacyError
    return
  }
  if (error) throw error
}
