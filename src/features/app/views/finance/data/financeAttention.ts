import type { Bi } from '@/i18n/core'
import type { FinanceWorkspaceState } from './types'

/**
 * Derived "needs attention" items for the Finance Overview.
 *
 * These are computed from workspace state at render time — nothing is
 * persisted and no server-side jobs run. They surface dates the user
 * already entered (call due dates, maturities, deal targets) so the
 * overview reads as a to-do list rather than a dashboard of facts.
 */

export type FinanceAttentionKind = 'capital_call' | 'commitment_call' | 'debt' | 'deal'

export type FinanceAttentionSeverity = 'overdue' | 'due_soon' | 'upcoming'

export interface FinanceAttentionItem {
  key: string
  kind: FinanceAttentionKind
  severity: FinanceAttentionSeverity
  /** Row label — bilingual where the source row carries a Bi label. */
  title: Bi | string
  /** Optional bilingual qualifier rendered before the detail line. */
  qualifier?: Bi
  /** Language-neutral detail line (dates, amounts, references). */
  sub: string
  date: string
  to: string
}

type AttentionInput = Pick<
  FinanceWorkspaceState,
  'capitalCalls' | 'commitments' | 'debts' | 'deals'
>

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(date: string, today: string): number {
  const d = new Date(date + 'T00:00:00Z').getTime()
  const t = new Date(today + 'T00:00:00Z').getTime()
  return Math.round((d - t) / DAY_MS)
}

/** Calls that are still live (not yet received/cancelled). */
function liveCalls(input: AttentionInput, today: string): FinanceAttentionItem[] {
  return input.capitalCalls
    .filter((call) => call.status === 'scheduled' || call.status === 'notified')
    .flatMap((call) => {
      const commitment = input.commitments.find((c) => c.id === call.commitmentId)
      const days = daysUntil(call.dueDate, today)
      if (days > 30) return []
      const partner = commitment?.label ?? call.reference ?? call.id
      return [
        {
          key: `call-${call.id}`,
          kind: 'capital_call' as const,
          severity: days < 0 ? ('overdue' as const) : ('due_soon' as const),
          title: partner,
          sub: `${commitment?.currency ?? ''} ${call.amount} · ${call.dueDate}${
            call.reference ? ` · ${call.reference}` : ''
          }`,
          date: call.dueDate,
          to: '/app/finance/deals',
        },
      ]
    })
}

/**
 * Upcoming calls flagged on the commitment itself (nextCallDate).
 * Skipped when a live capital call already covers the same commitment —
 * the call row is the more precise signal.
 */
function commitmentCalls(input: AttentionInput, today: string): FinanceAttentionItem[] {
  const covered = new Set(input.capitalCalls.map((call) => call.commitmentId))
  return input.commitments
    .filter((c) => c.status === 'active' && c.nextCallDate && !covered.has(c.id))
    .flatMap((c) => {
      const days = daysUntil(c.nextCallDate as string, today)
      if (days > 30) return []
      return [
        {
          key: `cmt-${c.id}`,
          kind: 'commitment_call' as const,
          severity: days < 0 ? ('overdue' as const) : ('upcoming' as const),
          title: c.label ?? c.id,
          sub: `${c.currency} ${c.committed} · ${c.nextCallDate}`,
          date: c.nextCallDate as string,
          to: '/app/finance/deals',
        },
      ]
    })
}

/** Active debts maturing inside 90 days (matches the Treasury chip). */
function maturingDebts(input: AttentionInput, today: string): FinanceAttentionItem[] {
  return input.debts
    .filter((d) => d.status === 'active')
    .flatMap((d) => {
      const days = daysUntil(d.maturityDate, today)
      if (days > 90) return []
      return [
        {
          key: `debt-${d.id}`,
          kind: 'debt' as const,
          severity: days < 0 ? ('overdue' as const) : ('due_soon' as const),
          title: d.label,
          qualifier: d.lender,
          sub: `${d.currency} ${d.balance} · ${d.maturityDate}`,
          date: d.maturityDate,
          to: '/app/finance/treasury',
        },
      ]
    })
}

/** Open deals whose target date has passed. */
function dealsPastTarget(input: AttentionInput, today: string): FinanceAttentionItem[] {
  return input.deals
    .filter((d) => d.stage !== 'closed' && d.stage !== 'passed' && d.targetDate)
    .flatMap((d) => {
      const days = daysUntil(d.targetDate as string, today)
      if (days >= 0) return []
      return [
        {
          key: `deal-${d.id}`,
          kind: 'deal' as const,
          severity: 'overdue' as const,
          title: d.name,
          sub: `${d.counterparty ?? ''} · ${d.targetDate}`.replace(/^ · /, ''),
          date: d.targetDate as string,
          to: '/app/finance/deals',
        },
      ]
    })
}

export function computeFinanceAttention(
  input: AttentionInput,
  today: string,
): FinanceAttentionItem[] {
  return [...liveCalls(input, today), ...commitmentCalls(input, today), ...maturingDebts(input, today), ...dealsPastTarget(input, today)]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)
}
