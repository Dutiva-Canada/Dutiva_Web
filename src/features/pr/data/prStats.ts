import type { PrContentItem, PrKeyword, PrMention, PrCampaign } from './types'

/**
 * Pure derivations over the PR state — the Overview and list pages compute
 * these client-side; nothing here is stored as a metric server-side.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Campaigns currently running. */
export function activeCampaigns(campaigns: PrCampaign[]): PrCampaign[] {
  return campaigns.filter((c) => c.status === 'active')
}

/** Content items with a scheduled date that hasn't passed yet, soonest
    first — the Overview's "Coming up" list and the desk's queue. */
export function upcomingContent(
  items: PrContentItem[],
  now: Date = new Date(),
): PrContentItem[] {
  const nowMs = now.getTime()
  return items
    .filter((i) => i.status === 'scheduled' && i.scheduledFor != null)
    .filter((i) => new Date(i.scheduledFor as string).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.scheduledFor as string).getTime() -
        new Date(b.scheduledFor as string).getTime(),
    )
}

/** Mentions inside the last `days` days, newest first. */
export function mentionsInWindow(
  mentions: PrMention[],
  days: number,
  now: Date = new Date(),
): PrMention[] {
  const cutoff = now.getTime() - days * DAY_MS
  return mentions.filter((m) => new Date(m.publishedAt).getTime() >= cutoff)
}

export type RankDelta = 'up' | 'down' | 'flat' | null

/** Which way a keyword moved between the two most recent checks. A lower
    position is better in SEO, so position 15 → 8 is a move "up" of 7. */
export function rankDelta(k: PrKeyword): { dir: RankDelta; spots: number } {
  if (k.position == null || k.previousPosition == null) return { dir: null, spots: 0 }
  const moved = k.previousPosition - k.position
  if (moved === 0) return { dir: 'flat', spots: 0 }
  return { dir: moved > 0 ? 'up' : 'down', spots: Math.abs(moved) }
}

/** Content items linked to a campaign — the campaign table's count cell. */
export function campaignItemCount(items: PrContentItem[], campaignId: string): number {
  return items.filter((i) => i.campaignId === campaignId).length
}

export interface KeywordImportRow {
  keyword: string
  position?: number
  targetUrl?: string
}

/** Parse a pasted keyword export — one `keyword[, position[, url]]` per
    line, commas or tabs. Tolerant of a header row and of extra numeric
    columns (clicks/impressions in a Search Console export): the first
    plausible rank wins, the first URL-shaped cell becomes the target. */
export function parseKeywordImport(text: string): KeywordImportRow[] {
  const out: KeywordImportRow[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const cells = line.split(/[,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const keyword = cells[0] ?? ''
    if (!keyword) continue
    if (out.length === 0 && /^(keyword|query|top quer|mot[- ]?cl|requête)/i.test(keyword)) {
      continue
    }
    /* A URL in the keyword column means a "top pages" export, not a query —
       skip it rather than tracking a domain as a keyword. */
    if (/^(https?:\/\/|\S+\.[a-z]{2,})/i.test(keyword)) continue
    let position: number | undefined
    let targetUrl: string | undefined
    for (const cell of cells.slice(1)) {
      if (position === undefined && cell !== '') {
        const n = Number(cell)
        if (Number.isFinite(n) && n >= 1 && n <= 100) {
          position = Math.round(n)
          continue
        }
      }
      if (targetUrl === undefined && /^(https?:\/\/|\S+\.[a-z]{2,})/i.test(cell)) {
        targetUrl = cell
      }
    }
    out.push({ keyword, position, targetUrl })
  }
  return out
}
