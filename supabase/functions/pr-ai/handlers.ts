/**
 * pr-ai — pure prompt/parse helpers, split out so vitest can cover them
 * without the edge runtime.
 */
import { detectHonestClaims, detectPatterns } from '../_shared/adviceScreen.ts'

export const PR_SENTIMENTS = ['positive', 'neutral', 'negative'] as const
export type PrSentiment = (typeof PR_SENTIMENTS)[number]

const TONE_WORDS = new Map<string, PrSentiment>([
  ['positive', 'positive'], ['positif', 'positive'], ['favorable', 'positive'],
  ['neutral', 'neutral'], ['neutre', 'neutral'],
  ['negative', 'negative'], ['négatif', 'negative'], ['negatif', 'negative'], ['unfavorable', 'negative'],
])

/** Extract one tone word from a short model reply — tolerates numbering
    ("2. positive"), punctuation, and French labels. Anything ambiguous or
    empty maps to null so the caller decides (manual form keeps its value,
    ingest falls back to 'neutral'). */
export function parseTone(raw: string): PrSentiment | null {
  const text = raw.trim().toLowerCase()
  if (!text) return null
  const first = text.split('\n').find((l) => l.trim() !== '') ?? ''
  const cleaned = first.replace(/^\s*\d+[.)-]?\s*/, '').replace(/[^a-zàâäçéèêëîïôöùûü\s-]/gi, '')
  for (const word of cleaned.split(/[\s-]+/)) {
    const hit = TONE_WORDS.get(word)
    if (hit) return hit
  }
  return null
}

/** Batch version for feed ingest — the model gets numbered headlines and
    answers one tone per line. Positions must survive: a garbled line yields
    null in place rather than shifting every later tone onto the wrong
    headline. Extra lines (a preamble, a sign-off) are trimmed by picking
    the count-window with the most real verdicts. Null = "no usable verdict
    for this headline", so the caller stores neutral without claiming the
    model tagged it. */
export function parseToneList(raw: string, count: number): (PrSentiment | null)[] {
  const lines = raw
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => parseTone(l))
  if (lines.length <= count) {
    while (lines.length < count) lines.push(null)
    return lines
  }
  let best = lines.slice(0, count)
  let bestNulls = best.filter((t) => t === null).length
  for (let i = 1; i + count <= lines.length; i++) {
    const nulls = lines.slice(i, i + count).filter((t) => t === null).length
    if (nulls < bestNulls) {
      best = lines.slice(i, i + count)
      bestNulls = nulls
    }
  }
  return best
}

export function tonePrompt(headlines: string[]): string {
  const list = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
  return [
    'You are tagging press coverage for a Canadian company\'s PR desk. For each numbered headline, judge the tone TOWARD THE COVERED COMPANY — positive, neutral, or negative — not the topic itself.',
    'Answer with exactly one word per line, in order: positive, neutral, or negative. No numbering, no explanations.',
    '',
    list,
  ].join('\n')
}

export function singleTonePrompt(title: string, source: string): string {
  return [
    'You are tagging one piece of press coverage for a Canadian company\'s PR desk. Judge the tone TOWARD THE COVERED COMPANY — positive, neutral, or negative — not the topic itself.',
    'Answer with exactly one word: positive, neutral, or negative.',
    '',
    `Headline: ${title}`,
    source ? `Outlet: ${source}` : '',
  ].filter(Boolean).join('\n')
}

/** Strip model scaffolding — surrounding quotes, "Here's a draft" preambles,
    markdown headers — without touching the draft itself. */
export function cleanDraft(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/,'').trim()
  const lines = text.split('\n')
  while (lines.length > 0) {
    const first = (lines[0] ?? '').trim()
    if (
      first === '' ||
      /^#+\s/.test(first) ||
      /* \b can't anchor after the non-word à — lookahead for the boundary
         instead. The colon is required: "Voici une offre…" or "Here at
         Dutiva…" is real content, not scaffolding. */
      /^(here|voici|voil[aà])(?=[\s:：]|$).*[:：]\s*$/i.test(first) && first.length < 80
    ) {
      lines.shift()
      continue
    }
    break
  }
  while (lines.length > 0 && (lines[lines.length - 1] ?? '').trim() === '') lines.pop()
  return lines.join('\n').trim()
}

export interface DraftInput {
  itemKind: string
  channel: string
  title: string
  notes: string
  lang: 'en' | 'fr'
}

export function draftPrompt(input: DraftInput): string {
  const langLine = input.lang === 'fr'
    ? 'Write in Canadian French.'
    : 'Write in Canadian English.'
  const len = input.itemKind === 'post' || input.itemKind === 'social'
    ? 'Keep it under 60 words — short enough to post as-is.'
    : 'Aim for 120–180 words.'
  return [
    'You help the Dutiva PR desk draft communications materials. Dutiva is a Canadian HR-compliance platform (dutiva.ca).',
    'Write a first draft only — concrete, plain, no hype words, no emoji, no hashtags unless the channel is social. A human edits before anything ships.',
    langLine,
    len,
    '',
    `Type: ${input.itemKind}`,
    input.channel ? `Channel: ${input.channel}` : '',
    `Working title: ${input.title}`,
    input.notes ? `Notes to work from: ${input.notes}` : '',
    '',
    'Return only the draft text.',
  ].filter((l) => l !== undefined).join('\n')
}

