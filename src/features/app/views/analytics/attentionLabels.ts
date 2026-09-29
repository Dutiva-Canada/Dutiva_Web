import type { Bi } from '@/i18n/core'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import type { RankedAttention } from './aggregation'
import { fill } from '@/lib/format'
import { formatDayISO } from './format'

/**
 * Chip copy for a ranked attention item: "Overdue" (red), "Due today" /
 * "Due tomorrow" / "Due in N days" while ≤ 14 days out (amber), then a plain
 * "Due <date>" (neutral).
 */
export function attentionChipLabel(
  ranked: RankedAttention<{ dueISO: string }>,
  x: (b: Bi) => string,
  locale: string,
): string {
  if (ranked.status === 'overdue') return x(M.analytics_attention_overdue)
  if (ranked.status === 'due_soon') {
    if (ranked.daysUntilDue === 0) return x(M.analytics_attention_due_today)
    if (ranked.daysUntilDue === 1) return x(M.analytics_attention_due_tomorrow)
    return fill(x(M.analytics_attention_due_days), { n: ranked.daysUntilDue })
  }
  return fill(x(M.analytics_attention_due_date), {
    date: formatDayISO(ranked.item.dueISO, locale),
  })
}

/** "3 employees · Ontario" / "Ontario" second line. */
export function attentionSecondary(
  jurisdiction: string,
  affected: number | undefined,
  x: (b: Bi) => string,
): string {
  if (affected === undefined) return jurisdiction
  const count =
    affected === 1
      ? x(M.analytics_attention_affected_one)
      : fill(x(M.analytics_attention_affected), { n: affected })
  return `${count} · ${jurisdiction}`
}
