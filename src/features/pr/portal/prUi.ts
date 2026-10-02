import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { prMessages as PM } from '@/i18n/messages/pr'
import type {
  PrCampaignStatus,
  PrChannel,
  PrContentKind,
  PrContentStatus,
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
export const SENTIMENTS = Object.keys(SENTIMENT_LABELS) as PrSentiment[]

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
