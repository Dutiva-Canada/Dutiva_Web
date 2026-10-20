import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  postChatCompletion,
  readUpstreamCompletion,
  readUpstreamText,
  routeBodyExtras,
  routeMaxTokens,
  type ApiKeyResult,
  type UpstreamMessage,
} from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey, type ResolvedRoute } from '../_shared/aiRoute.ts'
import {
  claimAiUsage,
  finalizeAiUsage,
  prAiPolicy,
  usageLimitBody,
  type UsageDbClient,
} from '../_shared/aiUsage.ts'
import { createReplyDeltaExtractor } from '../_shared/replyDelta.ts'
import {
  buildPrRepairNote,
  detectPrFlags,
  parsePrChatReply,
  PR_FALLBACK_EN,
  PR_FALLBACK_FR,
  PR_REACT_FALLBACK_EN,
  PR_REACT_FALLBACK_FR,
  prChatPrompt,
  prChatSources,
  prReactPrompt,
  resolveNameRef,
  rowMatchesWrote,
  type PrChatAction,
  type PrChatContext,
  type PrChatReply,
  type PrReactEvent,
} from './handlers.ts'
import {
  formatWebResultsBlock,
  mergeSources,
  webSearch,
  webSources,
  type WebResult,
} from '../_shared/webSearch.ts'

/* Runtime for pr-ai — everything the serve() router delegates to: the chat
   and react kinds, their shared desk-context load, action execution + undo,
   and the SSE plumbing. Kept out of index.ts so the router stays readable
   under the repo's file-size budget. Deno-only — the pure/prompt layer
   lives in handlers.ts where vitest can reach it. */

/* Reasoning streams live while the upstream call runs — a deeper desk read
   legitimately needs more than 45s now. */
export const UPSTREAM_TIMEOUT_MS = 120_000
const CHAT_HISTORY = 20
const CHAT_LIST_CAP = 15

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface ExecutedAction {
  type: string
  /** Human-facing subject — the campaign name, contact name, etc. */
  detail: string
  ok: boolean
  /** Row id of the created/touched row — lets the client offer undo. */
  refId?: string
  /** For update_campaign_status: the status the row had before — what undo
      restores instead of deleting the row. */
  prevStatus?: string
  /** The values the action wrote (for status flips, the status it set).
     Undo compares them to the live row and refuses to destroy edits the
     person made in between — an edited row isn't this action's to remove. */
  wrote?: Record<string, unknown>
  /** Set once chat_undo reverses the write — the client hides the chip. */
  undone?: boolean
}

/** The desk's own rows, shared by chat and react — names, statuses, counts,
    capped per list. Every row belongs to the caller. */
export async function loadDeskContext(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ctx: PrChatContext; campaigns: { id: string; name: string }[] }> {
  const [
    { data: campaigns },
    { data: contentItems },
    { data: contacts },
    { data: keywords },
    { data: mentions },
    { data: geoPrompts },
    { count: feedCount },
    { data: connections },
  ] = await Promise.all([
    admin.from('pr_campaigns').select('id, name, status, channel').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_content_items').select('id, title, status').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_media_contacts').select('name, outlet, beat').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_keywords').select('keyword, position').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_mentions').select('title, source, sentiment, url').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_geo_prompts').select('prompt, result').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_feeds').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('pr_connections').select('provider, status').eq('user_id', userId),
  ])

  const contentByStatus: Record<string, number> = {}
  for (const c of contentItems ?? []) {
    contentByStatus[String(c.status)] = (contentByStatus[String(c.status)] ?? 0) + 1
  }
  const mentionsBySentiment: Record<string, number> = {}
  for (const m of mentions ?? []) {
    mentionsBySentiment[String(m.sentiment)] = (mentionsBySentiment[String(m.sentiment)] ?? 0) + 1
  }

  const ctx: PrChatContext = {
    campaigns: (campaigns ?? []).map((c) => ({
      name: String(c.name), status: String(c.status), channel: String(c.channel),
    })),
    contentByStatus,
    recentContent: (contentItems ?? []).slice(0, 8).map((c) => String(c.title)),
    contacts: (contacts ?? []).map((c) => ({
      name: String(c.name), outlet: String(c.outlet ?? ''), beat: String(c.beat ?? ''),
    })),
    keywords: (keywords ?? []).map((k) => ({
      keyword: String(k.keyword),
      position: typeof k.position === 'number' ? k.position : null,
    })),
    mentionsBySentiment,
    recentMentions: (mentions ?? []).slice(0, 8).map((m) => ({
      title: String(m.title), source: String(m.source ?? ''), url: m.url ? String(m.url) : null,
    })),
    geoPrompts: (geoPrompts ?? []).map((g) => ({
      prompt: String(g.prompt), result: String(g.result ?? 'unchecked'),
    })),
    feeds: feedCount ?? 0,
    connections: (connections ?? []).map((c) => ({
      provider: String(c.provider), status: String(c.status),
    })),
  }
  return { ctx, campaigns: (campaigns ?? []) as { id: string; name: string }[] }
}

