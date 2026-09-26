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
import {
  postChatCompletion,
  resolveApiKey,
} from '../_shared/modelUpstream.ts'
import type { MarketSnapshot, Position } from './handlers.ts'

export interface BookInsight {
  title_en: string
  title_fr: string
  body_en: string
  body_fr: string
}

export interface InsightContext {
  snapshots: MarketSnapshot[]
  positions: (Position & { name?: string })[]
  cashTotal: number
  signalsEmitted: number
  ordersPlanned: number
}

const MAX_INSIGHTS = 2
const MAX_FIELD = 400

/** Compact, factual book summary — the only thing the model sees. */
export function buildInsightPrompt(ctx: InsightContext): string {
  const priceBySymbol = new Map<string, MarketSnapshot>()
  for (const s of ctx.snapshots) priceBySymbol.set(`${s.asset_class}:${s.symbol}`, s)

  let bookValue = 0
  for (const p of ctx.positions) {
    bookValue += p.quantity * (priceBySymbol.get(`${p.asset_class}:${p.symbol}`)?.price ?? 0)
  }

  const lines: string[] = [
    `Positions marked: ${ctx.positions.length}; book value ~${bookValue.toFixed(2)}; cash ${ctx.cashTotal.toFixed(2)}.`,
  ]
  for (const p of ctx.positions) {
    const snap = priceBySymbol.get(`${p.asset_class}:${p.symbol}`)
    const px = snap?.price ?? 0
    const weight = bookValue > 0 ? ((p.quantity * px) / bookValue) * 100 : 0
    const gain = p.avg_cost > 0 && px > 0 ? (((px - p.avg_cost) / p.avg_cost) * 100).toFixed(1) : null
    lines.push(
      `- ${p.symbol} (${p.asset_class}): ${p.quantity} @ ${p.avg_cost.toFixed(2)}` +
        (px > 0 ? `, last ${px.toFixed(2)} ${snap?.currency ?? ''}, weight ${weight.toFixed(1)}%` : '') +
        (gain !== null ? `, unrealized ${gain}%` : ''),
    )
  }
  const movers = ctx.snapshots
    .filter((s) => s.day_change_pct !== null && Math.abs(s.day_change_pct) >= 3)
    .sort((a, b) => Math.abs(b.day_change_pct ?? 0) - Math.abs(a.day_change_pct ?? 0))
    .slice(0, 5)
  if (movers.length > 0) {
    lines.push('Notable moves: ' + movers.map((s) => `${s.symbol} ${s.day_change_pct?.toFixed(1)}%`).join(', ') + '.')
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
{"title_en","title_fr","body_en","body_fr"} — English and Canadian French,
same hedge strength. Max 2 items, empty array when nothing is noteworthy.`

/** Extract the insights array from model output — tolerant of code fences. */
export function parseInsights(raw: string): BookInsight[] {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
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
    const t = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, MAX_FIELD) : '')
    const insight = {
      title_en: t('title_en'),
      title_fr: t('title_fr'),
      body_en: t('body_en'),
      body_fr: t('body_fr'),
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
): Promise<BookInsight[]> {
  try {
    if (ctx.positions.length === 0 && ctx.cashTotal <= 0) return []

    let route: any = null
    let provider: any = null
    for (const routeKey of ['invest_ai', 'advisor_chat']) {
      const { data } = await adminClient
        .from('ai_model_routes')
        .select('id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)')
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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildInsightPrompt(ctx) },
        ],
        max_tokens: 600,
        temperature: 0.3,
      },
      30_000,
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
