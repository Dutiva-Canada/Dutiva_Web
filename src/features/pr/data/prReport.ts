import type { PrState } from './types'

/**
 * Monthly desk summary — pure derivation over PrState so the report page and
 * the Markdown export share one source of truth (and vitest can cover it).
 * Campaigns are a point-in-time snapshot (statuses aren't period-bound);
 * everything else is filtered to the selected calendar month.
 */

export interface PrReportMentionLine {
  title: string
  source: string
  sentiment: string
  publishedAt: string
}

export interface PrReportContentLine {
  title: string
  kind: string
  url: string
}

export interface PrReportKeywordLine {
  keyword: string
  position: number | null
  previousPosition: number | null
}

export interface PrReport {
  /** 'YYYY-MM' the report covers. */
  month: string
  coverage: {
    total: number
    positive: number
    neutral: number
    negative: number
    /** Up to three outlets by mention count. */
    topOutlets: { source: string; count: number }[]
    items: PrReportMentionLine[]
  }
  content: {
    publishedCount: number
    items: PrReportContentLine[]
  }
  campaigns: {
    total: number
    draft: number
    active: number
    paused: number
    done: number
  }
  search: {
    checked: number
    up: number
    down: number
    flat: number
    keywords: PrReportKeywordLine[]
  }
  answers: {
    checked: number
    cited: number
    mentioned: number
    absent: number
    viaAuto: number
    viaManual: number
  }
}

function inMonth(iso: string | null | undefined, month: string): boolean {
  return typeof iso === 'string' && iso.slice(0, 7) === month
}

/** Months that contain any desk data, newest first — plus the current month
    so an empty fresh month is still selectable. */
export function reportMonths(state: PrState, nowIso = new Date().toISOString()): string[] {
  const months = new Set<string>([nowIso.slice(0, 7)])
  for (const m of state.mentions) months.add(m.publishedAt.slice(0, 7))
  for (const c of state.contentItems) {
    if (c.publishedAt) months.add(c.publishedAt.slice(0, 7))
  }
  for (const g of state.geoPrompts) {
    if (g.checkedAt) months.add(g.checkedAt.slice(0, 7))
  }
  for (const k of state.keywords) {
    if (k.checkedAt) months.add(k.checkedAt.slice(0, 7))
  }
  return [...months].filter((m) => /^\d{4}-\d{2}$/.test(m)).sort().reverse()
}

export function buildPrReport(state: PrState, month: string): PrReport {
  const monthMentions = state.mentions.filter((m) => inMonth(m.publishedAt, month))
  const outletCounts = new Map<string, number>()
  for (const m of monthMentions) {
    const key = m.source.trim() === '' ? '—' : m.source
    outletCounts.set(key, (outletCounts.get(key) ?? 0) + 1)
  }
  const topOutlets = [...outletCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))
    .slice(0, 3)

  const published = state.contentItems.filter(
    (c) => c.status === 'published' && inMonth(c.publishedAt, month),
  )

  const checkedKeywords = state.keywords.filter((k) => inMonth(k.checkedAt, month))
  let up = 0
  let down = 0
  let flat = 0
  for (const k of checkedKeywords) {
    if (k.position == null || k.previousPosition == null) {
      flat += 1
    } else if (k.position < k.previousPosition) {
      up += 1 /* smaller position number = better rank */
    } else if (k.position > k.previousPosition) {
      down += 1
    } else {
      flat += 1
    }
  }

  const checkedGeo = state.geoPrompts.filter((g) => inMonth(g.checkedAt, month))

  const statusCount = (s: string) => state.campaigns.filter((c) => c.status === s).length

  return {
    month,
    coverage: {
      total: monthMentions.length,
      positive: monthMentions.filter((m) => m.sentiment === 'positive').length,
      neutral: monthMentions.filter((m) => m.sentiment === 'neutral').length,
      negative: monthMentions.filter((m) => m.sentiment === 'negative').length,
      topOutlets,
      items: monthMentions
        .slice()
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .map((m) => ({
          title: m.title,
          source: m.source,
          sentiment: m.sentiment,
          publishedAt: m.publishedAt,
        })),
    },
    content: {
      publishedCount: published.length,
      items: published.map((c) => ({
        title: c.title,
        kind: c.kind,
        url: c.publishedUrl ?? '',
      })),
    },
    campaigns: {
      total: state.campaigns.length,
      draft: statusCount('draft'),
      active: statusCount('active'),
      paused: statusCount('paused'),
      done: statusCount('done'),
    },
    search: {
      checked: checkedKeywords.length,
      up,
      down,
      flat,
      keywords: checkedKeywords.map((k) => ({
        keyword: k.keyword,
        position: k.position,
        previousPosition: k.previousPosition,
      })),
    },
    answers: {
      checked: checkedGeo.length,
      cited: checkedGeo.filter((g) => g.result === 'cited').length,
      mentioned: checkedGeo.filter((g) => g.result === 'mentioned').length,
      absent: checkedGeo.filter((g) => g.result === 'absent').length,
      viaAuto: checkedGeo.filter((g) => g.checkedVia === 'auto').length,
      viaManual: checkedGeo.filter((g) => g.checkedVia === 'manual').length,
    },
  }
}