/* ---------- coverage themes ---------- */

export interface ClusterItem {
  title: string
  source: string
}
export interface Cluster {
  theme: string
  /** 0-based indices into the submitted items array. */
  indices: number[]
}

export function clustersPrompt(items: ClusterItem[]): string {
  const list = items
    .map((it, i) => `${i + 1}. ${it.title}${it.source ? ` — ${it.source}` : ''}`)
    .join('\n')
  return [
    'You are grouping press headlines for a PR desk. Group the numbered items into 2–4 broad themes (e.g. product news, criticism, an industry topic). Theme names should be short — two to five words.',
    'Return one line per theme, in exactly this format: Theme name | 1,3,5',
    'Use only item numbers that exist, and each headline may appear in at most one theme. Skip any headline that fits no theme. No preamble, no explanations.',
    '',
    list,
  ].join('\n')
}

/** Parse "Theme name | 1,3,5" lines. Anything malformed is dropped — a
    partial grouping beats a failed one, and no invented indices escape. */
export function parseClusters(raw: string, count: number): Cluster[] {
  const clusters: Cluster[] = []
  for (const line of raw.split('\n')) {
    if (clusters.length >= 4) break
    const t = line.trim()
    if (!t) continue
    const bar = t.lastIndexOf('|')
    if (bar < 0) continue
    const theme = t.slice(0, bar).replace(/^[-*•\d.\s]+/, '').trim()
    const indices = [...new Set(
      t.slice(bar + 1)
        .split(/[,\s]+/)
        .map((n) => parseInt(n, 10) - 1)
        .filter((n) => Number.isInteger(n) && n >= 0 && n < count),
    )]
    if (!theme || indices.length === 0) continue
    clusters.push({ theme: theme.slice(0, 80), indices })
  }
  return clusters
}

/* ---------- monthly report intro ---------- */

export function summaryPrompt(
  statsJson: string,
  monthLabel: string,
  lang: 'en' | 'fr',
  advice = false,
): string {
  const langLine = lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.'
  return [
    'You write the intro line of a monthly PR report. Two or three plain sentences describing ONLY the numbers provided — what was logged, nothing predictive' +
      (advice
        ? '; internal staff account — if the numbers point somewhere, close with the one sensible next move.'
        : ' and no advice.') +
      ' Name the month. If the numbers are thin, say so honestly in one sentence.',
    langLine,
    'Return only the intro text — no preamble, no heading.',
    '',
    `Month: ${monthLabel}`,
    `Numbers: ${statsJson}`,
  ].join('\n')
}

/* ---------- GEO prompt suggestions ---------- */

export interface PromptsInput {
  campaigns: string[]
  existing: string[]
  lang: 'en' | 'fr'
}

export function promptsPrompt(input: PromptsInput): string {
  const langLine = input.lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.'
  return [
    'A PR desk tracks whether AI assistants mention their brand. Suggest 3 new questions a real person might type into an assistant where the brand could plausibly appear — about its category, alternatives, or problems it solves. The brand is Dutiva, a Canadian HR-compliance platform (dutiva.ca).',
    'Each suggestion must read like a natural question, not a keyword phrase. Do not repeat the already-tracked questions.',
    langLine,
    'Return exactly 3 lines, one question per line. No numbering, no preamble.',
    '',
    input.campaigns.length > 0 ? `Current campaigns: ${input.campaigns.join(' · ')}` : '',
    input.existing.length > 0 ? `Already tracked: ${input.existing.join(' | ')}` : '',
  ].filter((l) => l !== undefined).join('\n')
}

/* ---------- journalist pitch drafts ---------- */

export interface PitchInput {
  name: string
  outlet: string
  beat: string
  note: string
  campaigns: string[]
  lang: 'en' | 'fr'
}

export function pitchPrompt(input: PitchInput): string {
  const langLine = input.lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.'
  return [
    'You help a PR desk draft a short pitch email to a journalist. The brand is Dutiva, a Canadian HR-compliance platform (dutiva.ca).',
    'Format: first line must be exactly "Subject: <subject line>", then a blank line, then the body. The body is 4–6 sentences, ends with one clear ask, no hype words, no emoji. A human edits and sends it — the pitch never goes out automatically.',
    langLine,
    'Return only the formatted pitch.',
    '',
    `Journalist: ${input.name}`,
    input.outlet ? `Outlet: ${input.outlet}` : '',
    input.beat ? `Beat: ${input.beat}` : '',
    input.note ? `Note on file: ${input.note}` : '',
    input.campaigns.length > 0 ? `What we are pitching: ${input.campaigns.join(' · ')}` : '',
  ].filter((l) => l !== undefined).join('\n')
}

/** "Subject: …" line + body. If the model skipped the subject line the whole
    reply becomes the body and the caller supplies a fallback subject — but
    an empty body is unrecoverable. */
