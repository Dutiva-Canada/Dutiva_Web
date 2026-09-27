import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion, resolveApiKey } from '../_shared/modelUpstream.ts'
import {
  SYSTEM_PROMPTS,
  buildUserMessage,
  parseModelResponse,
} from '../candidate-ai/handlers.ts'
import {
  boardJobsUrl,
  decideAction,
  greenhouseSubmitUrl,
  mapSettingsRow,
  matchesPreferences,
  normalizeGreenhouse,
  normalizeLever,
  resolveSubmitChannel,
  validateAction,
  validateApplicationId,
  type AgentSettings,
  type BoardConfig,
  type DiscoveredPosting,
} from './handlers.ts'

/**
 * Candidate job-search agent — discovers postings on the external job
 * boards a candidate configures (Greenhouse/Lever public APIs), scores them
 * against the candidate's resume, drafts a tailored application package,
 * and either queues it for review or submits it where the source exposes an
 * application endpoint.
 *
 * Actions (POST body):
 *   { action: 'scan' }                        — candidate JWT; scans the
 *                                               caller's configured boards.
 *   { action: 'scan-all' }                    — service key / trigger secret;
 *                                               nightly sweep over every
 *                                               enabled candidate.
 *   { action: 'submit', application_id }      — candidate JWT; submits one
 *                                               of the caller's queued /
 *                                               needs_review applications.
 *
 * Guardrails: model spend is bounded by MAX_JOBS_PER_SCAN per candidate per
 * run; submissions are bounded by the candidate's daily_apply_cap; and a
 * submission is only attempted through a real application endpoint —
 * everything else lands as 'manual_required' with the package attached so
 * the portal never reports a submission that did not happen.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_JOBS_PER_SCAN = 25
const FETCH_TIMEOUT_MS = 15000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type SupabaseClient = ReturnType<typeof createClient>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

interface ModelProvider {
  id: string
  provider_key: string
  base_url: string
  secret_ref: string | null
  status: string
}

interface ModelRoute {
  model_name: string
  config: { max_tokens?: number; temperature?: number } | null
}

function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

/**
 * Shared-secret / service-key trigger auth — identical contract to
 * monitor-law-changes: `x-trigger-secret` matching SUPPORT_NOTIFY_SECRET, or
 * a bearer token equal to the service-role/secret key. Deliberately no
 * JWT-payload sniffing (see the comment block in monitor-law-changes).
 */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && token === serviceKey) || (secretKey !== '' && token === secretKey)
}

async function authenticateCandidate(
  req: Request,
  config: ServerConfig,
): Promise<{ userId: string; candidateId: string; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: profile, error: profileError } = await adminClient
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (profileError) return json({ error: profileError.message }, 500)
  if (!profile) return json({ error: 'Candidate profile required', code: 'no_profile' }, 409)

  return { userId: userData.user.id, candidateId: profile.id as string, adminClient }
}

/* ── Model calls ─────────────────────────────────────────────────────────── */

async function activeModelRoute(adminClient: SupabaseClient) {
  for (const routeKey of ['candidate_ai', 'advisor_chat']) {
    const { data: route, error } = await adminClient
      .from('ai_model_routes')
      .select(
        'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
      )
      .eq('route_key', routeKey)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) return { error: error.message }
    const provider = route?.provider as ModelProvider | null | undefined
    if (route && provider && provider.status === 'active') {
      return { route: route as unknown as ModelRoute, provider }
    }
  }
  return { error: 'no_route' }
}

async function callModel(
  route: ModelRoute,
  provider: ModelProvider,
  feature: 'match-score' | 'tailor-resume' | 'cover-letter',
  payload: Record<string, unknown>,
): Promise<Record<string, unknown> | { error: string }> {
  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) return { error: `missing_secret:${keyResult.missingSecret}` }

  const upstream = await postChatCompletion(provider, keyResult.apiKey, {
    model: route.model_name,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS[feature] },
      { role: 'user', content: buildUserMessage(feature, payload as never) },
    ],
    max_tokens: route.config?.max_tokens ?? 2048,
    ...(typeof route.config?.temperature === 'number'
      ? { temperature: route.config.temperature }
      : {}),
  })
  if (!upstream.ok) {
    return { error: `upstream_${upstream.status}` }
  }
  const completion = await upstream.json()
  const content = completion?.choices?.[0]?.message?.content ?? ''
  const parsed = parseModelResponse(feature, content)
  if (!parsed.ok) return { error: parsed.error }
  return parsed.value as Record<string, unknown>
}

