import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import {
  buildBackfillFacts,
  buildLawAnalysisMessages,
  parseLawAnalysis,
  type LawAnalysis,
} from './lawChangeAnalysis.ts'
import { MONITORED_PAGES } from './pages.ts'
import { sweepPage } from './sweep.ts'
import { runOntarioHeartbeat } from './heartbeat.ts'
import type { HashRecord } from './sweepShared.ts'
import { secretEquals } from '../_shared/secretEqual.ts'

/**
 * monitor-law-changes — the law-change watcher behind the Knowledge view's
 * "Recent law changes" panel (src/features/app/guidance/).
 *
 * Ported from the retired Dutiva-Website repo, where it was driven by a Vercel
 * cron (`/api/trigger-law-monitor`, `0 7 * * *`). That cron lived in the repo's
 * `api/` directory and its `vercel.json`; when the Vercel project was
 * re-pointed at this repo — which has neither — the schedule silently ceased to
 * exist and the monitor stopped running after 2026-06-08. Scheduling now lives
 * in the database instead (0035_schedule_law_monitor.sql) so it cannot be lost
 * to a hosting or repository move again. See docs/LAW_MONITORING.md.
 *
 * What it does, per monitored page:
 *  - Detects content changes by SHA-256 over the extracted text.
 *  - Follows permanent redirects and records the new canonical URL.
 *  - Flags pages that stay unreachable, and — past a threshold — asks the model
 *    for a likely replacement URL, which is accepted only if it passes the
 *    host allowlist AND actually resolves.
 *  - Writes one structured `law_updates` row per event
 *    (change / redirect / broken / first_seen) with a plain-English summary.
 *
 * Scope note: this watches all 14 Canadian jurisdictions, which is deliberately
 * wider than the product's three supported jurisdictions (ON/QC/FED — see
 * docs/CANONICAL_FACTS.md). Watching costs nothing extra and builds history
 * ahead of AB/BC; the customer-facing panel is what filters, not the monitor.
 *
 * Required Supabase project secrets:
 *   SUPABASE_URL                — injected automatically
 *   SUPABASE_SERVICE_ROLE_KEY   — injected automatically
 *   HF_TOKEN                    — HuggingFace model access for URL recovery
 *                                 and the HTML path's change_summary.
 *                                 Absent: events still record, with a
 *                                 generic summary.
 *   (ai_model_routes)           — the shared model-route table powers the
 *                                 ai_analysis_en/fr interpretation on change
 *                                 rows (`law_monitor` route if registered,
 *                                 else `advisor_chat`). Absent: rows file
 *                                 with both columns null.
 */

const CRON_LOCK_JOB = 'monitor-law-changes'
/** Longer than any expected run — a full sweep is ~19 pages of network I/O. */
const CRON_LOCK_TTL_SECONDS = 30 * 60