/** Model-route + key resolution, shared by the model-backed kinds. */
export async function modelRoute(
  admin: SupabaseClient,
): Promise<{ error: Response } | { found: ResolvedRoute; keyResult: Extract<ApiKeyResult, { apiKey: unknown }> }> {
  const found = await activeModelRoute(admin, ['pr_ai', 'advisor_chat'])
  if ('error' in found) {
    return {
      error: json(
        found.error === 'no_route'
          ? { error: 'No active AI route', code: 'no_route' }
          : { error: found.error },
        found.error === 'no_route' ? 503 : 500,
      ),
    }
  }
  const keyResult = routeApiKey(found)
  if ('missingSecret' in keyResult) {
    return {
      error: json(
        { error: `Provider secret ${keyResult.missingSecret} not configured`, code: 'no_key' },
        503,
      ),
    }
  }
  return { found, keyResult }
}

/* ── usage guardrail ──────────────────────────────────────────────────────
   pr-ai had no cap at all — an invite holder could drive unlimited model
   calls. Every model path claims a slot on the shared abuse rails first,
   then finalizes the claim once the work resolves. Denied → 429 the client
   maps to its own copy; guardrail unreachable → fail closed, because an
   unmetered free call is the leak. */

/** Claim one usage slot. A Response return means stop and send it back. */
export async function claimPrCall(
  admin: SupabaseClient,
  userId: string,
  route: ResolvedRoute,
): Promise<{ claimId: string } | Response> {
  const decision = await claimAiUsage(admin as unknown as UsageDbClient, prAiPolicy(), {
    userId,
    organizationId: null,
    provider: route.providerKey,
    model: route.modelName,
  })
  if (decision.kind === 'denied') {
    console.warn(`pr-ai usage limit (scope=${decision.scope})`)
    return json(usageLimitBody(decision), 429)
  }
  if (decision.kind === 'unavailable') {
    console.error(`pr-ai usage guardrail unavailable: ${decision.reason}`)
    return json({ error: 'AI is temporarily unavailable', code: 'usage_unavailable' }, 503)
  }
  return { claimId: decision.claimId }
}

/** Stamp the claimed row — best-effort; the reply is already paid for. */
export function settlePrCall(
  admin: SupabaseClient,
  claimId: string,
  ok: boolean,
  startedAt: number,
): void {
  void finalizeAiUsage(admin as unknown as UsageDbClient, claimId, {
    status: ok ? 'completed' : 'failed',
    latencyMs: Date.now() - startedAt,
  })
}

/** One Server-Sent-Events channel: send() emits `data: {…}` events, close()
    ends the stream. The pump runs after the Response is already returned. */
function sseChannel() {
  const ts = new TransformStream<Uint8Array, Uint8Array>()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  return {
    response: new Response(ts.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    }),
    send: (event: Record<string, unknown>) => {
      void writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    close: () => {
      void writer.close()
    },
  }
}

/* Persist both turns — history is server-side so the next device/session
   sees the same conversation, and the assistant row keeps what it did.
   The assistant id goes back so the client can attach feedback to it. */
