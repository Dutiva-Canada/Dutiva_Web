/**
 * AI insight pass for invest-bot runs — kept separate from index.ts so the
 * prompt builder and parser stay pure and unit-testable under Vitest.
 *
 * The model *describes* the book; it never trades. Output is capped at two
 * `insight`-kind signals carrying both languages (title_fr/body_fr columns),
 * so the portal renders per locale without a second row. Any failure —
 * missing route, upstream error, malformed JSON — resolves to [] and the
 * run completes normally.
 */
import { postChatCompletion, resolveApiKey, routeBodyExtras } from '../_shared/modelUpstream.ts'
import type { MarketSnapshot, Position } from './handlers.ts'
import { convertFx, type FxTable } from './fx.ts'

export interface BookInsight {
  title_en: string
  title_fr: string
  body_en: string
  body_fr: string
  /** 'warn' promotes the signal to alert-kind styling; 'info' keeps the
      neutral insight pill. The model flags declines and risk events as warn —
      an observation about a -7% move should not render identically to a
      quiet-book note while a rule-driven -6% alert wears the warning pill. */
  severity?: 'info' | 'warn'
}

export interface InsightContext {
  snapshots: MarketSnapshot[]
  positions: (Position & { name?: string })[]
  cashTotal: number
  signalsEmitted: number
  ordersPlanned: number
  /** ECB rates + the book's currency. Without them the book total and every
      position weight would sum raw numbers across currencies — the same
      bug the portal's split-total view exists to prevent. */
  fx?: FxTable | null
  bookCurrency?: string
}

const MAX_INSIGHTS = 2
const MAX_FIELD = 400

/** Compact, factual book summary — the only thing the model sees. */
export function buildInsightPrompt(ctx: InsightContext): string {
  const priceBySymbol = new Map<string, MarketSnapshot>()
  for (const s of ctx.snapshots) priceBySymbol.set(`${s.asset_class}:${s.symbol}`, s)

  const bookCurrency = (ctx.bookCurrency ?? 'CAD').toUpperCase()
  const toBook = (amount: number, currency: string): number | null =>
    convertFx(amount, currency, bookCurrency, ctx.fx ?? null)

  let bookValue = 0
  let bookComplete = true
  for (const p of ctx.positions) {
    const snap = priceBySymbol.get(`${p.asset_class}:${p.symbol}`)
    if (!snap) continue
    const v = toBook(p.quantity * snap.price, snap.currency)
    if (v === null) {
      bookComplete = false
      continue
    }
    bookValue += v
  }

  const lines: string[] = [
    `Positions marked: ${ctx.positions.length}; book value ~${bookValue.toFixed(2)} ${bookCurrency}` +
      (bookComplete ? '' : ' (some positions unpriced — no FX rate)') +
      `; cash ${ctx.cashTotal.toFixed(2)} ${bookCurrency}.`,
  ]
  for (const p of ctx.positions) {
    const snap = priceBySymbol.get(`${p.asset_class}:${p.symbol}`)
    const px = snap?.price ?? 0
    const bookVal = snap ? toBook(p.quantity * snap.price, snap.currency) : null
    const weight = bookValue > 0 && bookVal !== null ? (bookVal / bookValue) * 100 : null
    /* Unrealized compares cost and mark in the same currency — convert both
       legs to the book currency rather than differencing across currencies. */
    const costCurrency = p.currency ?? snap?.currency
    const pxBook = snap ? toBook(snap.price, snap.currency) : null
    const costBook = costCurrency ? toBook(p.avg_cost, costCurrency) : null
    const gain =
      p.avg_cost > 0 && pxBook !== null && pxBook > 0 && costBook !== null && costBook > 0
        ? (((pxBook - costBook) / costBook) * 100).toFixed(1)
        : null
    lines.push(
      `- ${p.symbol} (${p.asset_class}): ${p.quantity} @ ${p.avg_cost.toFixed(2)}` +
        (px > 0 ? `, last ${px.toFixed(2)} ${snap?.currency ?? ''}` : '') +
        (weight !== null ? `, weight ${weight.toFixed(1)}%` : '') +
        (gain !== null ? `, unrealized ${gain}%` : ''),
    )
  }
  const movers = ctx.snapshots
    .filter((s) => s.day_change_pct !== null && Math.abs(s.day_change_pct) >= 3)
    .sort((a, b) => Math.abs(b.day_change_pct ?? 0) - Math.abs(a.day_change_pct ?? 0))
    .slice(0, 5)
  if (movers.length > 0) {
    lines.push(
      'Notable moves: ' +
        movers.map((s) => `${s.symbol} ${s.day_change_pct?.toFixed(1)}%`).join(', ') +
        '.',
    )
  }
  lines.push(`Rules fired: ${ctx.signalsEmitted} signal(s), ${ctx.ordersPlanned} paper order(s).`)
  return lines.join('\n')
}