/**
 * Only a service-role caller may run this job. The pg_cron schedule
 * (0035_schedule_law_monitor.sql, amended by 0049) presents the shared secret.
 * This check is the real gate — `verify_jwt` is false at the gateway, so
 * nothing upstream checks a caller at all.
 *
 * Until 2026-08-06 this also accepted any token whose JWT payload carried
 * role=service_role. That payload was base64-decoded and trusted; the
 * signature was never verified. `Bearer x.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.x`
 * authenticated anyone on the internet, to a 19-page government-site sweep
 * and the model spend behind it. The branch is gone.
 */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && secretEquals(req.headers.get('x-trigger-secret') ?? '', sharedSecret)) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  // Exact match only. Both are real credentials; neither is derived from
  // anything the caller controls.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && secretEquals(token, serviceKey)) || (secretKey !== '' && secretEquals(token, secretKey))
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hfToken = Deno.env.get('HF_TOKEN') ?? ''

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  /* AI read of change rows — the same model-route table the portal AI
     functions use (`law_monitor` if a dedicated route is ever registered,
     else the shared `advisor_chat` route). Best-effort: a model failure
     files the factual row without an analysis rather than losing the
     detection itself. */
  const aiRoute = await activeModelRoute(db, ['law_monitor', 'advisor_chat'])
  const aiKey = 'provider' in aiRoute ? routeApiKey(aiRoute) : null
  const analyzeChange = async (
    lawName: string,
    jurisdiction: string,
    facts: string,
  ): Promise<LawAnalysis | null> => {
    if ('error' in aiRoute || aiKey === null || 'missingSecret' in aiKey) return null
    try {
      const res = await postChatCompletion(
        aiRoute.provider,
        aiKey.apiKey,
        {
          model: aiRoute.modelName,
          messages: buildLawAnalysisMessages(lawName, jurisdiction, facts),
          max_tokens: 900,
          temperature: 0.2,
        },
        60_000,
      )
      if (!res.ok) return null
      const data = await res.json()
      return parseLawAnalysis(data.choices?.[0]?.message?.content)
    } catch {
      return null
    }
  }

  /* Maintenance path — `POST {"backfill_analysis": true}` fills ai_analysis
     on change rows written before the interpretation layer existed. It is
     keyed on the row's own recorded facts, so legacy "dataset refreshed"
     entries get an honest "which provisions moved is not in this record"
     brief rather than invented detail. Runs before the cron lock: it only
     writes the analysis columns, which no sweep row races on. Batches of
     five so the whole backfill fits in one function run. */
  const body = await req.json().catch(() => null) as { backfill_analysis?: unknown } | null
  if (body?.backfill_analysis === true) {
    const { data: pending, error: pendingError } = await db
      .from('law_updates')
      .select('id, law_name, jurisdiction, change_summary, raw_diff')
      .eq('event_type', 'change')
      .is('ai_analysis_en', null)
      .order('detected_at', { ascending: false })
      .limit(60)
    if (pendingError) {
      return new Response(JSON.stringify({ error: pendingError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    let analyzed = 0
    let skipped = 0
    for (let i = 0; i < (pending ?? []).length; i += 5) {
      const batch = (pending ?? []).slice(i, i + 5)
      const results = await Promise.allSettled(
        batch.map(async (row) => {
          const analysis = await analyzeChange(
            row.law_name as string,
            row.jurisdiction as string,
            buildBackfillFacts(row as { change_summary: string | null; raw_diff: string | null }),
          )
          if (!analysis) return false
          const { error } = await db
            .from('law_updates')
            .update({ ai_analysis_en: analysis.en, ai_analysis_fr: analysis.fr })
            .eq('id', row.id)
          return !error
        }),
      )
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) analyzed++
        else skipped++
      }
    }
    return new Response(
      JSON.stringify({ ok: true, analyzed, skipped, scanned: (pending ?? []).length }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Take the lease so a long run can't race the next scheduled trigger.
  const instanceId = crypto.randomUUID()
  const { data: acquired, error: lockError } = await db.rpc('acquire_cron_lock', {
    p_job_name: CRON_LOCK_JOB,
    p_instance_id: instanceId,
    p_ttl_seconds: CRON_LOCK_TTL_SECONDS,
  })
  if (lockError) {
    console.warn(
      '[monitor-law-changes] acquire_cron_lock failed; continuing without lock:',
      lockError.message,
    )
  } else if (!acquired) {
    console.warn('[monitor-law-changes] another instance already holds the lock; skipping.')
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: 'another-instance-running' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { data: hashRows } = await db.from('law_page_hashes').select('*')
  const hashMap: Record<string, HashRecord> = {}
  for (const row of hashRows ?? []) {
    hashMap[row.url] = {
      hash: row.content_hash,
      failures: row.consecutive_failures ?? 0,
      redirectUrl: row.redirect_url ?? null,
      meta: row.meta ?? null,
    }
  }

  const results: string[] = []
  const ctx = { db, hfToken, analyzeChange }
  for (const page of MONITORED_PAGES) {
    results.push(await sweepPage(page, hashMap[page.url], ctx))
  }
  results.push(...(await runOntarioHeartbeat(ctx, hashMap)))

  // Release the lease so the next run starts promptly. If the TTL was exceeded
  // and someone else took it, this is a no-op and the lease expires on its own.
  if (!lockError && acquired) {
    const { error: releaseError } = await db.rpc('release_cron_lock', {
      p_job_name: CRON_LOCK_JOB,
      p_instance_id: instanceId,
    })
    if (releaseError) {
      console.warn('[monitor-law-changes] release_cron_lock failed:', releaseError.message)
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      checked: MONITORED_PAGES.length,
      timestamp: new Date().toISOString(),
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