export async function persistChatTurns(
  admin: SupabaseClient,
  userId: string,
  message: string,
  reply: string,
  executed: ExecutedAction | null,
  threadId: string | null,
  reasoning: string,
  sources: { label: string; url?: string }[],
): Promise<{ userId: string | null; assistantId: string | null }> {
  const nowIso = new Date().toISOString()
  const { data: userRow, error: userErr } = await admin
    .from('pr_chat_messages')
    .insert({
      user_id: userId,
      role: 'user',
      content: message,
      thread_id: threadId,
      created_at: nowIso,
    })
    .select('id')
    .single()
  if (userErr || !userRow) {
    /* No question → no answer: writing the reply alone would land an
       assistant row above nothing, and regenerate's pair scan could
       mistake it for one. */
    console.warn('pr-ai chat persist: user insert failed', userErr)
    return { userId: null, assistantId: null }
  }
  const { data: assistantRow, error: assistantErr } = await admin
    .from('pr_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: reply,
      action: executed,
      thread_id: threadId,
      reasoning: reasoning || null,
      sources: sources.length > 0 ? sources : null,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
  if (assistantErr || !assistantRow) {
    /* Half the pair would persist otherwise — an orphan user turn whose
       reply the client showed under a local id that never comes back on
       reload, and one chat_regenerate can't reach (it needs the assistant
       row on top). Take the user row back down with it. */
    console.warn('pr-ai chat persist: assistant insert failed; removing user row', assistantErr)
    await admin
      .from('pr_chat_messages')
      .delete()
      .eq('id', userRow.id)
      .eq('user_id', userId)
    return { userId: null, assistantId: null }
  }
  /* A named thread takes its title from the first user message — set only
     while the title is still null, so a later turn never renames it. Runs
     after both inserts so a failed pair can't name the thread after a
     message that isn't in it. */
  if (threadId) {
    await admin
      .from('pr_chat_threads')
      .update({ title: message.slice(0, 80) })
      .eq('id', threadId)
      .eq('user_id', userId)
      .is('title', null)
  }
  /* userId:null when the pair came back down — the client's optimistic
     turn keeps its local id instead of adopting a row that no longer
     exists. */
  return { userId: userRow.id, assistantId: assistantRow.id }
}

/* ── kind 'chat' ──────────────────────────────────────────────────────────
   The conversational surface — Paige answers over the desk's own rows plus
   the last CHAT_HISTORY turns, and acts only through executeChatAction's
   additive whitelist. */

export async function runChat(
  admin: SupabaseClient,
  userId: string,
  message: string,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
  threadId: string | null = null,
  opts?: {
    /** Message-row ids this reply supersedes — excluded from the history
        window so a stale answer can't anchor a re-ask. */
    excludeIds?: string[]
    /** Cleanup that may only run once the fresh pair persists — a
        regenerate's stale-pair delete lives here so a failed call loses
        nothing. */
    afterPersist?: () => Promise<void>
  },
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  /* Context history scopes to the same thread — a named conversation must
     not leak turns from the default one into the model window. */
  let histQuery = admin
    .from('pr_chat_messages')
    .select('role, content')
    .eq('user_id', userId)
  histQuery = threadId === null
    ? histQuery.is('thread_id', null)
    : histQuery.eq('thread_id', threadId)
  if (opts?.excludeIds?.length) {
    histQuery = histQuery.not('id', 'in', `(${opts.excludeIds.join(',')})`)
  }
  const runAfterPersist = async () => {
    if (!opts?.afterPersist) return
    try {
      await opts.afterPersist()
    } catch (e) {
      console.warn('afterPersist cleanup failed', e)
    }
  }
  const [desk, { data: historyRows, error: histError }] = await Promise.all([
    loadDeskContext(admin, userId),
    histQuery.order('created_at', { ascending: false }).limit(CHAT_HISTORY),
  ])
  if (histError) return json({ error: histError.message }, 500)

  const history = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  const baseMessages: UpstreamMessage[] = [
    prChatPrompt(desk.ctx, lang, { advice }),
    ...history,
    { role: 'user', content: message },
  ]
  const extras = routeBodyExtras(found.config)

  /* Claim once per turn — the search hop and the boundary repair round are
     part of the same billable answer, not new requests. */
  const meter = await claimPrCall(admin, userId, found)
  if (meter instanceof Response) return meter
  const meterT0 = Date.now()
  let meterOk = false

  /* One upstream call, repeatable — round two carries the live search
     results the model asked for, injected as clearly-marked untrusted
     context; the boundary repair round appends the flagged draft and the
     correction note. */
  const callUpstream = (
    web: { query: string; results: WebResult[] } | null,
    streamIt: boolean,
    extra: UpstreamMessage[] = [],
  ) => {
    const messages: UpstreamMessage[] = [...baseMessages]
    if (web) {
      messages.push({
        role: 'system',
        content: web.results.length > 0
          ? formatWebResultsBlock(web.query, web.results, lang)
          : lang === 'fr'
            ? `La recherche web pour « ${web.query} » n'a rien retourné — dis-le plutôt que d'inventer.`
            : `The web search for "${web.query}" returned nothing — say so rather than invent.`,
      })
    }
    messages.push(...extra)
    return postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages,
        temperature: 0.4,
        /* Reasoning params from the route share this budget — headroom so a
           thinking pass can't starve the reply. Route config wins; the
           default leaves room for a real desk read when the person asks for
           a plan or a weighed comparison. */
        max_tokens: routeMaxTokens(found.config, 3000),
        stream: streamIt,
        ...extras,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  }

  /* One round → raw JSON + parsed reply + reasoning. The streamed read
     emits reply deltas through a fresh per-round extractor (the model's
     output is one JSON object — the extractor gates its reply field so
     the action scaffolding never reaches the bubble) and reasoning live. */
  const readRound = async (
    upstream: Response,
    onDelta?: (piece: string) => void,
    onReasoning?: (piece: string) => void,
  ): Promise<{ parsed: PrChatReply | null; reasoning: string }> => {
    if (onDelta || onReasoning) {
      const extractor = createReplyDeltaExtractor()
      const { text, reasoning } = await readUpstreamCompletion(
        upstream,
        (piece) => {
          const visible = extractor.push(piece)
          if (visible) onDelta?.(visible)
        },
        (piece) => onReasoning?.(piece),
      )
      return { parsed: parsePrChatReply(text), reasoning }
    }
    const payload = (await upstream.json()) as {
      choices?: { message?: { content?: string; reasoning_content?: string } }[]
    }
    const msg = payload.choices?.[0]?.message ?? {}
    return {
      parsed: parsePrChatReply(typeof msg.content === 'string' ? msg.content : null),
      reasoning: typeof msg.reasoning_content === 'string' ? msg.reasoning_content : '',
    }
  }

  const upstreamErr = (e: unknown) =>
    `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`

  /* Post-generation boundary — runs on every reply, either tier. Promised
     pickup and send-claims are never in scope (the send is always the
     user's); the desk call on their concrete next move is external-only.
     Flag → one non-streamed repair round → still flagged → fixed
     fallback; suggests and the action drop with the drifted payload —
     an unasked write is half the leak. */
  const screenReply = async (
    draft: PrChatReply,
  ): Promise<{ reply: PrChatReply; reasoning: string }> => {
    const flags = detectPrFlags(draft.reply, lang, advice)
    if (flags.length === 0) return { reply: draft, reasoning: '' }
    console.warn('pr-ai reply crossed a desk line', JSON.stringify(flags))
    try {
      const res = await callUpstream(null, false, [
        {
          role: 'assistant',
          content: JSON.stringify({ reply: draft.reply, suggests: draft.suggests ?? [] }),
        },
        { role: 'user', content: buildPrRepairNote(flags, advice) },
      ])
      if (res.ok) {
        const round = await readRound(res)
        if (
          round.parsed &&
          round.parsed.reply !== '' &&
          detectPrFlags(round.parsed.reply, lang, advice).length === 0
        ) {
          return { reply: round.parsed, reasoning: round.reasoning }
        }
      }
    } catch (e) {
      console.warn('pr-ai repair call failed; suppressing flagged reply', e)
    }
    console.warn('pr-ai boundary-flagged reply suppressed', JSON.stringify(flags))
    return {
      reply: {
        ...draft,
        reply: lang === 'fr' ? PR_FALLBACK_FR : PR_FALLBACK_EN,
        suggests: [],
        action: null,
      },
      reasoning: '',
    }
  }

  if (stream) {
    /* SSE out, SSE in — reasoning streams live to the thinking panel, a
       search hop signals its status, the done event carries the parsed
       payload + row ids + sources. */
    const sse = sseChannel()
    void (async () => {
      try {
        let reasoning = ''
        let webResults: WebResult[] = []
        const res1 = await callUpstream(null, true)
        if (!res1.ok) {
          sse.send({ type: 'error', error: `Upstream returned ${res1.status}`, code: 'upstream' })
          return
        }
        /* Reply text no longer streams mid-flight: each round buffers so
           the boundary screen sees the whole reply before a word reaches
           the bubble, then the screened reply leaves as one delta.
           Reasoning still streams live to the thinking panel. */
        let round = await readRound(
          res1,
          undefined,
          (piece) => sse.send({ type: 'reasoning', text: piece }),
        )
        reasoning = round.reasoning
        let parsed = round.parsed
        /* Search hop — the model may hold its answer for one live-web
           query; round two must reply for real. */
        if (parsed && parsed.reply === '' && parsed.search) {
          sse.send({ type: 'status', code: 'web_search' })
          webResults = await webSearch(parsed.search)
          const res2 = await callUpstream({ query: parsed.search, results: webResults }, true)
          if (!res2.ok) {
            sse.send({ type: 'error', error: `Upstream returned ${res2.status}`, code: 'upstream' })
            return
          }
          round = await readRound(
            res2,
            undefined,
            (piece) => sse.send({ type: 'reasoning', text: piece }),
          )
          if (round.reasoning) reasoning += `\n\n${round.reasoning}`
          parsed = round.parsed
        }
        if (!parsed || parsed.reply === '') {
          sse.send({ type: 'error', error: 'Model returned no usable reply', code: 'unparseable' })
          return
        }
        const screened = await screenReply(parsed)
        parsed = screened.reply
        if (screened.reasoning) reasoning += `\n\n${screened.reasoning}`
        /* The paid-for work is done — a persist hiccup below isn't the
           model's failure. */
        meterOk = true
        sse.send({ type: 'delta', text: parsed.reply })
        const executed = parsed.action
          ? await executeChatAction(admin, userId, parsed.action, desk.campaigns)
          : parsed.actionError
            ? { type: parsed.actionError.type, detail: parsed.actionError.detail, ok: false }
            : null
        const sources = mergeSources(prChatSources(desk.ctx, parsed.reply), webSources(webResults))
        const ids = await persistChatTurns(
          admin, userId, message, parsed.reply, executed, threadId, reasoning, sources,
        )
        await runAfterPersist()
        sse.send({
          type: 'done',
          reply: parsed.reply,
          action: executed,
          suggests: parsed.suggests,
          reasoning: reasoning || null,
          sources,
          ...ids,
        })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        settlePrCall(admin, meter.claimId, meterOk, meterT0)
        sse.close()
      }
    })()
    return sse.response
  }

  let reasoning = ''
  let webResults: WebResult[] = []
  try {
    let res1: Response
    try {
      res1 = await callUpstream(null, false)
    } catch (e) {
      return json({ error: upstreamErr(e), code: 'upstream' }, 502)
    }
    if (!res1.ok) return json({ error: `Upstream returned ${res1.status}`, code: 'upstream' }, 502)
    let round = await readRound(res1)
    reasoning = round.reasoning
    let parsed = round.parsed
    if (parsed && parsed.reply === '' && parsed.search) {
      webResults = await webSearch(parsed.search)
      let res2: Response
      try {
        res2 = await callUpstream({ query: parsed.search, results: webResults }, false)
      } catch (e) {
        return json({ error: upstreamErr(e), code: 'upstream' }, 502)
      }
      if (!res2.ok) return json({ error: `Upstream returned ${res2.status}`, code: 'upstream' }, 502)
      round = await readRound(res2)
      if (round.reasoning) reasoning += `\n\n${round.reasoning}`
      parsed = round.parsed
    }
    if (!parsed || parsed.reply === '') {
      return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)
    }

    const screened = await screenReply(parsed)
    parsed = screened.reply
    if (screened.reasoning) reasoning += `\n\n${screened.reasoning}`
    meterOk = true

    const executed = parsed.action
      ? await executeChatAction(admin, userId, parsed.action, desk.campaigns)
      : parsed.actionError
        ? { type: parsed.actionError.type, detail: parsed.actionError.detail, ok: false }
        : null
    const sources = mergeSources(prChatSources(desk.ctx, parsed.reply), webSources(webResults))
    const ids = await persistChatTurns(
      admin, userId, message, parsed.reply, executed, threadId, reasoning, sources,
    )
    await runAfterPersist()

    return json({
      reply: parsed.reply,
      action: executed,
      suggests: parsed.suggests,
      reasoning: reasoning || null,
      sources,
      ...ids,
    })
  } finally {
    settlePrCall(admin, meter.claimId, meterOk, meterT0)
  }
}

