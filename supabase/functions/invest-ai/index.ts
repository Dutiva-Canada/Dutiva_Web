import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient as SbClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { withCors } from '../_shared/cors.ts'
import { isInternalDutivaAccount } from '../_shared/adminAccess.ts'
import {
  buildDraftPrompt,
  buildMemoryReviewPrompt,
  buildScanDraftPrompt,
  buildSwotDraftPrompt,
  buildThesisDraftPrompt,
  draftSystemPrompt,
  MEMORY_REVIEW_SYSTEM_PROMPT,
  parseDraft,
  parseMemoriesDraft,
  parseScanDraft,
  parseSwotDraft,
  parseThesisDraft,
  sanitizeGoal,
  SCAN_SYSTEM_PROMPT,
  SWOT_SYSTEM_PROMPT,
  THESIS_SYSTEM_PROMPT,
  validateAiAction,
  type MemoryPromptFact,
} from './handlers.ts'
import {
  json,
  modelRoute,
  runChat,
  runChatUndo,
  UPSTREAM_TIMEOUT_MS,
} from './runtime.ts'
import { parseInvestReactEvent, runReact } from './reactRuntime.ts'

/**
 * invest-ai — AI assistance for the invest portal, in Tally's voice.
 * Deliberately narrow: the model *authors* strategy drafts; the
 * deterministic invest-bot engine executes them. A draft is validated
 * server-side, returned disabled, and only reaches the book after the user
 * reviews and saves it.
 *
 * Actions (POST body, portal JWT + invest_access grant required):
 *   { action: 'draft-strategy', goal: string, lang?: 'en'|'fr' }
 *     → { draft: { name, cadence, asset_classes, rules } }
 *   { action: 'draft-thesis' | 'draft-swot' | 'draft-scan', … }
 *     → artifacts filed to agent_suggestions for review, never auto-saved
 *   { action: 'review-memories', lang? }
 *     → { proposed, suggestionIds } — reads the holder's recent chat turns
 *       and files durable facts as 'memory' suggestions; accepting one on
 *       the profile page writes it to invest_memories, where it joins the
 *       chat context and the draft prompts on later calls.
 *
 *   { kind: 'chat', message, lang?, today? } → { reply, action, assistantId }
 *     — Tally, the book's watch clerk: answers over the book's own rows and
 *     executes whitelisted additive writes (watchlist add/remove, a QUEUED
 *     draft order — never a fill, signal status, a strategy draft filed for
 *     review). Both turns persist to invest_chat_messages.
 *   { kind: 'react', event, lang? } → { reply }
 *     — she reacts when the person does something: watched a symbol,
 *     queued a draft order. Her line persists to invest_chat_messages.
 *   { kind: 'chat_history', limit?, before?, threadId? } → { turns }
 *   { kind: 'chat_threads' }         → { threads } — named conversations
 *   { kind: 'chat_thread_new' }      → { thread } — starts a named one
 *   { kind: 'chat_regenerate', threadId? } → same payload as 'chat'
 *     — re-runs the thread's last user turn after deleting the old pair.
 *   { kind: 'chat_clear', threadId? } → { cleared: true }
 *   { kind: 'chat_feedback', messageId, rating, reason? } → { ok }
 *     — rating -1 may carry a short `reason` so a downvote says why.
 *   { kind: 'chat_undo', messageId } → { ok }
 *     — reverses an assistant turn's write while it's still reversible
 *     (queued order untouched, watch row, signal status, filed draft).
 *
 * `stream: true` on the chat/react kinds switches the response to
 * text/event-stream — same event contract as health-ai: delta events carry
 * reply text (never the action JSON), one done event carries the parsed
 * payload.
 *
 * The chat/react/undo handlers live in ./runtime.ts — this file is auth +
 * routing + the draft-strategy one-shot.
 */

type SupabaseClient = SbClient<Database>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
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

async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
): Promise<{ userId: string; email: string | null; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient<Database>(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('invest_access')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'Invest access not granted', code: 'no_access' }, 403)

  return { userId: userData.user.id, email: userData.user.email ?? null, adminClient }
}

/** Confirmed memories for the draft prompts — the holder's own retained
    facts shape drafts the same way they shape chat context. */