/* ── Board fetch ─────────────────────────────────────────────────────────── */

async function fetchBoardPostings(board: BoardConfig): Promise<DiscoveredPosting[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(boardJobsUrl(board), {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'dutiva-candidate-agent/1.0' },
    })
    if (!res.ok) return []
    const payload = await res.json()
    return board.ats === 'greenhouse'
      ? normalizeGreenhouse(payload, board.slug)
      : normalizeLever(payload, board.slug)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

/* ── Submission ──────────────────────────────────────────────────────────── */

interface ApplicationRow {
  id: string
  candidate_id: string
  discovered_job_id: string
  status: string
  tailored_resume: string
  cover_letter: string
  channel: string | null
}

async function attemptSubmission(
  app: ApplicationRow,
  job: { source: string; external_id: string; apply_url: string | null },
  profile: { name: string; email: string; phone: string | null },
  boardSlug: string | null,
): Promise<{ status: 'submitted' | 'manual_required' | 'failed'; channel: string; response: string | null; error: string | null }> {
  const channel = resolveSubmitChannel(job.source)
  if (channel === 'manual' || !boardSlug) {
    return { status: 'manual_required', channel: 'manual', response: null, error: null }
  }

  const [firstName, ...rest] = profile.name.trim().split(/\s+/)
  const form = new FormData()
  form.append('first_name', firstName ?? '')
  form.append('last_name', rest.join(' ') || firstName || '')
  form.append('email', profile.email)
  if (profile.phone) form.append('phone', profile.phone)
  form.append('resume_text', app.tailored_resume)
  form.append('cover_letter_text', app.cover_letter)

  try {
    const res = await fetch(greenhouseSubmitUrl(boardSlug, job.external_id), {
      method: 'POST',
      body: form,
      headers: { 'User-Agent': 'dutiva-candidate-agent/1.0' },
    })
    const text = (await res.text()).slice(0, 1000)
    if (res.ok) {
      return { status: 'submitted', channel, response: text || null, error: null }
    }
    /* A 4xx here usually means the board asks custom questions the flat
       payload can't answer — honest fallback is manual_required, not
       failed, so the candidate still gets a path forward. */
    return {
      status: res.status >= 400 && res.status < 500 ? 'manual_required' : 'failed',
      channel,
      response: null,
      error: `HTTP ${res.status}: ${text}`,
    }
  } catch (error) {
    return { status: 'failed', channel, response: null, error: String(error).slice(0, 500) }
  }
}

/* ── Per-candidate scan ──────────────────────────────────────────────────── */

interface ProfileRow {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  resume_text: string | null
}