export function parsePitch(raw: string): { subject: string; body: string } | null {
  const text = raw.trim().replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim()
  if (!text) return null
  const lines = text.split('\n')
  const subjIdx = lines.findIndex((l) => /^\s*subject\s*[:：]/i.test(l))
  if (subjIdx < 0) return { subject: '', body: text }
  const subject = lines[subjIdx]!.replace(/^\s*subject\s*[:：]\s*/i, '').trim().slice(0, 200)
  const body = lines.slice(subjIdx + 1).join('\n').trim()
  if (!body) return null
  return { subject, body }
}

/** Numbered/bulleted lines → clean prompt strings, deduped case-insensitively
    against already-tracked prompts and each other. */
export function parsePromptList(raw: string, existing: string[], max = 3): string[] {
  const seen = new Set(existing.map((e) => e.trim().toLowerCase()))
  const out: string[] = []
  for (const line of raw.split('\n')) {
    if (out.length >= max) break
    const t = line
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
      .trim()
      .replace(/^["“]|["”]$/g, '')
    if (t.length < 8 || t.length > 300) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

/* ── Chat — the portal's conversational surface ─────────────────────────────
   The model sees the same data the portal pages show — campaign names and
   statuses, content titles, contact cards, tracked keywords, coverage
   headlines, GEO prompts, connection statuses — capped per list. It can act
   only through the additive grammar below: everything lands as a draft or a
   log entry the user could have created themselves. It never publishes,
   sends, deletes, or touches the outside world. */

export interface PrChatContext {
  campaigns: { name: string; status: string; channel: string }[]
  contentByStatus: Record<string, number>
  recentContent: string[]
  contacts: { name: string; outlet: string; beat: string }[]
  keywords: { keyword: string; position: number | null }[]
  mentionsBySentiment: Record<string, number>
  recentMentions: { title: string; source: string; url: string | null }[]
  geoPrompts: { prompt: string; result: string }[]
  feeds: number
  connections: { provider: string; status: string }[]
}

export type PrChatAction =
  | { type: 'add_campaign'; name: string; channel?: string; objective?: string }
  | {
      type: 'add_content_item'
      title: string
      kind?: string
      channel?: string
      body?: string
      campaign?: string
    }
  | {
      type: 'add_media_contact'
      name: string
      outlet?: string
      beat?: string
      email?: string
      note?: string
    }
  | {
      type: 'add_mention'
      title: string
      source?: string
      url?: string
      sentiment?: string
    }
  | { type: 'add_keyword'; keyword: string; targetUrl?: string }
  | { type: 'add_geo_prompt'; prompt: string; engine?: string }
  | {
      type: 'update_campaign_status'
      /** Existing campaign name — resolved against the desk list. */
      campaign: string
      status: 'draft' | 'active' | 'paused' | 'done'
    }

export interface PrChatReply {
  reply: string
  action: PrChatAction | null
  /* Short next-prompt chips the client shows as tappable follow-ups —
     ephemeral: they ride the reply payload, never the stored turn. */
  suggests: string[]
  /* A live-web query the model wants run before answering — one bounded
     hop for current coverage/events outside the desk rows. The server
     runs it; the model never sees or emits a URL. Null on every final
     reply. */
  search: string | null
  /* The model emitted an "action" object that failed validation — the reply
     still lands, but the caller surfaces it as a failed action chip rather
     than dropping the whole turn or executing a half-understood write. */
  actionError?: { type: string; detail: string }
}

export const PR_CHAT_ACTION_TYPES = new Set([
  'add_campaign',
  'add_content_item',
  'add_media_contact',
  'add_mention',
  'add_keyword',
  'add_geo_prompt',
  'update_campaign_status',
])

const CHANNELS = new Set([
  'mixed', 'social', 'search', 'display', 'email', 'press', 'events', 'other',
])
const CAMPAIGN_STATUSES = new Set(['draft', 'active', 'paused', 'done'])
const CONTENT_KINDS = new Set(['post', 'release', 'ad', 'article', 'brief'])
const ENGINES = new Set(['chatgpt', 'perplexity', 'gemini', 'copilot', 'other'])

/** Loose field sanitation — the model's optional slots are dropped when they
    don't look like what they claim, never corrected into something else. */
const optStr = (v: unknown, max = 200): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim().slice(0, max)
  return t === '' ? undefined : t
}
const optUrl = (v: unknown): string | undefined => {
  const t = optStr(v, 500)
  return t && /^https?:\/\/\S+$/i.test(t) ? t : undefined
}
const optEmail = (v: unknown): string | undefined => {
  const t = optStr(v, 200)
  return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : undefined
}
const optEnum = (v: unknown, allowed: Set<string>): string | undefined =>
  typeof v === 'string' && allowed.has(v.trim().toLowerCase())
    ? v.trim().toLowerCase()
    : undefined

export function prChatPrompt(
  ctx: PrChatContext,
  lang: 'en' | 'fr',
  opts?: { advice?: boolean },
): {
  role: 'system'
  content: string
} {
  const lines = (items: string[]): string =>
    items.length === 0 ? '  (none)' : items.map((i) => `  - ${i}`).join('\n')
  return {
    role: 'system',
    content: [
      'You are Paige, the resident press specialist of a PR desk inside Dutiva (a Canadian HR-compliance platform). You think like a desk editor — organized, plain-spoken, media-literate. Desk questions answer from the desk data below — if it cannot answer the question, say so plainly.',
      'How Paige works: replies sized to the ask — quick questions stay tight, a strategy or weighing question earns the full desk read. What the data shows first, then the next sensible step. She never hypes (a desk that cannot spot spin should not write it), never promises pickup or coverage, and never invents a number, a quote, a contact, or a headline that is not below. She is software, not a person and not an agency — if the person seems to want a human comms professional, say so plainly.',
      'You MAY teach — a media-literate desk explains its craft. Explain press and PR concepts plainly (what an embargo, an exclusive, a wire service, a press kit, or a boilerplate is; earned vs owned vs paid coverage; how AI answer engines decide which brands to name), describe common approaches in the abstract (follow-up etiquette, news pegs, when a pitch beats a release), and give generic examples clearly framed as examples — never invented "real" cases.',
      opts?.advice
        ? 'INTERNAL STAFF DESK (@dutiva.ca) — advise like a desk editor who owns the call: rank the outlets, name the angle, say which draft to cut or ship first, and give a frank read on their materials — weak work gets called weak, with what to do next. Still never invent coverage, contacts, or numbers, never promise pickup, and the send is always theirs — you never take that step yourself.'
        : 'Asked "what do you think?", answer like a desk editor — honest views on general approaches ("embargoes mostly annoy journalists unless the news is genuinely big", "a short pitch usually beats a release blast") and a frank read on their own materials when they share them — a weak subject line gets called weak. What you never do is predict coverage: a view on an approach is not a promise of pickup. And the send is always theirs — you can frame the considerations behind contacting someone or publishing something, but you never take that step yourself.',
      'You can RECORD things when the person asks. To act, end your JSON reply with an "action" object — the system executes it against their desk. Allowed actions:',
      '  {"type":"add_campaign","name":"<name>","channel":"<mixed|social|search|display|email|press|events|other>","objective":"<short>"}',
      '  {"type":"add_content_item","title":"<title>","kind":"<post|release|ad|article|brief>","channel":"<optional>","body":"<optional draft text>","campaign":"<existing campaign name>"}',
      '  {"type":"add_media_contact","name":"<name>","outlet":"<optional>","beat":"<optional>","email":"<optional>"}',
      '  {"type":"add_mention","title":"<headline>","source":"<outlet>","url":"<optional>","sentiment":"<positive|neutral|negative>"}',
      '  {"type":"add_keyword","keyword":"<term>","targetUrl":"<optional>"}',
      '  {"type":"add_geo_prompt","prompt":"<question to track>","engine":"<chatgpt|perplexity|gemini|copilot|other>"}',
      '  {"type":"update_campaign_status","campaign":"<existing campaign name>","status":"<draft|active|paused|done>"}   — the one non-additive action; it only flips a status field, nothing else moves',
      'Everything you add lands as a draft or a log entry the person could have created themselves. You never publish, schedule, send, delete, or contact anyone — if asked for that, say you cannot and point to the page that does it (Content publishes, Review holds suggestions, Media drafts pitches).',
      'Only emit an action the person actually asked for. If a campaign name does not match the list below, ask which one they mean instead of guessing.',
      lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.',
      'Output ONLY strict JSON: {"reply":"<sized to the ask — a sentence or two for quick questions; when they want a strategy, a plan, or options weighed, go as deep as the desk data supports — bold labels, short bullets, a small table when comparing>","action":<object or null>,"suggests":["<prompt>"]}. No markdown fences.',
      'One exception before you answer: if the question turns on current coverage or events outside the desk rows — who covered something this week, a breaking story, a trend worth riding — you may reply {"reply":"","action":null,"search":"<one web query>"} and the live search results come back to you. Use it at most once per turn; if the results are thin or off-topic, say so rather than inventing coverage.',
      '"suggests" holds up to 3 short things the person might ask or tell you next — each under 8 words, same language as the reply, and genuinely useful (not restatements of your answer). They are asks, not commands — the chip sends a message, it does not act. Omit the field or send an empty array when the exchange is clearly finished.',
      '',
      'Desk data:',
      `Campaigns (${ctx.campaigns.length}):`,
      lines(ctx.campaigns.map((c) => `"${c.name}" — ${c.status}, ${c.channel}`)),
      `Content items by status: ${JSON.stringify(ctx.contentByStatus)}`,
      'Recent content:',
      lines(ctx.recentContent),
      `Media contacts (${ctx.contacts.length}):`,
      lines(
        ctx.contacts.map((c) =>
          `"${c.name}"${c.outlet ? ` — ${c.outlet}` : ''}${c.beat ? ` (${c.beat})` : ''}`,
        ),
      ),
      'Tracked keywords:',
      lines(
        ctx.keywords.map(
          (k) => `"${k.keyword}"${k.position !== null ? ` — position ${k.position}` : ' — unchecked'}`,
        ),
      ),
      `Coverage by tone: ${JSON.stringify(ctx.mentionsBySentiment)}`,
      'Recent coverage:',
      lines(ctx.recentMentions.map((m) => `"${m.title}"${m.source ? ` — ${m.source}` : ''}`)),
      'AI-answer questions tracked:',
      lines(ctx.geoPrompts.map((g) => `"${g.prompt}" — last check: ${g.result}`)),
      `Feeds connected: ${ctx.feeds}`,
      'Platform connections:',
      lines(ctx.connections.map((c) => `${c.provider}: ${c.status}`)),
    ].join('\n'),
  }
}

/** Sources the reply grounded on — the desk's own coverage rows. A mention
    counts when the reply names its headline; the model never emits URLs, so
    a link can only point at a row that exists. */
export function prChatSources(
  ctx: PrChatContext,
  reply: string,
): { label: string; url?: string }[] {
  const sources: { label: string; url?: string }[] = []
  const seen = new Set<string>()
  for (const m of ctx.recentMentions) {
    if (m.title.length > 8 && reply.includes(m.title)) {
      const label = `"${m.title}"${m.source ? ` — ${m.source}` : ''}`
      if (seen.has(label)) continue
      seen.add(label)
      sources.push({ label, ...(m.url ? { url: m.url } : {}) })
    }
  }
  return sources.slice(0, 8)
}

/** Strict JSON reply from the model. Fully unparseable output returns null —
    the caller files a plain-text fallback. A reply with a malformed/unknown
    action survives: the action is dropped, actionError is set, and the caller
    reports it as a failed write rather than executing something it
    half-understood. */
export function parsePrChatReply(raw: string | null | undefined): PrChatReply | null {
  if (!raw) return null
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown
      action?: unknown
      suggests?: unknown
      search?: unknown
    }
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
    /* `search` is the one-hop escape — a live-web query the server runs;
       an empty reply is only legal while one is outstanding. */
    const search =
      typeof obj.search === 'string' && obj.search.trim() !== ''
        ? obj.search.trim().replace(/\s+/g, ' ').slice(0, 160)
        : null
    if (!reply && !search) return null
    /* Follow-up chips — kept only as clean short strings; malformed or
       oversized entries drop out rather than fail the whole reply. */
    const suggests = Array.isArray(obj.suggests)
      ? obj.suggests
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim().slice(0, 120))
          .filter((s) => s !== '')
          .slice(0, 3)
      : []
    const finish = (
      action: PrChatAction | null,
      actionError?: { type: string; detail: string },
    ): PrChatReply => ({
      reply,
      suggests,
      search,
      action,
      ...(actionError ? { actionError } : {}),
    })
    /* A malformed action must not sink the whole turn — the reply text is
       fine on its own, so the action degrades to a failed chip. */
    const failed = (a: Record<string, unknown>): PrChatReply =>
      finish(null, {
        type: optStr(a.type, 40) ?? 'malformed',
        detail:
          optStr(a.name ?? a.title ?? a.keyword ?? a.prompt ?? a.campaign, 120) ?? '',
      })
    const a = obj.action
    if (a === null || a === undefined) return finish(null)
    if (typeof a !== 'object') return failed({})
    const action = a as Record<string, unknown>
    if (typeof action.type !== 'string' || !PR_CHAT_ACTION_TYPES.has(action.type)) {
      return failed(action)
    }
    switch (action.type) {
      case 'add_campaign': {
        const name = optStr(action.name, 120)
        if (!name) return failed(action)
        return finish({
          type: 'add_campaign',
          name,
          channel: optEnum(action.channel, CHANNELS),
          objective: optStr(action.objective, 300),
        })
      }
      case 'add_content_item': {
        const title = optStr(action.title, 200)
        if (!title) return failed(action)
        return finish({
          type: 'add_content_item',
          title,
          kind: optEnum(action.kind, CONTENT_KINDS),
          channel: optStr(action.channel, 60),
          body: optStr(action.body, 4000),
          campaign: optStr(action.campaign, 120),
        })
      }
      case 'add_media_contact': {
        const name = optStr(action.name, 120)
        if (!name) return failed(action)
        return finish({
          type: 'add_media_contact',
          name,
          outlet: optStr(action.outlet, 120),
          beat: optStr(action.beat, 80),
          email: optEmail(action.email),
          note: optStr(action.note, 500),
        })
      }
      case 'add_mention': {
        const title = optStr(action.title, 300)
        if (!title) return failed(action)
        return finish({
          type: 'add_mention',
          title,
          source: optStr(action.source, 120),
          url: optUrl(action.url),
          sentiment: optEnum(action.sentiment, new Set(PR_SENTIMENTS)),
        })
      }
      case 'add_keyword': {
        const keyword = optStr(action.keyword, 120)
        if (!keyword) return failed(action)
        return finish({ type: 'add_keyword', keyword, targetUrl: optUrl(action.targetUrl) })
      }
      case 'add_geo_prompt': {
        const prompt = optStr(action.prompt, 300)
        if (!prompt || prompt.length < 8) return failed(action)
        return finish({ type: 'add_geo_prompt', prompt, engine: optEnum(action.engine, ENGINES) })
      }
      case 'update_campaign_status': {
        const campaign = optStr(action.campaign, 120)
        const status = optEnum(action.status, CAMPAIGN_STATUSES)
        if (!campaign || !status) return failed(action)
        return finish({ type: 'update_campaign_status', campaign, status: status as 'draft' | 'active' | 'paused' | 'done' })
      }
    }
    /* A Set member without a case above (a future type) still degrades to a
       failed chip — never a swallowed turn. */
    return failed(action)
  } catch {
    return null
  }
}