const SYSTEM_PROMPT = `You write short portfolio-review observations for an investing portal.
Given a factual book summary, produce up to 2 observations a careful human
reviewer would note: concentration vs stated rules, idle cash vs strategy
intent, outsized single-day moves on held positions, or a quiet book worth
noting. Plain language, concrete numbers. No advice verbs — never tell the
reader to buy, sell, or hold; describe what happened and what the rules say.
Output ONLY a JSON array, each element:
{"title_en","title_fr","body_en","body_fr","severity"} — English and Canadian
French, same hedge strength. severity is "warn" when the observation flags a
decline, concentration breach, or other risk needing attention; "info"
otherwise. Max 2 items, empty array when nothing is noteworthy.`

/* Internal-staff tier — a @dutiva.ca book may be advised on, not just
   described. Same output contract and the same cap; only the verb rule
   changes. */
const SYSTEM_PROMPT_INTERNAL = SYSTEM_PROMPT.replace(
  'No advice verbs — never tell the\nreader to buy, sell, or hold; describe what happened and what the rules say.',
  'Internal staff account (@dutiva.ca) — advice is in scope: name what a careful reviewer would do next, plainly, with the numbers. Still no promised returns, no price predictions.',
)

export function insightSystemPrompt(advice: boolean): string {
  return advice ? SYSTEM_PROMPT_INTERNAL : SYSTEM_PROMPT
}

/** Extract the insights array from model output — tolerant of code fences. */
export function parseInsights(raw: string): BookInsight[] {
  const text = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end <= start) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const out: BookInsight[] = []
  for (const item of parsed) {
    if (item === null || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const t = (k: string) =>
      typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, MAX_FIELD) : ''
    const insight: BookInsight = {
      title_en: t('title_en'),
      title_fr: t('title_fr'),
      body_en: t('body_en'),
      body_fr: t('body_fr'),
      severity: o.severity === 'warn' ? 'warn' : 'info',
    }
    if (!insight.title_en || !insight.body_en) continue
    out.push(insight)
    if (out.length >= MAX_INSIGHTS) break
  }
  return out
}

/**
 * Resolve the invest model route (`invest_ai`, falling back to
 * `advisor_chat`) and ask for ≤2 book insights. Returns [] on any failure —
 * the caller's deterministic run must survive an AI outage.
 */
export async function maybeEmitInsights(
  adminClient: any,
  ctx: InsightContext,
  opts?: { advice?: boolean },
): Promise<BookInsight[]> {
  try {
    if (ctx.positions.length === 0 && ctx.cashTotal <= 0) return []

    let route: any = null
    let provider: any = null
    for (const routeKey of ['invest_ai', 'advisor_chat']) {
      const { data } = await adminClient
        .from('ai_model_routes')
        .select(
          'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
        )
        .eq('route_key', routeKey)
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (data?.provider && data.provider.status === 'active') {
        route = data
        provider = data.provider
        break
      }
    }
    if (!route || !provider) return []

    const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
    if ('missingSecret' in keyResult) return []

    const upstream = await postChatCompletion(
      provider,
      keyResult.apiKey,
      {
        model: route.model_name,
        messages: [
          { role: 'system', content: insightSystemPrompt(opts?.advice === true) },
          { role: 'user', content: buildInsightPrompt(ctx) },
        ],
        /* Reasoning effort consumes the same token budget — a high-effort
           pass alone measured ~2,000 completion tokens, so the ceiling needs
           real headroom or the insights starve to an empty body. */
        max_tokens: 6000,
        temperature: 0.3,
        ...routeBodyExtras(route.config),
      },
      /* High-effort reasoning takes tens of seconds — the sweep is async, so
         the timeout must outlive the thinking pass or it silently returns []. */
      120_000,
    )
    if (!upstream.ok) return []

    const completion = await upstream.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return []
    return parseInsights(content)
  } catch (error) {
    console.error('invest-bot: insight pass failed', error)
    return []
  }
}