async function scanCandidate(
  adminClient: SupabaseClient,
  settings: AgentSettings,
  profile: ProfileRow,
): Promise<Record<string, unknown>> {
  const summary = { discovered: 0, scored: 0, prepared: 0, submitted: 0, errors: 0 }

  /* Today's submission count — the daily cap guards the whole run. */
  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)
  const { count: appliedToday } = await adminClient
    .from('candidate_external_applications')
    .select('id', { count: 'exact', head: true })
    .eq('candidate_id', profile.id)
    .eq('status', 'submitted')
    .gte('submitted_at', dayStart.toISOString())
  let applyBudget = Math.max(0, settings.daily_apply_cap - (appliedToday ?? 0))

  /* Discover: fetch every configured board, filter, insert the new ones. */
  const seen: DiscoveredPosting[] = []
  for (const board of settings.boards) {
    const postings = await fetchBoardPostings(board)
    for (const posting of postings) {
      if (matchesPreferences(posting, settings)) seen.push(posting)
    }
  }

  const { data: existing } = await adminClient
    .from('candidate_discovered_jobs')
    .select('source, external_id')
    .eq('candidate_id', profile.id)
  const known = new Set(
    (existing ?? []).map((r) => `${r.source as string}:${r.external_id as string}`),
  )

  const fresh = seen.filter((p) => !known.has(`${p.source}:${p.external_id}`))
  const boardSlugBySource = new Map<string, string>()
  for (const board of settings.boards) boardSlugBySource.set(board.ats, board.slug)

  const route = await activeModelRoute(adminClient)
  const modelAvailable = 'error' in route ? null : route

  for (const posting of fresh.slice(0, MAX_JOBS_PER_SCAN)) {
    const { data: jobRow, error: insertError } = await adminClient
      .from('candidate_discovered_jobs')
      .insert({
        candidate_id: profile.id,
        source: posting.source,
        external_id: posting.external_id,
        company: posting.company,
        title: posting.title,
        location: posting.location,
        url: posting.url,
        apply_url: posting.apply_url,
        description: posting.description.slice(0, 20000),
      })
      .select('id')
      .maybeSingle()
    if (insertError || !jobRow) {
      /* A race with another scan hits the unique constraint — not an
         error worth surfacing; the job is already known. */
      if (insertError && !String(insertError.code).startsWith('23')) summary.errors += 1
      continue
    }
    summary.discovered += 1

    const resumeText = profile.resume_text ?? ''
    if (!modelAvailable || resumeText.trim() === '') continue

    const jobId = jobRow.id as string
    const basePayload = {
      resumeText,
      jobTitle: posting.title,
      jobDescription: posting.description.slice(0, 8000),
      requirements: [] as string[],
    }

    const scoreResult = await callModel(
      modelAvailable.route,
      modelAvailable.provider,
      'match-score',
      basePayload,
    )
    const score = 'error' in scoreResult ? null : (scoreResult['score'] as number)
    summary.scored += 1

    const action = decideAction(settings, score)
    await adminClient
      .from('candidate_discovered_jobs')
      .update({ match_score: score, updated_at: new Date().toISOString() })
      .eq('id', jobId)
    if (action === 'skip') continue

    /* Package: tailored resume + cover letter. A generation failure marks
       the job failed rather than silently shipping a bare resume. */
    const [tailored, letter] = await Promise.all([
      callModel(modelAvailable.route, modelAvailable.provider, 'tailor-resume', basePayload),
      callModel(
        modelAvailable.route,
        modelAvailable.provider,
        'cover-letter',
        { ...basePayload, candidateName: profile.name },
      ),
    ])
    if ('error' in tailored || 'error' in letter) {
      await adminClient
        .from('candidate_discovered_jobs')
        .update({ status: 'failed', error: 'package_generation_failed', updated_at: new Date().toISOString() })
        .eq('id', jobId)
      summary.errors += 1
      continue
    }

    const wantsSubmit = action === 'prepare_submit' && applyBudget > 0
    const { data: appRow } = await adminClient
      .from('candidate_external_applications')
      .insert({
        candidate_id: profile.id,
        discovered_job_id: jobId,
        status: wantsSubmit ? 'queued' : 'needs_review',
        tailored_resume: tailored['tailoredResume'] as string,
        cover_letter: letter['coverLetter'] as string,
        match_score: score,
      })
      .select('*')
      .maybeSingle()
    if (!appRow) {
      summary.errors += 1
      continue
    }
    summary.prepared += 1
    await adminClient
      .from('candidate_discovered_jobs')
      .update({ status: wantsSubmit ? 'queued' : 'needs_review', updated_at: new Date().toISOString() })
      .eq('id', jobId)

    if (wantsSubmit) {
      applyBudget -= 1
      const outcome = await attemptSubmission(
        appRow as ApplicationRow,
        posting,
        profile,
        boardSlugBySource.get(posting.source) ?? null,
      )
      await applyOutcome(adminClient, appRow.id as string, jobId, outcome)
      if (outcome.status === 'submitted') summary.submitted += 1
      if (outcome.status === 'failed') summary.errors += 1
    }
  }

  return summary
}