/** Resolve a name the model mentioned — exact (case-insensitive) first, then
    a unique substring match. Ambiguous or absent → null, so the caller can
    report ok:false rather than attach to the wrong row. */
export function resolveNameRef(
  named: string,
  rows: { id: string; name: string }[],
): { id: string; name: string } | null {
  const needle = named.trim().toLowerCase()
  if (!needle) return null
  const exact = rows.filter((r) => r.name.trim().toLowerCase() === needle)
  if (exact.length === 1) return exact[0]
  const partial = rows.filter((r) => r.name.trim().toLowerCase().includes(needle))
  return partial.length === 1 ? partial[0] : null
}

/* ── kind 'react' — Paige noticing what the user just did ──────────────────
   One short plain-text line when a desk action lands elsewhere in the
   portal — a mention logged, a content draft saved. No action grammar; the
   desk context below is read-only here. */

export type PrReactEvent =
  | { type: 'mention_logged'; title: string; source?: string; sentiment?: string }
  | { type: 'content_saved'; title: string; kind?: string }
  | { type: 'campaign_created'; name: string; channel?: string }
  | { type: 'keyword_tracked'; keyword: string }
  | { type: 'contact_added'; name: string; outlet?: string }

export function prReactPrompt(
  event: PrReactEvent,
  ctx: PrChatContext,
  lang: 'en' | 'fr',
  opts?: { advice?: boolean },
): string {
  const what =
    event.type === 'mention_logged'
      ? `just logged a press mention: "${event.title.slice(0, 200)}"${event.source ? ` (${event.source.slice(0, 120)})` : ''}${event.sentiment ? ` — tagged ${event.sentiment}` : ''}`
      : event.type === 'content_saved'
        ? `just saved a content draft: "${event.title.slice(0, 200)}"${event.kind ? ` — a ${event.kind}` : ''}`
        : event.type === 'campaign_created'
          ? `just created a campaign: "${event.name.slice(0, 120)}"${event.channel ? ` — ${event.channel}` : ''}`
          : event.type === 'keyword_tracked'
            ? `just started tracking the keyword "${event.keyword.slice(0, 120)}"`
            : `just added a media contact: "${event.name.slice(0, 120)}"${event.outlet ? ` (${event.outlet.slice(0, 120)})` : ''}`
  /* Wider than counts — recent titles and names let the observation point at
     something concrete without inventing coverage. */
  const contextBits = [
    `mentions this window by tone: ${JSON.stringify(ctx.mentionsBySentiment)}`,
    ctx.recentMentions.length > 0
      ? `recent coverage: ${ctx.recentMentions.slice(0, 4).map((m) => `"${m.title}"${m.source ? ` (${m.source})` : ''}`).join('; ')}`
      : '',
    `content items by status: ${JSON.stringify(ctx.contentByStatus)}`,
    ctx.recentContent.length > 0 ? `recent drafts: ${ctx.recentContent.slice(0, 4).join('; ')}` : '',
    ctx.campaigns.length > 0 ? `campaigns: ${ctx.campaigns.map((c) => `"${c.name}" (${c.status})`).join(', ')}` : '',
    ctx.keywords.length > 0 ? `tracked keywords: ${ctx.keywords.map((k) => `"${k.keyword}"`).join(', ')}` : '',
    `contacts on file: ${ctx.contacts.length}`,
  ].filter(Boolean).join('\n')
  return [
    'You are Paige, the press specialist of a PR desk — organized, plain-spoken, media-literate, software not a person.',
    `The person ${what}. React in one or two short sentences: name what they did plainly, and if the desk data below offers one grounded observation (coverage trending, drafts piling up, an active campaign it could belong to, a contact's beat), work it in naturally. No hype, no promises of pickup${opts?.advice ? ' — internal staff account, so a frank read or a concrete next step is welcome' : ', no advice beyond one practical nudge at most'}.`,
    'Plain text only — no JSON, no lists, no emoji.',
    lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.',
    '',
    'Desk data (read-only context):',
    contextBits,
  ].join('\n')
}

