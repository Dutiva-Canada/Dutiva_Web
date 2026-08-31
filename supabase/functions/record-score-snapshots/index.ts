import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { SCORE_FORMULA_VERSION, computeOrgScore } from './scoring.ts'

/**
 * record-score-snapshots — the scheduled compliance-score snapshot job
 * (0068/0069 schedule it; docs/SCORING_LOGIC.md §2.3).
 *
 * Upserts every organization's *current-month* row in
 * public.compliance_score_snapshots with the same formula the Analytics
 * view computes live (scoring.ts, drift-tested against the app's copy).
 * Why this exists: the view's write-on-read history depended on an org
 * owner/admin opening Analytics that month — a month without such a visit
 * left a gap. The job writes with the service role, so each month's row
 * always exists.
 *
 * Two schedules share this function:
 *  - daily 05:30 UTC — keeps the current month fresh;
 *  - month-close: 00:05/00:25/00:45 UTC on the 1st (0070 — three
 *    idempotent attempts, because pg_cron does not backfill a missed run
 *    and net.http_post is fire-and-forget: one transient failure must not
 *    silently lose a month's close). During the first UTC hour of the 1st
 *    the job ALSO upserts the month that just ended, so the frozen row is
 *    the state within an hour of the UTC month boundary (the same
 *    boundary every monthISO in this system is defined by), not the state
 *    at the last 05:30. If every attempt in that hour fails, the month
 *    stays at its last daily-run state — score_snapshot_status() exposes
 *    close coverage so that miss is visible, not silent. Outside that
 *    hour the previous month is never touched, so a manual fire cannot
 *    rewrite a frozen month.
 *
 * Every read is paginated: PostgREST caps un-ranged selects at max_rows
 * (1000 on hosted Supabase) with NO error, which would silently score an
 * org on a truncated slice of its rows — or skip orgs past the first
 * thousand entirely.
 *
 * Orgs with no scoreable rows at all are skipped, same as the view: no
 * data is an empty state, never a number.
 *
 * Auth: cron invokes with the vault-stored service key; the check is an
 * exact match against the function's own service credentials, same as
 * monitor-law-changes.
 */

function isAuthorizedTrigger(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  // Exact match only. Both are real credentials; neither is derived from
  // anything the caller controls.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && token === serviceKey) || (secretKey !== '' && token === secretKey)
}

const PAGE = 1000

/** PostgREST/Postgres codes for a relation that does not exist (yet). */
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST205' || error?.code === '42P01'
}

/**
 * Fetch ALL rows of a select, page by page — never trust one un-ranged
 * read. `optionalTable` treats a missing relation as zero rows: the
 * function can be deployed ahead of the migration that creates a table
 * (hr_obligations, 0069), and one missing optional table must degrade
 * that component to null — not fail every org in the sweep.
 */
async function fetchAll<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  organizationId: string | null,
  { optionalTable = false } = {},
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from(table)
      .select(columns)
      .order('id')
      .range(from, from + PAGE - 1)
    if (organizationId !== null) query = query.eq('organization_id', organizationId)
    const { data, error } = await query
    if (error) {
      if (optionalTable && isMissingTable(error)) return rows
      throw error
    }
    rows.push(...((data ?? []) as T[]))
    if ((data ?? []).length < PAGE) return rows
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }
  if (!isAuthorizedTrigger(req)) {
    return new Response(JSON.stringify({ error: 'Forbidden.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date()
  const nowISO = now.toISOString()
  const monthISO = `${nowISO.slice(0, 7)}-01`
  /* Month-close: during the first UTC hour of the 1st, also freeze the
     month that just ended with the state at (five minutes past) the
     boundary. */
  const isMonthClose = now.getUTCDate() === 1 && now.getUTCHours() === 0
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const previousMonthISO = `${previous.toISOString().slice(0, 7)}-01`
  const monthsToWrite = isMonthClose ? [previousMonthISO, monthISO] : [monthISO]

  let orgs: { id: string }[]
  try {
    orgs = await fetchAll<{ id: string }>(supabase, 'organizations', 'id', null)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let written = 0
  let skipped = 0
  const failures: string[] = []

  for (const org of orgs) {
    try {
      const [policies, tasks, findings, obligations, employees] = await Promise.all([
        fetchAll<{ status: string }>(supabase, 'hr_policies', 'id, status', org.id),
        fetchAll<{ status: string; category: string; metadata: Record<string, unknown> | null }>(
          supabase,
          'compliance_tasks',
          'id, status, category, metadata',
          org.id,
        ),
        fetchAll<{ severity: string; status: string }>(
          supabase,
          'compliance_findings',
          'id, severity, status',
          org.id,
        ),
        fetchAll<{ status: string }>(supabase, 'hr_obligations', 'id, status', org.id, {
          optionalTable: true,
        }),
        fetchAll<{ status: string }>(supabase, 'employees', 'id, status', org.id),
      ])

      const { score, components } = computeOrgScore({
        policyStatuses: policies.map((r) => r.status),
        tasks: tasks.map((r) => ({
          status: r.status,
          category: r.category,
          linkedKind: typeof r.metadata?.kind === 'string' ? r.metadata.kind : null,
        })),
        findings: findings.map((r) => ({ severity: r.severity, status: r.status })),
        obligationStatuses: obligations.map((r) => r.status),
      })
      if (score === null) {
        skipped += 1
        continue
      }

      const headcount = employees.filter((r) => r.status !== 'terminated').length
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

      for (const month of monthsToWrite) {
        const { error: upsertError } = await supabase.from('compliance_score_snapshots').upsert(
          {
            organization_id: org.id,
            month,
            score,
            components: componentsJson,
            headcount,
            formula_version: SCORE_FORMULA_VERSION,
            updated_at: nowISO,
          },
          { onConflict: 'organization_id,month' },
        )
        if (upsertError) throw upsertError
        written += 1
      }
    } catch (err) {
      /* One org's failure must not stop the sweep — record and continue. */
      failures.push(`${org.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (failures.length > 0) {
    console.warn(`[score-snapshots] ${failures.length} org(s) failed: ${failures.join('; ')}`)
  }

  return new Response(
    JSON.stringify({
      months: monthsToWrite,
      organizations: orgs.length,
      written,
      skipped,
      failed: failures.length,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