async function applyOutcome(
  adminClient: SupabaseClient,
  appId: string,
  jobId: string,
  outcome: { status: string; channel: string; response: string | null; error: string | null },
): Promise<void> {
  const now = new Date().toISOString()
  await adminClient
    .from('candidate_external_applications')
    .update({
      status: outcome.status,
      channel: outcome.channel,
      response: outcome.response,
      error: outcome.error,
      submitted_at: outcome.status === 'submitted' ? now : null,
      updated_at: now,
    })
    .eq('id', appId)
  await adminClient
    .from('candidate_discovered_jobs')
    .update({ status: outcome.status, error: outcome.error, updated_at: now })
    .eq('id', jobId)
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const actionCheck = validateAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)
  const action = actionCheck.value

  /* scan-all — the cron path. Trigger-secret or service-key auth only. */
  if (action === 'scan-all') {
    if (!isAuthorizedTrigger(req)) return json({ error: 'Unauthorized' }, 401)
    const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
    const { data: settingsRows, error } = await adminClient
      .from('candidate_agent_settings')
      .select('*')
      .eq('enabled', true)
    if (error) return json({ error: error.message }, 500)

    const results: Record<string, unknown>[] = []
    for (const row of settingsRows ?? []) {
      const settings = mapSettingsRow(row as Record<string, unknown>)
      if (settings.boards.length === 0) continue
      const { data: profile } = await adminClient
        .from('candidate_profiles')
        .select('id, user_id, name, email, phone, resume_text')
        .eq('user_id', row.user_id)
        .maybeSingle()
      if (!profile || !profile.email) continue
      try {
        results.push(await scanCandidate(adminClient, settings, profile as ProfileRow))
      } catch (error) {
        console.error('candidate-job-agent: scan failed', row.user_id, error)
        results.push({ error: String(error).slice(0, 200) })
      }
    }
    return json({ scanned: results.length, results })
  }

  /* scan / submit — candidate JWT paths. */
  const authed = await authenticateCandidate(req, config)
  if (authed instanceof Response) return authed
  const { candidateId, adminClient } = authed

  if (action === 'scan') {
    const { data: mySettings } = await adminClient
      .from('candidate_agent_settings')
      .select('*')
      .eq('user_id', authed.userId)
      .maybeSingle()
    if (!mySettings) return json({ error: 'Agent not configured', code: 'not_configured' }, 409)
    const settings = mapSettingsRow(mySettings as Record<string, unknown>)
    if (!settings.enabled) return json({ error: 'Agent is disabled', code: 'disabled' }, 409)
    const { data: profile } = await adminClient
      .from('candidate_profiles')
      .select('id, user_id, name, email, phone, resume_text')
      .eq('id', candidateId)
      .maybeSingle()
    if (!profile) return json({ error: 'Candidate profile required', code: 'no_profile' }, 409)
    return json(await scanCandidate(adminClient, settings, profile as ProfileRow))
  }

  /* submit — approve a prepared application. */
  const idCheck = validateApplicationId(body['application_id'])
  if (!idCheck.ok) return json({ error: idCheck.error }, 400)

  const { data: app } = await adminClient
    .from('candidate_external_applications')
    .select('*, job:candidate_discovered_jobs(source, external_id, apply_url)')
    .eq('id', idCheck.value)
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (!app) return json({ error: 'Application not found' }, 404)
  if (!['needs_review', 'queued'].includes(app.status as string)) {
    return json({ error: `Application is ${app.status}`, code: 'not_submittable' }, 409)
  }

  const { data: profile } = await adminClient
    .from('candidate_profiles')
    .select('id, user_id, name, email, phone, resume_text')
    .eq('id', candidateId)
    .maybeSingle()
  if (!profile) return json({ error: 'Candidate profile required' }, 409)

  const job = app.job as { source: string; external_id: string; apply_url: string | null } | null
  if (!job) return json({ error: 'Discovered job missing' }, 500)

  /* The board slug isn't stored on the job row; recover it from the
     candidate's settings by matching the source's configured board. */
  const { data: settingsRow } = await adminClient
    .from('candidate_agent_settings')
    .select('boards')
    .eq('user_id', authed.userId)
    .maybeSingle()
  const board = parseBoardsForSource(settingsRow?.boards, job.source)

  const outcome = await attemptSubmission(app as ApplicationRow, job, profile as ProfileRow, board)
  await applyOutcome(adminClient, app.id as string, app.discovered_job_id as string, outcome)
  return json({ status: outcome.status, channel: outcome.channel, error: outcome.error })
})

function parseBoardsForSource(raw: unknown, source: string): string | null {
  if (!Array.isArray(raw)) return null
  for (const item of raw) {
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      if (obj['ats'] === source && typeof obj['slug'] === 'string') return obj['slug']
    }
  }
  return null
}