async function loadMemories(
  adminClient: SupabaseClient,
  userId: string,
): Promise<MemoryPromptFact[]> {
  const { data } = await adminClient
    .from('invest_memories')
    .select('symbol, kind, text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []).map((m) => ({
    symbol: m.symbol ? String(m.symbol) : null,
    kind: String(m.kind ?? 'fact'),
    text: String(m.text ?? '').slice(0, 400),
  }))
}

/** Memories plus the declared mandate — the full personal context a
    draft should align with. Two reads in parallel; both are cheap. */
async function loadPersonalContext(
  adminClient: SupabaseClient,
  userId: string,
): Promise<{ memories: MemoryPromptFact[]; mandate: string | null }> {
  const [memories, { data: profile }] = await Promise.all([
    loadMemories(adminClient, userId),
    adminClient
      .from('invest_user_profile')
      .select('mandate')
      .eq('user_id', userId)
      .maybeSingle(),
  ])
  return { memories, mandate: (profile?.mandate as string | null) ?? null }
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok')
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const { userId, email, adminClient } = authed
  /* Internal-staff tier — a verified @dutiva.ca sign-in loosens the model
     register from generic/informational to direct advice. The access grant
     above still applies to everyone; this only changes what the model may
     say, never what it may write. */
  const advice = isInternalDutivaAccount(email)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const lang = body['lang'] === 'fr' ? 'fr' : 'en'

  /* Named conversations — threadId scopes chat/history/clear/regenerate.
     NULL is the default conversation: existing rows carry thread_id NULL
     and stay visible with no backfill. A supplied threadId must be a uuid
     the caller owns. */
  const rawThread = body['threadId']
  let threadId: string | null = null
  if (rawThread !== undefined && rawThread !== null) {
    if (
      typeof rawThread !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawThread)
    ) {
      return json({ error: 'threadId must be a uuid' }, 400)
    }
    const { data: owned } = await adminClient
      .from('invest_chat_threads')
      .select('id')
      .eq('id', rawThread)
      .eq('user_id', userId)
      .maybeSingle()
    if (!owned) return json({ error: 'Unknown thread' }, 404)
    threadId = rawThread
  }

  if (body['kind'] === 'chat_threads') {
    const { data, error } = await adminClient
      .from('invest_chat_threads')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return json({ error: error.message }, 500)
    return json({ threads: data ?? [] })
  }
  if (body['kind'] === 'chat_thread_new') {
    const { data, error } = await adminClient
      .from('invest_chat_threads')
      .insert({ user_id: userId, title: null })
      .select('id, title, created_at')
      .single()
    if (error) return json({ error: error.message }, 500)
    return json({ thread: data })
  }

  /* History read/clear/feedback/undo need no model — they run through this
     function so the table's only writer is this code path (a client can't
     file its own 'assistant' rows under the owner policy). */
  if (body['kind'] === 'chat_history') {
    const limit =
      typeof body['limit'] === 'number' && Number.isInteger(body['limit'])
        ? Math.min(Math.max(body['limit'], 1), 120)
        : 60
    /* `before` pages older turns — the client passes the oldest loaded
       turn's created_at; without it the newest `limit` rows come back. */
    const before = typeof body['before'] === 'string' && body['before'] ? body['before'] : null
    let q = adminClient
      .from('invest_chat_messages')
      .select('id, role, content, action, reasoning, sources, feedback, feedback_reason, created_at')
      .eq('user_id', userId)
    q = threadId === null ? q.is('thread_id', null) : q.eq('thread_id', threadId)
    if (before) q = q.lt('created_at', before)
    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (body['kind'] === 'chat_clear') {
    let q = adminClient
      .from('invest_chat_messages')
      .delete()
      .eq('user_id', userId)
    q = threadId === null ? q.is('thread_id', null) : q.eq('thread_id', threadId)
    const { error } = await q
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (body['kind'] === 'chat_feedback') {
    const messageId = typeof body['messageId'] === 'string' ? body['messageId'] : ''
    const rating = body['rating']
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId) ||
      (rating !== 1 && rating !== -1 && rating !== 0 && rating !== null)
    ) {
      return json({ error: 'messageId (uuid) and rating (-1|0|1) required' }, 400)
    }
    /* A downvote may carry a one-tap reason; anything else clears it. */
    const reason =
      typeof body['reason'] === 'string' ? body['reason'].trim().slice(0, 80) : ''
    const { error } = await adminClient
      .from('invest_chat_messages')
      .update({
        feedback: rating === 0 || rating === null ? null : rating,
        feedback_reason: rating === -1 ? (reason || null) : null,
      })
      .eq('id', messageId)
      .eq('user_id', userId)
      .eq('role', 'assistant')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (body['kind'] === 'chat_undo') {
    const messageId = typeof body['messageId'] === 'string' ? body['messageId'] : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return json({ error: 'messageId (uuid) required' }, 400)
    }
    return await runChatUndo(adminClient, userId, messageId)
  }

  /* stream:true answers Server-Sent Events instead of one JSON payload —
     see the module header for the event shapes. */
  const stream = body['stream'] === true
  if (body['kind'] === 'chat') {
    const message = typeof body['message'] === 'string' ? body['message'].trim().slice(0, 1200) : ''
    if (!message) return json({ error: 'message is required' }, 400)
    return await runChat(adminClient, userId, message, lang, stream, advice, threadId)
  }
  if (body['kind'] === 'chat_regenerate') {
    /* Re-ask the thread's last user turn — the stale assistant reply and
       its user turn are deleted first, so the old answer stops anchoring
       the context before the fresh call runs. */
    let q = adminClient
      .from('invest_chat_messages')
      .select('id, role, content')
      .eq('user_id', userId)
    q = threadId === null ? q.is('thread_id', null) : q.eq('thread_id', threadId)
    const { data: lastTwo, error } = await q
      .order('created_at', { ascending: false })
      .limit(2)
    if (error) return json({ error: error.message }, 500)
    const latest = lastTwo?.[0]
    const prev = lastTwo?.[1]
    if (!latest || latest.role !== 'assistant' || !prev || prev.role !== 'user') {
      return json({ error: 'Nothing to regenerate' }, 409)
    }
    await adminClient
      .from('invest_chat_messages')
      .delete()
      .in('id', [latest.id, prev.id])
      .eq('user_id', userId)
    return await runChat(adminClient, userId, prev.content, lang, stream, advice, threadId)
  }
  if (body['kind'] === 'react') {
    const event = parseInvestReactEvent(body['event'])
    if (!event) return json({ error: 'bad event' }, 400)
    return await runReact(adminClient, userId, event, lang, stream, advice)
  }

  const actionCheck = validateAiAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  /* draft-thesis — the model writes the claim and its watch conditions;
     filing to the same review queue keeps the user the one who saves it. */
  if (actionCheck.value === 'draft-thesis') {
    const symbol =
      typeof body['symbol'] === 'string' ? body['symbol'].trim().toUpperCase().slice(0, 12) : ''
    const assetClass =
      typeof body['assetClass'] === 'string' ? body['assetClass'].trim() : 'equity'
    const name = typeof body['name'] === 'string' ? body['name'].trim().slice(0, 120) : ''
    const description = sanitizeGoal(body['description'] ?? body['goal'])
    if (!symbol || !/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
      return json({ error: 'symbol is required' }, 400)
    }
    if (!description) {
      return json({ error: 'description must be at least 10 characters' }, 400)
    }
    if (!['equity', 'etf', 'crypto', 'bond', 'cash', 'other'].includes(assetClass)) {
      return json({ error: 'invalid assetClass' }, 400)
    }

    const thesisRouted = await modelRoute(adminClient)
    if ('error' in thesisRouted) return thesisRouted.error
    const tr = thesisRouted
    const thesisPersonal = await loadPersonalContext(adminClient, userId)
    let thesisUpstream: Response
    try {
      thesisUpstream = await postChatCompletion(
        tr.provider,
        tr.apiKey,
        {
          model: tr.route.model_name,
          messages: [
            { role: 'system', content: THESIS_SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildThesisDraftPrompt(
                { symbol, name, description },
                lang,
                thesisPersonal.memories,
                thesisPersonal.mandate,
              ),
            },
          ],
          max_tokens: tr.route.config?.max_tokens ?? 900,
          temperature: 0.3,
        },
        UPSTREAM_TIMEOUT_MS,
      )
    } catch (error) {
      console.error('invest-ai: thesis model call failed', error)
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    if (!thesisUpstream.ok) {
      const errText = await thesisUpstream.text()
      console.error('invest-ai: thesis upstream error', thesisUpstream.status, errText.slice(0, 300))
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    const thesisCompletion = await thesisUpstream.json()
    const thesisContent = thesisCompletion?.choices?.[0]?.message?.content
    if (typeof thesisContent !== 'string') {
      return json({ error: 'Empty response from model' }, 502)
    }
    const thesisDraft = parseThesisDraft(thesisContent)
    if (!thesisDraft) {
      return json({
        error: 'Could not turn that into a thesis — try describing the story differently.',
        code: 'no_draft',
      }, 422)
    }
    const filed = await fileSuggestion(adminClient, {
      userId,
      surface: 'invest',
      kind: 'thesis',
      title: `${symbol} thesis`,
      payload: {
        asset_class: assetClass,
        symbol,
        name,
        description,
        seed: {
          thesis: thesisDraft.thesis,
          intent: thesisDraft.intent,
          break_rules: thesisDraft.break_rules,
          drift_rules: thesisDraft.drift_rules,
        },
      },
      dedupeKey: `thesis:${assetClass}:${symbol}`,
    })
    return json({ draft: thesisDraft, suggestionId: filed?.id ?? null })
  }

  /* draft-swot — the qualitative quadrant for one thesis. Files a 'swot'
     suggestion in supersede mode: a re-draft replaces the stale pending
     row rather than queuing behind it. */
  if (actionCheck.value === 'draft-swot') {
    const symbol =
      typeof body['symbol'] === 'string' ? body['symbol'].trim().toUpperCase().slice(0, 12) : ''
    const assetClass =
      typeof body['assetClass'] === 'string' ? body['assetClass'].trim() : 'equity'
    const name = typeof body['name'] === 'string' ? body['name'].trim().slice(0, 120) : ''
    const thesis = typeof body['thesis'] === 'string' ? body['thesis'].trim().slice(0, 600) : ''
    const intent = typeof body['intent'] === 'string' ? body['intent'].trim() : 'core'
    if (!symbol || !/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
      return json({ error: 'symbol is required' }, 400)
    }
    if (!['equity', 'etf', 'crypto', 'bond', 'cash', 'other'].includes(assetClass)) {
      return json({ error: 'invalid assetClass' }, 400)
    }
    const swotRouted = await modelRoute(adminClient)
    if ('error' in swotRouted) return swotRouted.error
    const sr = swotRouted
    const swotPersonal = await loadPersonalContext(adminClient, userId)
    let swotUpstream: Response
    try {
      swotUpstream = await postChatCompletion(
        sr.provider,
        sr.apiKey,
        {
          model: sr.route.model_name,
          messages: [
            { role: 'system', content: SWOT_SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildSwotDraftPrompt(
                { symbol, name, thesis, intent },
                lang,
                swotPersonal.memories,
                swotPersonal.mandate,
              ),
            },
          ],
          max_tokens: sr.route.config?.max_tokens ?? 900,
          temperature: 0.3,
        },
        UPSTREAM_TIMEOUT_MS,
      )
    } catch (error) {
      console.error('invest-ai: swot model call failed', error)
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    if (!swotUpstream.ok) {
      const errText = await swotUpstream.text()
      console.error('invest-ai: swot upstream error', swotUpstream.status, errText.slice(0, 300))
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    const swotCompletion = await swotUpstream.json()
    const swotContent = swotCompletion?.choices?.[0]?.message?.content
    if (typeof swotContent !== 'string') {
      return json({ error: 'Empty response from model' }, 502)
    }
    const swotDraft = parseSwotDraft(swotContent)
    if (!swotDraft) {
      return json({ error: 'Could not draft a SWOT for that holding.', code: 'no_draft' }, 422)
    }
    const filed = await fileSuggestion(adminClient, {
      userId,
      surface: 'invest',
      kind: 'swot',
      title: `${symbol} SWOT`,
      payload: { asset_class: assetClass, symbol, name, swot: swotDraft },
      dedupeKey: `swot:${assetClass}:${symbol}`,
      dedupeMode: 'supersede',
    })
    return json({ draft: swotDraft, suggestionId: filed?.id ?? null })
  }

  /* draft-scan — environmental-scan items for the held universe. Each
     item files as its own 'scan' suggestion so the watch board accepts
     or dismisses them one by one. */
  if (actionCheck.value === 'draft-scan') {
    const rawHoldings = Array.isArray(body['holdings']) ? body['holdings'] : []
    const holdings = rawHoldings
      .filter((h): h is Record<string, unknown> => h !== null && typeof h === 'object')
      .map((h) => ({
        assetClass: typeof h['assetClass'] === 'string' ? h['assetClass'] : 'equity',
        symbol: typeof h['symbol'] === 'string' ? h['symbol'].trim().toUpperCase().slice(0, 12) : '',
        name: typeof h['name'] === 'string' ? h['name'].trim().slice(0, 120) : '',
      }))
      .filter((h) => /^[A-Z0-9.-]{1,12}$/.test(h.symbol))
      .slice(0, 20)
    if (holdings.length === 0) return json({ error: 'holdings is required' }, 400)
    const heldSymbols = new Set(holdings.map((h) => h.symbol))

    const scanRouted = await modelRoute(adminClient)
    if ('error' in scanRouted) return scanRouted.error
    const sc = scanRouted
    const scanPersonal = await loadPersonalContext(adminClient, userId)
    let scanUpstream: Response
    try {
      scanUpstream = await postChatCompletion(
        sc.provider,
        sc.apiKey,
        {
          model: sc.route.model_name,
          messages: [
            { role: 'system', content: SCAN_SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildScanDraftPrompt(
                { holdings },
                lang,
                scanPersonal.memories,
                scanPersonal.mandate,
              ),
            },
          ],
          max_tokens: sc.route.config?.max_tokens ?? 1100,
          temperature: 0.3,
        },
        UPSTREAM_TIMEOUT_MS,
      )
    } catch (error) {
      console.error('invest-ai: scan model call failed', error)
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    if (!scanUpstream.ok) {
      const errText = await scanUpstream.text()
      console.error('invest-ai: scan upstream error', scanUpstream.status, errText.slice(0, 300))
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    const scanCompletion = await scanUpstream.json()
    const scanContent = scanCompletion?.choices?.[0]?.message?.content
    if (typeof scanContent !== 'string') {
      return json({ error: 'Empty response from model' }, 502)
    }
    const scanItems = parseScanDraft(scanContent, heldSymbols)
    if (!scanItems) {
      return json({ error: 'Could not draft a scan for this book.', code: 'no_draft' }, 422)
    }
    const items: { item: (typeof scanItems)[number]; suggestionId: string | null }[] = []
    for (const item of scanItems) {
      const filed = await fileSuggestion(adminClient, {
        userId,
        surface: 'invest',
        kind: 'scan',
        title: item.title,
        payload: {
          theme: item.theme,
          direction: item.direction,
          note: item.note,
          symbols: item.symbols,
          lang,
        },
        dedupeKey: `scan:${item.theme}:${textDedupeKey(item.title)}`,
      })
      items.push({ item, suggestionId: filed?.id ?? null })
    }
    return json({ items })
  }

  /* review-memories — the "get to know me" pass. The model reads the
     holder's own recent chat turns and proposes durable facts; each
     candidate files as a 'memory' suggestion and only becomes a memory
     when the holder accepts it on the profile page. A holder with no
     chat yet gets an honest empty answer rather than fabricated facts. */
  if (actionCheck.value === 'review-memories') {
    const [{ data: msgRows }, memories, { data: posRows }, { data: watchRows }] =
      await Promise.all([
        adminClient
          .from('invest_chat_messages')
          .select('role, content, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(80),
        loadMemories(adminClient, userId),
        adminClient.from('invest_positions').select('symbol').eq('user_id', userId).limit(60),
        adminClient.from('invest_watchlist').select('symbol').eq('user_id', userId).limit(60),
      ])
    const userTurns = (msgRows ?? []).filter((m) => m.role === 'user')
    if (userTurns.length === 0) return json({ proposed: 0, suggestionIds: [] })

    const heldSymbols = new Set<string>()
    for (const p of posRows ?? []) heldSymbols.add(String(p.symbol).toUpperCase())
    for (const w of watchRows ?? []) heldSymbols.add(String(w.symbol).toUpperCase())

    const memRouted = await modelRoute(adminClient)
    if ('error' in memRouted) return memRouted.error
    const mr = memRouted
    let memUpstream: Response
    try {
      memUpstream = await postChatCompletion(
        mr.provider,
        mr.apiKey,
        {
          model: mr.route.model_name,
          messages: [
            { role: 'system', content: MEMORY_REVIEW_SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildMemoryReviewPrompt(
                {
                  messages: userTurns.map((m) => ({
                    role: String(m.role),
                    content: String(m.content ?? ''),
                    createdAt: typeof m.created_at === 'string' ? m.created_at : null,
                  })),
                  existing: memories.map((m) => ({ symbol: m.symbol, text: m.text })),
                },
                lang,
              ),
            },
          ],
          max_tokens: mr.route.config?.max_tokens ?? 800,
          temperature: 0.2,
        },
        UPSTREAM_TIMEOUT_MS,
      )
    } catch (error) {
      console.error('invest-ai: memory review call failed', error)
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    if (!memUpstream.ok) {
      const errText = await memUpstream.text()
      console.error('invest-ai: memory review upstream error', memUpstream.status, errText.slice(0, 300))
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    const memCompletion = await memUpstream.json()
    const memContent = memCompletion?.choices?.[0]?.message?.content
    if (typeof memContent !== 'string') {
      return json({ error: 'Empty response from model' }, 502)
    }
    const items = parseMemoriesDraft(memContent, heldSymbols)
    if (!items) {
      return json({ error: 'Could not review memories this time.', code: 'no_draft' }, 422)
    }
    /* Post-parse guard — the model saw the confirmed list but a near-twin
       of an existing memory still isn't worth a queue row. */
    const existingKeys = new Set(memories.map((m) => textDedupeKey(m.text)))
    const fresh = items.filter((i) => !existingKeys.has(textDedupeKey(i.text)))

    const suggestionIds: string[] = []
    for (const i of fresh) {
      const filed = await fileSuggestion(adminClient, {
        userId,
        surface: 'invest',
        kind: 'memory',
        title: i.text,
        payload: { kind: i.kind, symbol: i.symbol, text: i.text, lang },
        dedupeKey: `memory:${textDedupeKey(i.text)}`,
      })
      if (filed?.id) suggestionIds.push(filed.id)
    }
    return json({ proposed: fresh.length, suggestionIds })
  }

  /* draft-strategy */
  const goal = sanitizeGoal(body['goal'])
  if (!goal) return json({ error: 'goal must be at least 10 characters' }, 400)

  const routed = await modelRoute(adminClient)
  if ('error' in routed) return routed.error
  const { route, provider, apiKey } = routed
  const strategyPersonal = await loadPersonalContext(adminClient, userId)

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      apiKey,
      {
        model: route.model_name,
        messages: [
          { role: 'system', content: draftSystemPrompt(advice) },
          { role: 'user', content: buildDraftPrompt(goal, lang, strategyPersonal) },
        ],
        max_tokens: route.config?.max_tokens ?? 900,
        temperature: 0.3,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (error) {
    console.error('invest-ai: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }
  if (!upstream.ok) {
    const errText = await upstream.text()
    console.error('invest-ai: upstream error', upstream.status, errText.slice(0, 300))
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }

  const completion = await upstream.json()
  const content = completion?.choices?.[0]?.message?.content
  if (typeof content !== 'string') return json({ error: 'Empty response from model' }, 502)

  const draft = parseDraft(content)
  if (!draft) {
    return json({ error: 'Could not turn that goal into a strategy — try describing it differently.', code: 'no_draft' }, 422)
  }

  /* File the draft for review — a wizard abandoned mid-edit shouldn't lose
     it. Deduped on the normalized goal so re-describing the same strategy
     returns the pending row instead of a twin; the draft itself ships
     disabled either way — the user reviews, then enables. */
  const shipped = { ...draft, enabled: false, autonomy: 'suggest', template: 'ai-draft' }
  const filed = await fileSuggestion(adminClient, {
    userId,
    surface: 'invest',
    kind: 'strategy',
    title: shipped.name,
    payload: { goal, draft: shipped },
    dedupeKey: textDedupeKey(goal),
  })
  return json({ draft: shipped, suggestionId: filed?.id ?? null })
}

Deno.serve(async (req) => withCors(req, await handler(req)))