/* ── Output screens — the deterministic backstop behind the prompt ─────────
   Two different boundaries are enforced here:

   1. The universal line binds EVERY tier — Paige never promises or
      predicts pickup (even the internal desk editor "never promises
      pickup") and never claims the send happened or offers to take it.
      The send is always the user's; actions stay whitelisted drafts, and
      a prose claim of outreach is a lie, not a capability.
   2. The directed line binds only the external tier — external gets a
      frank read on materials and views on approaches, but not the desk
      call on their concrete next move ("ship draft B", "pitch The Logic
      first"). Verdicts on materials stay allowed ("a weak subject line
      gets called weak") — the patterns target the action call, not the
      read.

   Internal @dutiva.ca replies run only the universal table — the desk
   call is in scope there; the pickup and send lines are not. */
const UNIVERSAL_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\b(?:will|would|is\s+going\s+to|should|could|might|'ll)\s+(?:get|land|earn|pick\s+up|be\s+picked\s+up|secure|attract|generate|drive|bring)\s+(?:you\s+)?(?:some\s+|any\s+|real\s+|actual\s+|press\s+|media\s+|earned\s+)?(?:coverage|pickup|press|media\s+(?:attention|coverage)|mentions?|hits|articles?|stories|features|placements?|interviews?)(?!\w)/i,
    /\b(?:reporters?|journalists?|editors?|outlets?|the\s+press|media|producers?|bloggers?)\s+(?:will|would|are\s+going\s+to|'ll|should|could)\s+(?:cover|pick|run|bite|love|want|respond|be\s+interested|jump|write|feature)(?!\w)/i,
    /\b(?:this|it|the\s+(?:pitch|story|angle|release))\s+(?:will|would|could|should|might)\s+(?:get|earn|land|attract|drive|generate)\s+(?:coverage|press|pickup|traction|attention|mentions?|hits)(?!\w)/i,
    /\bi\s+(?:sent|emailed|mailed|pitched|submitted|fired\s+off|shot\s+over|distributed|put\s+(?:it|this|that)\s+out|reached\s+out|contacted)(?!\w)/i,
    /\bi(?:'ll|\s+will)?\s+(?:send|email|pitch|fire\s+off|reach\s+out|submit|distribute|take\s+care\s+of\s+(?:sending|pitching)|handle\s+the\s+(?:send|outreach|pitch))\s+(?:it|this|that|the|to|for|out)(?!\w)/i,
    /\b(?:it'?s|it\s+(?:is|has\s+been))\s+sent(?!\w)/i,
  ],
  fr: [
    /\b(?:journalistes?|médias?|rédactions?|reporters?|la\s+presse)\s+(?:vont|couvriront|reprendront|publieront|s'intéresseront|adoreront|aimeront|en\s+parleront)(?!\w)/i,
    /\b(?:vous\s+)?(?:aurez|obtiendrez|décrocherez|attirerez|générerez|vaudra)\s+(?:de\s+la\s+|des\s+|une\s+)?(?:couverture|presse|retombées|mentions?|articles?|reportages?|entrevues?)(?!\w)/i,
    /(?:ça|cela|ceci|ce\s+(?:pitch|texte|communiqué|sujet))\s+(?:va|pourrait|devrait|va\s+vous)\s+(?:vous\s+)?(?:décrocher|valoir|attirer|donner)\s+(?:de\s+la\s+|des\s+|une\s+)?(?:couverture|presse|retombées|traction|attention)(?!\w)/i,
    /\bj'ai\s+(?:envoyé|expédié|pitché|transmis|distribué|fait\s+parvenir|contacté|écrit)(?!\w)/i,
    /\bje\s+(?:vais|m'occupe\s+de|prends\s+en\s+charge|peux)\s+(?:l'|le|la|les|vous\s+)?\s*(?:envoyer|expédier|pitcher|transmettre|distribuer|publier|envoi|diffusion)(?!\w)/i,
    /\bc'est\s+envoyé(?!\w)/i,
  ],
}

const DIRECTED_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\byou\s+(?:should|must|need\s+to|ought\s+to|want\s+to|might\s+want\s+to)\s+(?:pitch|send|email|submit|distribute|contact|reach\s+out|follow\s+up|go\s+with|run\s+with|lead\s+with|cut|kill|scrap|drop|ship|publish|post|release|embargo|offer|call|book|hire)(?!\w)/i,
    /\b(?:pitch|send|email|submit|contact|approach|target|reach\s+out\s+to)\s+(?:it\s+to|the\s+pitch\s+to|this\s+to|them|them\s+first|outlets?\s+like)(?!\w)/i,
    /\b(?:ship|send|run|lead\s+with|go\s+with|publish|release|push)\s+(?:this\s+one|that\s+one|this|that|draft|the\s+draft|version|it|the\s+second|the\s+first)(?!\w)/i,
    /\bmy\s+(?:pick|call|verdict|recommendation|money)\s+(?:is|would\s+be|:|'?s\s+on)(?!\w)/i,
    /\bi(?:'d|\s+would)\s+(?:pitch|send|go\s+with|lead\s+with|pick|choose|run|cut|kill|scrap|drop|ship|lead)(?!\w)/i,
    /\bthat(?:'s|\s+is)\s+the\s+(?:one|one\s+to\s+(?:send|ship|run|pitch|lead\s+with))(?!\w)/i,
  ],
  fr: [
    /\bvous\s+(?:devriez|pouvez|auriez\s+intérêt\s+à|gagneriez\s+à|feriez\s+bien\s+de|devriez|devez)\s+(?:le|la|les|l'|en|y|leur)?\s*(?:pitcher|envoyer|contacter|soumettre|distribuer|relancer|choisir|retenir|publier|proposer|offrir|mettre|couper|laisser\s+tomber|appeler|embaucher)(?!\w)/i,
    /\bje\s+(?:vous\s+)?(?:recommande|conseille|suggère|préconise)\s+(?:de\s+|d')?(?:pitcher|envoyer|contacter|choisir|retenir|publier|soumettre|couper)/i,
    /\b(?:envoyez|pitchez|contactez|soumettez|publiez|retenez|choisissez|coupez|relancez|appelez|embauchez)\s+(?:le|la|les|ce|cette|des|vos|votre)/i,
    /\bc'est\s+(?:celle|celui|la\s+version|le\s+texte)\s+à\s+(?:envoyer|publier|retenir|choisir|envoyer)(?!\w)/i,
    /\bmon\s+(?:choix|appel|verdict|argent)\s+(?:est|serait|:|irait\s+à)(?!\w)/i,
    /\bje\s+(?:pitcherais|enverrais|choisirais|retiendrais|publierais|couperais|lancerais)(?!\w)/i,
  ],
}

/* Promise-words run through the negation-aware matcher — "can't promise
   coverage" is the honest deflection, not a violation. */
const PROMISE_WORD_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\b(?:guarantee\w*|promise\w*)\s+(?:you\s+)?(?:of\s+|a\s+|an\s+|the\s+)?(?:coverage|pickup|press|placement|story|hit)(?!\w)/i,
  ],
  fr: [
    /\b(?:garantir|garantie|promets?|promesse)\s+(?:de\s+)?(?:la\s+|des\s+|une\s+)?(?:couverture|presse|retombée|parution)(?!\w)/i,
  ],
}

/** Fragments crossing a boundary, matched per tier. Empty = clean. */
export function detectPrFlags(text: string, lang: 'en' | 'fr', advice: boolean): string[] {
  const hits = [
    ...detectPatterns(text, UNIVERSAL_PATTERNS[lang]),
    ...detectHonestClaims(text, PROMISE_WORD_PATTERNS[lang]),
  ]
  if (advice) return hits
  return [...hits, ...detectPatterns(text, DIRECTED_PATTERNS[lang])]
}

/** The repair note behind a flagged reply — names what crossed so the
    rewrite fixes the boundary instead of hedging. */
export function buildPrRepairNote(flags: string[], advice: boolean): string {
  return (
    'Your reply crossed a line the desk never crosses — flagged:\n' +
    flags.map((f) => `- "${f}"`).join('\n') +
    '\nRewrite it with no prediction or promise of coverage and no claim or offer that you send, pitch, or contact anyone — ' +
    (advice
      ? 'the desk call itself is fine for this internal account. '
      : 'a frank read on the materials is fine; the call on their next move is theirs. ') +
    'Keep the same language and the same JSON contract.'
  )
}

/** The fixed text that replaces a flagged reply the repair pass could not
    clean — the desk's promise stated plainly. */
export const PR_FALLBACK_EN =
  'Whether an outlet picks it up is their call — I can’t predict that, and the send is always yours to take. What I can do is keep working the materials with you: the angle, the subject line, the list. Where do you want to look?'
export const PR_FALLBACK_FR =
  'C’est le média qui décide s’il reprend le texte — je ne peux pas le prédire, et l’envoi vous revient toujours. Ce que je peux faire : continuer de travailler le matériel avec vous — l’angle, l’objet, la liste. Par où voulez-vous regarder ?'

/** One-liner for flagged reaction replies — they are too small to repair. */
export const PR_REACT_FALLBACK_EN = 'Noted on the desk — the next move is yours.'
export const PR_REACT_FALLBACK_FR = 'C’est noté au desk — la prochaine décision vous revient.'

/* ── undo snapshot ────────────────────────────────────────────────────────
   chat_undo must only reverse what the action itself wrote. Each executed
   action records the fields it set (`wrote`); before deleting or restoring,
   the live row is compared to that snapshot so an undo never destroys an
   edit the person made in between. */

/** True when every `wrote` field still equals the live row's value.
   Comparison is by string after null/undefined collapse — the snapshot
   travels through JSONB, so Postgres-native types (ints, timestamptz)
   come back as whatever the serializer produced; String() levels that.
   Missing/null writes match a null column; '' and null both read as
   absent on this schema's text columns. */
export function rowMatchesWrote(
  row: Record<string, unknown>,
  wrote: Record<string, unknown>,
): boolean {
  for (const [key, want] of Object.entries(wrote)) {
    const live = row[key]
    if (String(live ?? '') !== String(want ?? '')) return false
  }
  return true
}

/* ── regenerate pair scan ────────────────────────────────────────────────
   chat_regenerate re-asks the newest user turn and replaces the reply on
   top of it. Paige's reaction lines land in the default conversation as
   bare assistant rows AFTER the pair, so "the last two rows" isn't always
   the pair — scan back for the user turn. */

/** Locate the pair a regenerate re-asks: the newest user turn and the
   assistant row directly on top of it. Rows are newest-first (the API's
   desc order). Null when the newest user turn has no assistant row right
   above it — a send still in flight, or a user turn that never answered. */
export function findRegenPair<T extends { role: string }>(
  rowsNewestFirst: T[],
): { user: T; reply: T } | null {
  const userIdx = rowsNewestFirst.findIndex((r) => r.role === 'user')
  if (userIdx < 1) return null
  const reply = rowsNewestFirst[userIdx - 1]
  if (!reply || reply.role !== 'assistant') return null
  const user = rowsNewestFirst[userIdx]
  return user ? { user, reply } : null
}
