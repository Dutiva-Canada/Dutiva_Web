import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { prMessages as PM } from '@/i18n/messages/pr'
import type {
  PrCampaignStatus,
  PrChannel,
  PrContentKind,
  PrContentStatus,
  PrGeoEngine,
  PrGeoResult,
  PrSentiment,
} from '@/features/pr/data/types'

/** Localized labels for the constrained vocabularies — forms render these,
    and they must cover every value the migration CHECK constraints allow. */
export const CHANNEL_LABELS: Record<PrChannel, Bi> = {
  mixed: PM.pr_chan_mixed,
  social: PM.pr_chan_social,
  search: PM.pr_chan_search,
  display: PM.pr_chan_display,
  email: PM.pr_chan_email,
  press: PM.pr_chan_press,
  events: PM.pr_chan_events,
  other: PM.pr_chan_other,
}

export const CAMPAIGN_STATUS_LABELS: Record<PrCampaignStatus, Bi> = {
  draft: PM.pr_status_draft,
  active: PM.pr_status_active,
  paused: PM.pr_status_paused,
  done: PM.pr_status_done,
}

export const CONTENT_KIND_LABELS: Record<PrContentKind, Bi> = {
  post: PM.pr_kind_post,
  release: PM.pr_kind_release,
  ad: PM.pr_kind_ad,
  article: PM.pr_kind_article,
  brief: PM.pr_kind_brief,
}

export const CONTENT_STATUS_LABELS: Record<PrContentStatus, Bi> = {
  draft: PM.pr_status_draft,
  scheduled: PM.pr_status_scheduled,
  published: PM.pr_status_published,
}

export const SENTIMENT_LABELS: Record<PrSentiment, Bi> = {
  positive: PM.pr_men_positive,
  neutral: PM.pr_men_neutral,
  negative: PM.pr_men_negative,
}

export const CHANNELS = Object.keys(CHANNEL_LABELS) as PrChannel[]
export const CAMPAIGN_STATUSES = Object.keys(CAMPAIGN_STATUS_LABELS) as PrCampaignStatus[]
export const CONTENT_KINDS = Object.keys(CONTENT_KIND_LABELS) as PrContentKind[]
export const CONTENT_STATUSES = Object.keys(CONTENT_STATUS_LABELS) as PrContentStatus[]
export const GEO_ENGINE_LABELS: Record<PrGeoEngine, Bi> = {
  chatgpt: PM.pr_ans_engine_chatgpt,
  perplexity: PM.pr_ans_engine_perplexity,
  gemini: PM.pr_ans_engine_gemini,
  copilot: PM.pr_ans_engine_copilot,
  other: PM.pr_ans_engine_other,
}

export const GEO_RESULT_LABELS: Record<PrGeoResult, Bi> = {
  unchecked: PM.pr_ans_res_unchecked,
  cited: PM.pr_ans_res_cited,
  mentioned: PM.pr_ans_res_mentioned,
  absent: PM.pr_ans_res_absent,
}

export const SENTIMENTS = Object.keys(SENTIMENT_LABELS) as PrSentiment[]
export const GEO_ENGINES = Object.keys(GEO_ENGINE_LABELS) as PrGeoEngine[]
export const GEO_RESULTS = Object.keys(GEO_RESULT_LABELS) as PrGeoResult[]

export function channelLabel(c: PrChannel, lang: Lang): string {
  return pick(CHANNEL_LABELS[c] ?? PM.pr_chan_other, lang)
}

export function campaignStatusLabel(s: PrCampaignStatus, lang: Lang): string {
  return pick(CAMPAIGN_STATUS_LABELS[s] ?? PM.pr_status_draft, lang)
}

export function contentKindLabel(k: PrContentKind, lang: Lang): string {
  return pick(CONTENT_KIND_LABELS[k] ?? PM.pr_kind_post, lang)
}

export function contentStatusLabel(s: PrContentStatus, lang: Lang): string {
  return pick(CONTENT_STATUS_LABELS[s] ?? PM.pr_status_draft, lang)
}

export function sentimentLabel(s: PrSentiment, lang: Lang): string {
  return pick(SENTIMENT_LABELS[s] ?? PM.pr_men_neutral, lang)
}

export function geoEngineLabel(e: PrGeoEngine, lang: Lang): string {
  return pick(GEO_ENGINE_LABELS[e] ?? PM.pr_ans_engine_other, lang)
}

export function geoResultLabel(r: PrGeoResult, lang: Lang): string {
  return pick(GEO_RESULT_LABELS[r] ?? PM.pr_ans_res_unchecked, lang)
}

const dateFmt = (lang: Lang, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', opts)

/** "Oct 4, 3:30 p.m." — compact timestamp for scheduled/dated rows. */
export function fmtDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/** "Oct 4, 2026" — campaign dates, mention dates. */
export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

/** "$1,250 CAD" — campaign budgets. */
export function fmtCad(amount: number | null, lang: Lang): string {
  if (amount == null) return '—'
  const n = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return lang === 'fr' ? `${n} $` : `$${n}`
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

/** Paige's opening turn on an empty conversation — one breath: hello, at
    most one thing she noticed (drafts waiting for review, else recent
    coverage, else the active campaign count), then a question.
    Deterministic and bilingual, so she speaks first without a model call. */
export function paigeGreeting(
  state: { campaigns: { status: string }[]; contentItems: { status: string }[]; mentions: { publishedAt: string }[] } | undefined,
  lang: Lang,
  now: Date = new Date(),
): string {
  const parts = [pick(PM.pr_chat_hi, lang)]
  if (state) {
    const drafts = state.contentItems.filter((c) => c.status === 'draft').length
    const recent = state.mentions.filter(
      (m) => Date.parse(m.publishedAt) >= now.getTime() - MONTH_MS,
    ).length
    const active = state.campaigns.filter((c) => c.status === 'active').length
    if (drafts >= 1) {
      parts.push(pick(PM.pr_chat_hi_drafts, lang).replace('{count}', String(drafts)))
    } else if (recent >= 1) {
      parts.push(pick(PM.pr_chat_hi_mentions, lang).replace('{count}', String(recent)))
    } else if (active >= 1) {
      parts.push(pick(PM.pr_chat_hi_campaigns, lang).replace('{count}', String(active)))
    }
  }
  parts.push(pick(PM.pr_chat_hi_ask, lang))
  return parts.join(' ')
}

/** The Overview strip — Paige's presence outside the chat tab. One thing
    she noticed, picked deterministically from local state (no call): drafts
    waiting for review, else coverage from the last 30 days, else the active
    campaign count. Null means nothing worth noticing; the strip stays
    hidden. */
export function paigeNoticed(
  state: { campaigns: { status: string }[]; contentItems: { status: string }[]; mentions: { publishedAt: string }[] } | undefined,
  lang: Lang,
  now: Date = new Date(),
): string | null {
  if (!state) return null
  const drafts = state.contentItems.filter((c) => c.status === 'draft').length
  if (drafts >= 1) {
    return pick(PM.pr_home_paige_drafts, lang).replace('{count}', String(drafts))
  }
  const recent = state.mentions.filter(
    (m) => Date.parse(m.publishedAt) >= now.getTime() - MONTH_MS,
  ).length
  if (recent >= 1) {
    return pick(PM.pr_home_paige_mentions, lang).replace('{count}', String(recent))
  }
  const active = state.campaigns.filter((c) => c.status === 'active').length
  if (active >= 1) {
    return pick(PM.pr_home_paige_campaigns, lang).replace('{count}', String(active))
  }
  return null
}
