import { describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { computeFinanceAttention, type FinanceAttentionItem } from './financeAttention'
import type { FinanceCapitalCall, FinanceCommitment } from './dealTypes'
import type { FinanceDebt, FinanceDeal } from './types'

const TODAY = '2026-09-25'

function commitment(over: Partial<FinanceCommitment> = {}): FinanceCommitment {
  return {
    id: 'cmt-1',
    entityId: 'ent-2',
    partyId: 'party-inv-1',
    label: bi('Growth equity commitment', 'Engagement en capital'),
    committed: '1500000.00',
    called: '600000.00',
    currency: 'CAD',
    status: 'active',
    ...over,
  }
}

function call(over: Partial<FinanceCapitalCall> = {}): FinanceCapitalCall {
  return {
    id: 'call-1',
    commitmentId: 'cmt-1',
    amount: '250000.00',
    dueDate: '2026-10-10',
    status: 'notified',
    reference: 'Call notice 2026-02',
    ...over,
  }
}

function debt(over: Partial<FinanceDebt> = {}): FinanceDebt {
  return {
    id: 'debt-1',
    entityId: 'ent-2',
    label: bi('Business line of credit', 'Marge de crédit commerciale'),
    lender: bi('Big Five Bank', 'Big Five Bank'),
    principal: '750000.00',
    balance: '412000.00',
    interestRate: '7.2',
    currency: 'CAD',
    maturityDate: '2026-11-30',
    status: 'active',
    ...over,
  }
}

function deal(over: Partial<FinanceDeal> = {}): FinanceDeal {
  return {
    id: 'deal-1',
    entityId: 'ent-2',
    name: bi('Verdun Freight Lines — tuck-in', 'Verdun Freight Lines — acquisition complémentaire'),
    kind: 'acquisition',
    stage: 'diligence',
    counterparty: 'Verdun Freight Lines Ltd.',
    value: '850000.00',
    currency: 'CAD',
    targetDate: '2026-11-30',
    ...over,
  }
}

describe('computeFinanceAttention', () => {
  it('flags a notified capital call inside 30 days as due soon', () => {
    const items = computeFinanceAttention(
      { capitalCalls: [call({ dueDate: '2026-10-10' })], commitments: [commitment()], debts: [], deals: [] },
      TODAY,
    )
    expect(items).toHaveLength(1)
    expect(items[0]!.kind).toBe('capital_call')
    expect(items[0]!.severity).toBe('due_soon')
    expect(items[0]!.sub).toContain('Call notice 2026-02')
    expect(items[0]!.to).toBe('/app/finance/deals')
  })

  it('flags an overdue capital call as overdue', () => {
    const items = computeFinanceAttention(
      { capitalCalls: [call({ dueDate: '2026-09-10' })], commitments: [commitment()], debts: [], deals: [] },
      TODAY,
    )
    expect(items[0]!.severity).toBe('overdue')
  })

  it('ignores received and cancelled calls', () => {
    const items = computeFinanceAttention(
      {
        capitalCalls: [
          call({ id: 'c1', dueDate: '2026-09-10', status: 'received' }),
          call({ id: 'c2', dueDate: '2026-09-10', status: 'cancelled' }),
        ],
        commitments: [commitment()],
        debts: [],
        deals: [],
      },
      TODAY,
    )
    expect(items).toHaveLength(0)
  })

  it('ignores calls more than 30 days out', () => {
    const items = computeFinanceAttention(
      { capitalCalls: [call({ dueDate: '2026-11-15' })], commitments: [commitment()], debts: [], deals: [] },
      TODAY,
    )
    expect(items).toHaveLength(0)
  })

  it('surfaces an upcoming commitment call when no live call exists', () => {
    const items = computeFinanceAttention(
      {
        capitalCalls: [],
        commitments: [commitment({ nextCallDate: '2026-10-20' })],
        debts: [],
        deals: [],
      },
      TODAY,
    )
    expect(items).toHaveLength(1)
    expect(items[0]!.kind).toBe('commitment_call')
    expect(items[0]!.severity).toBe('upcoming')
  })

  it('does not double-report a commitment whose call is already listed', () => {
    const items = computeFinanceAttention(
      {
        capitalCalls: [call({ dueDate: '2026-10-10' })],
        commitments: [commitment({ nextCallDate: '2026-10-10' })],
        debts: [],
        deals: [],
      },
      TODAY,
    )
    expect(items.filter((i) => i.kind === 'capital_call' || i.kind === 'commitment_call')).toHaveLength(1)
  })

  it('flags a debt maturing inside 90 days and an overdue one', () => {
    const items = computeFinanceAttention(
      {
        capitalCalls: [],
        commitments: [],
        debts: [
          debt({ maturityDate: '2026-11-30' }),
          debt({ id: 'debt-2', maturityDate: '2026-09-01' }),
        ],
        deals: [],
      },
      TODAY,
    )
    expect(items).toHaveLength(2)
    expect(items[0]!.severity).toBe('overdue')
    expect(items[1]!.severity).toBe('due_soon')
    expect(items.every((i) => i.to === '/app/finance/treasury')).toBe(true)
    // The lender rides as a Bi qualifier, never stringified into sub.
    expect(items[0]!.qualifier).toEqual({ en: 'Big Five Bank', fr: 'Big Five Bank' })
    expect(items[0]!.sub).toBe('CAD 412000.00 · 2026-09-01')
  })

  it('ignores paid-off debts and maturities beyond 90 days', () => {
    const items = computeFinanceAttention(
      {
        capitalCalls: [],
        commitments: [],
        debts: [
          debt({ maturityDate: '2026-09-01', status: 'paid_off' }),
          debt({ id: 'debt-2', maturityDate: '2027-03-01' }),
        ],
        deals: [],
      },
      TODAY,
    )
    expect(items).toHaveLength(0)
  })

  it('flags an open deal past its target date', () => {
    const items = computeFinanceAttention(
      { capitalCalls: [], commitments: [], debts: [], deals: [deal({ targetDate: '2026-09-15' })] },
      TODAY,
    )
    expect(items).toHaveLength(1)
    expect(items[0]!.kind).toBe('deal')
    expect(items[0]!.severity).toBe('overdue')
  })

  it('ignores closed and passed deals', () => {
    const items = computeFinanceAttention(
      {
        capitalCalls: [],
        commitments: [],
        debts: [],
        deals: [
          deal({ id: 'd1', stage: 'closed', targetDate: '2026-09-01' }),
          deal({ id: 'd2', stage: 'passed', targetDate: '2026-09-01' }),
        ],
      },
      TODAY,
    )
    expect(items).toHaveLength(0)
  })

  it('sorts by date and caps at six items', () => {
    const calls: FinanceCapitalCall[] = Array.from({ length: 8 }, (_, i) =>
      call({ id: `c-${i}`, dueDate: `2026-10-${String(i + 1).padStart(2, '0')}` }),
    )
    const items = computeFinanceAttention(
      { capitalCalls: calls, commitments: [commitment()], debts: [], deals: [] },
      TODAY,
    )
    expect(items).toHaveLength(6)
    const dates = items.map((i) => i.date)
    expect([...dates].sort()).toEqual(dates)
  })

  it('returns an empty list when nothing needs attention', () => {
    const items: FinanceAttentionItem[] = computeFinanceAttention(
      { capitalCalls: [], commitments: [], debts: [], deals: [] },
      TODAY,
    )
    expect(items).toHaveLength(0)
  })
})