/** Execute a whitelisted additive write on the caller's own rows. Nothing
    here publishes, sends, schedules, or deletes — everything lands as a
    draft or log row the user could have written. A failure reports
    ok:false so the reply can still land. */
async function executeChatAction(
  admin: SupabaseClient,
  userId: string,
  action: PrChatAction,
  campaigns: { id: string; name: string }[],
): Promise<ExecutedAction> {
  switch (action.type) {
    case 'add_campaign': {
      const { data, error } = await admin
        .from('pr_campaigns')
        .insert({
          user_id: userId,
          name: action.name,
          channel: action.channel ?? 'mixed',
          status: 'draft',
          objective: action.objective ?? '',
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: action.name,
        ok: !error,
        refId: data?.id,
        wrote: { name: action.name, channel: action.channel ?? 'mixed', status: 'draft', objective: action.objective ?? '' },
      }
    }
    case 'add_content_item': {
      /* Status is forced — chat can only file drafts, never publish. */
      const campaignRef = action.campaign ? resolveNameRef(action.campaign, campaigns) : null
      if (action.campaign && !campaignRef) {
        return { type: action.type, detail: action.title, ok: false }
      }
      const { data, error } = await admin
        .from('pr_content_items')
        .insert({
          user_id: userId,
          campaign_id: campaignRef?.id ?? null,
          kind: action.kind ?? 'post',
          title: action.title,
          body: action.body ?? '',
          channel: action.channel ?? '',
          status: 'draft',
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: action.title,
        ok: !error,
        refId: data?.id,
        wrote: {
          campaign_id: campaignRef?.id ?? null,
          kind: action.kind ?? 'post',
          title: action.title,
          body: action.body ?? '',
          channel: action.channel ?? '',
          status: 'draft',
        },
      }
    }
    case 'add_media_contact': {
      const { data, error } = await admin
        .from('pr_media_contacts')
        .insert({
          user_id: userId,
          name: action.name,
          outlet: action.outlet ?? '',
          beat: action.beat ?? '',
          email: action.email ?? '',
          note: action.note ?? '',
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: action.name,
        ok: !error,
        refId: data?.id,
        wrote: {
          name: action.name,
          outlet: action.outlet ?? '',
          beat: action.beat ?? '',
          email: action.email ?? '',
          note: action.note ?? '',
        },
      }
    }
    case 'add_mention': {
      /* The url unique index makes a re-filed mention a 23505 — logged
         coverage is a set too, so an existing row satisfies the request
         (with no refId for undo, same as the keyword/prompt cases). */
      const url = action.url ?? ''
      if (url !== '') {
        const { data: existing } = await admin
          .from('pr_mentions')
          .select('id')
          .eq('user_id', userId)
          .eq('url', url)
          .limit(1)
        if (existing?.[0]) {
          return { type: action.type, detail: action.title, ok: true }
        }
      }
      const { data, error } = await admin
        .from('pr_mentions')
        .insert({
          user_id: userId,
          title: action.title,
          source: action.source ?? '',
          url,
          sentiment: action.sentiment ?? 'neutral',
          /* The tone word came from the model's action JSON, not a human
             read — mark it auto like every other machine-suggested tone. */
          sentiment_auto: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (error?.code === '23505') {
        return { type: action.type, detail: action.title, ok: true }
      }
      return {
        type: action.type,
        detail: action.title,
        ok: !error,
        refId: data?.id,
        wrote: { title: action.title, source: action.source ?? '', url, sentiment: action.sentiment ?? 'neutral' },
      }
    }
    case 'add_keyword': {
      /* Idempotent like add_geo_prompt — a tracked keyword that already
         exists returns ok without a refId, so undo can't delete a row the
         person filed themselves. */
      const escaped = action.keyword.replace(/[\\%_]/g, (m) => `\\${m}`)
      const { data: existing } = await admin
        .from('pr_keywords')
        .select('id')
        .eq('user_id', userId)
        .ilike('keyword', escaped)
        .limit(1)
      if (existing?.[0]) {
        return { type: action.type, detail: action.keyword, ok: true }
      }
      const { data, error } = await admin
        .from('pr_keywords')
        .insert({ user_id: userId, keyword: action.keyword, target_url: action.targetUrl ?? '' })
        .select('id')
        .single()
      /* 23505 = a twin landed between the read and the insert — the intent
         (one tracked keyword) is already satisfied. */
      const violated = error?.code === '23505'
      return {
        type: action.type,
        detail: action.keyword,
        ok: violated ? true : !error,
        refId: violated ? undefined : data?.id,
        wrote: violated ? undefined : { keyword: action.keyword, target_url: action.targetUrl ?? '' },
      }
    }
    case 'add_geo_prompt': {
      /* Idempotent — re-asking Paige to track a question it already filed
         returns the existing row instead of duplicating the prompt. ilike
         gives a case-insensitive exact match; % and _ are escaped first. */
      const escaped = action.prompt.replace(/[\\%_]/g, (m) => `\\${m}`)
      const { data: existing } = await admin
        .from('pr_geo_prompts')
        .select('id')
        .eq('user_id', userId)
        .ilike('prompt', escaped)
        .limit(1)
      const found = existing?.[0]
      if (found) {
        /* No refId — undo must only ever delete a row THIS action created;
           handing back a pre-existing id would let chat_undo destroy a
           prompt the person filed themselves. */
        return { type: action.type, detail: action.prompt, ok: true }
      }
      const { data, error } = await admin
        .from('pr_geo_prompts')
        .insert({ user_id: userId, prompt: action.prompt, engine: action.engine ?? 'chatgpt' })
        .select('id')
        .single()
      /* 23505 = the dedupe read lost a race to a twin insert — same as the
         pre-check finding it: tracked already, and nothing this action
         created, so no refId for undo. */
      if (error?.code === '23505') {
        return { type: action.type, detail: action.prompt, ok: true }
      }
      return {
        type: action.type,
        detail: action.prompt,
        ok: !error,
        refId: data?.id,
        wrote: { prompt: action.prompt, engine: action.engine ?? 'chatgpt' },
      }
    }
    case 'update_campaign_status': {
      /* The grammar's one non-additive action — it flips a status field on
         a row the person already has. The previous status rides along as
         prevStatus so chat_undo can put it back. */
      const target = resolveNameRef(action.campaign, campaigns)
      if (!target) return { type: action.type, detail: action.campaign, ok: false }
      const { data: prev, error: readError } = await admin
        .from('pr_campaigns')
        .select('status')
        .eq('id', target.id)
        .eq('user_id', userId)
        .maybeSingle()
      if (readError || !prev) return { type: action.type, detail: action.campaign, ok: false }
      const prevStatus = String(prev.status)
      if (prevStatus === action.status) {
        /* Already there — nothing moved; still stamp prevStatus so an undo
           restores (harmlessly) rather than reporting "nothing to undo". */
        return {
          type: action.type,
          detail: action.campaign,
          ok: true,
          refId: target.id,
          prevStatus,
          wrote: { status: action.status },
        }
      }
      const { error } = await admin
        .from('pr_campaigns')
        .update({ status: action.status, updated_at: new Date().toISOString() })
        .eq('id', target.id)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: `${action.campaign} → ${action.status}`,
        ok: !error,
        refId: target.id,
        prevStatus,
        wrote: { status: action.status },
      }
    }
  }
}

/* ── kind 'chat_undo' ────────────────────────────────────────────────────
   Every action the chat can execute is an additive insert — the inverse is
   uniformly "delete the row it made". The action payload sits on the
   assistant message row, so the undo call names the message; the write is
   then marked undone on that same row so a reload doesn't offer the chip
   again. */

const ACTION_TABLE: Record<string, string> = {
  add_campaign: 'pr_campaigns',
  add_content_item: 'pr_content_items',
  add_media_contact: 'pr_media_contacts',
  add_mention: 'pr_mentions',
  add_keyword: 'pr_keywords',
  add_geo_prompt: 'pr_geo_prompts',
}

/** Reverse one executed action: additive writes delete their row; a status
    flip restores prevStatus. False when the action has nothing reversible —
   including when the live row no longer matches what the action wrote —
   or, for pre-`wrote` actions, what each table's own untouched signal
   proves — because the person has edited it since and the row isn't ours
   to clobber. */
async function undoChatAction(
  admin: SupabaseClient,
  userId: string,
  action: ExecutedAction,
): Promise<boolean> {
  const refId = action.refId
  if (!refId) return false
  /* 'same' → untouched, safe to reverse. 'edited' → the live row carries
     someone's changes; undo must not destroy them. 'gone' → the write is
     already reversed. 'unknown' → the read failed, so nothing is proven —
     an additive undo must not claim "reversed" for a row it couldn't see. */
  const rowState = async (
    table: string,
    intact: (row: Record<string, unknown>) => boolean,
  ) => {
    const { data: row, error } = await admin
      .from(table)
      .select('*')
      .eq('id', refId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) return 'unknown' as const
    if (!row) return 'gone' as const
    return intact(row as Record<string, unknown>) ? ('same' as const) : ('edited' as const)
  }

  if (action.type === 'update_campaign_status') {
    if (typeof action.prevStatus !== 'string' || action.wrote?.status == null) return false
    const state = await rowState('pr_campaigns', (row) =>
      rowMatchesWrote(row, { status: action.wrote?.status }),
    )
    /* The row moved again since (or can't be read) — restoring prevStatus
       would erase the later change; a deleted row has no status to put back.
       No `wrote` → no way to prove the row is still the action's own work. */
    if (state !== 'same') return false
    const { error } = await admin
      .from('pr_campaigns')
      .update({ status: action.prevStatus, updated_at: new Date().toISOString() })
      .eq('id', refId)
      .eq('user_id', userId)
    return !error
  }
  const table = ACTION_TABLE[action.type]
  if (!table) return false
  /* An action persisted before `wrote` existed carries no snapshot — the
     fallback is each table's own "never touched since" signal: mentions
     and contacts are immutable post-insert (the portal has no update path
     for them at all), and keywords/prompts/campaigns/content wear their
     first use in fields the action didn't write. */
  const intact = action.wrote
    ? (row: Record<string, unknown>) => rowMatchesWrote(row, action.wrote as Record<string, unknown>)
    : (LEGACY_UNTOUCHED[table] ?? (() => false))
  const state = await rowState(table, intact)
  if (state === 'edited' || state === 'unknown') return false
  /* Already deleted — the reversal this undo exists to perform is done. */
  if (state === 'gone') return true
  const { error } = await admin
    .from(table)
    .delete()
    .eq('id', refId)
    .eq('user_id', userId)
  return !error
}

/* For actions persisted before `wrote` existed: true when the live row can
   only be the action's own untouched write. Every ACTION_TABLE member must
   appear — a missing table fails closed at the `?? (() => false)` above. */
const LEGACY_UNTOUCHED: Record<string, (row: Record<string, unknown>) => boolean> = {
  /* updated_at still equals created_at → nothing edited the row since the
     action wrote it (every update path bumps updated_at). */
  pr_campaigns: (r) => String(r.updated_at ?? '') === String(r.created_at ?? ''),
  pr_content_items: (r) => String(r.updated_at ?? '') === String(r.created_at ?? ''),
  /* Mentions and contacts have no client update path — an existing row is
     untouched by construction. */
  pr_media_contacts: () => true,
  pr_mentions: () => true,
  /* Chat files a bare keyword — position fields and checked_at stay null
     until a real check runs. */
  pr_keywords: (r) =>
    r.position == null && r.previous_position == null && r.checked_at == null,
  /* A check stamps result + checked_at together; 'unchecked' + no stamp is
     the file-and-wait state the action left. */
  pr_geo_prompts: (r) => (r.result ?? 'unchecked') === 'unchecked' && r.checked_at == null,
}

export async function runChatUndo(
  admin: SupabaseClient,
  userId: string,
  messageId: string,
): Promise<Response> {
  const { data: msg, error } = await admin
    .from('pr_chat_messages')
    .select('id, action')
    .eq('id', messageId)
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .maybeSingle()
  if (error) return json({ error: error.message }, 500)
  const action = (msg?.action ?? null) as ExecutedAction | null
  if (!msg || !action || !action.ok || action.undone === true || !action.refId) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  if (!(await undoChatAction(admin, userId, action))) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  const { error: markError } = await admin
    .from('pr_chat_messages')
    .update({ action: { ...action, undone: true } })
    .eq('id', messageId)
    .eq('user_id', userId)
  if (markError) return json({ error: markError.message }, 500)
  return json({ ok: true })
}

/* ── kind 'react' ─────────────────────────────────────────────────────────
   Paige reacts to what the person just did elsewhere on the desk — a
   mention logged, a content draft saved. No action grammar — one short
   plain-text line that persists to pr_chat_messages so it still exists on
   the next visit; the originating page renders it inline too. */

export function parsePrReactEvent(raw: unknown): PrReactEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const ev = raw as Record<string, unknown>
  if (ev.type === 'mention_logged') {
    const title = typeof ev.title === 'string' ? ev.title.trim().slice(0, 300) : ''
    if (!title) return null
    return {
      type: 'mention_logged',
      title,
      source: typeof ev.source === 'string' ? ev.source.slice(0, 120) : undefined,
      sentiment: typeof ev.sentiment === 'string' ? ev.sentiment.slice(0, 20) : undefined,
    }
  }
  if (ev.type === 'content_saved') {
    const title = typeof ev.title === 'string' ? ev.title.trim().slice(0, 200) : ''
    if (!title) return null
    return {
      type: 'content_saved',
      title,
      kind: typeof ev.kind === 'string' ? ev.kind.slice(0, 40) : undefined,
    }
  }
  if (ev.type === 'campaign_created') {
    const name = typeof ev.name === 'string' ? ev.name.trim().slice(0, 120) : ''
    if (!name) return null
    return {
      type: 'campaign_created',
      name,
      channel: typeof ev.channel === 'string' ? ev.channel.slice(0, 40) : undefined,
    }
  }
  if (ev.type === 'keyword_tracked') {
    const keyword = typeof ev.keyword === 'string' ? ev.keyword.trim().slice(0, 120) : ''
    if (!keyword) return null
    return { type: 'keyword_tracked', keyword }
  }
  if (ev.type === 'contact_added') {
    const name = typeof ev.name === 'string' ? ev.name.trim().slice(0, 120) : ''
    if (!name) return null
    return {
      type: 'contact_added',
      name,
      outlet: typeof ev.outlet === 'string' ? ev.outlet.slice(0, 120) : undefined,
    }
  }
  return null
}

export async function runReact(
  admin: SupabaseClient,
  userId: string,
  event: PrReactEvent,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route
  const desk = await loadDeskContext(admin, userId)

  const meter = await claimPrCall(admin, userId, found)
  if (meter instanceof Response) return meter
  const meterT0 = Date.now()
  let meterOk = false

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [{ role: 'user', content: prReactPrompt(event, desk.ctx, lang, { advice }) }],
        temperature: 0.5,
        max_tokens: 160,
        stream,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    settlePrCall(admin, meter.claimId, false, meterT0)
    return json(
      { error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' },
      502,
    )
  }
  if (!upstream.ok) {
    settlePrCall(admin, meter.claimId, false, meterT0)
    return json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502)
  }

  /* A flagged reaction goes straight to the fixed one-liner — no repair
     round for a two-sentence reply. The text buffers through the screen
     in either mode. */
  const screenText = (raw: string): string => {
    const flags = detectPrFlags(raw, lang, advice)
    if (flags.length === 0) return raw
    console.warn('pr-ai reaction crossed a desk line; fixed reply substituted', JSON.stringify(flags))
    return lang === 'fr' ? PR_REACT_FALLBACK_FR : PR_REACT_FALLBACK_EN
  }

  if (stream) {
    const sse = sseChannel()
    void (async () => {
      try {
        const draft = (await readUpstreamText(upstream, () => {})).trim()
        if (!draft) {
          sse.send({ type: 'error', error: 'Model returned empty text', code: 'empty' })
          return
        }
        const reply = screenText(draft)
        meterOk = true
        sse.send({ type: 'delta', text: reply })
        const { data: row, error: insertErr } = await admin
          .from('pr_chat_messages')
          .insert({ user_id: userId, role: 'assistant', content: reply })
          .select('id')
          .single()
        /* Best-effort persist — the line already reached the page; a
           failed insert means it won't survive reload, so at least say so
           in the log. */
        if (insertErr) console.warn('pr-ai react persist failed', insertErr)
        sse.send({ type: 'done', reply, assistantId: row?.id ?? null })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        settlePrCall(admin, meter.claimId, meterOk, meterT0)
        sse.close()
      }
    })()
    return sse.response
  }

  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const draft = (payload.choices?.[0]?.message?.content ?? '').trim()
  if (!draft) {
    settlePrCall(admin, meter.claimId, false, meterT0)
    return json({ error: 'Model returned empty text', code: 'empty' }, 502)
  }
  const reply = screenText(draft)

  const { data: row, error: insertErr } = await admin
    .from('pr_chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()
  if (insertErr) console.warn('pr-ai react persist failed', insertErr)
  settlePrCall(admin, meter.claimId, true, meterT0)
  return json({ reply, assistantId: row?.id ?? null })
}
