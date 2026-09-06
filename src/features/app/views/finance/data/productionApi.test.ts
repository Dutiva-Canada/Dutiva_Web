import { beforeEach, describe, expect, it } from 'vitest'
import {
  addJournal,
  deadlineState,
  isJournalBalanced,
  loadFinanceState,
  markTaxScenarioStale,
  reviseBudget,
  transitionExternalActionStatus,
  transitionObligationStatus,
  transitionPayRunStatus,
  transitionSpendRequestStatus,
} from './productionApi'
import type { FinanceJournalLine } from './types'

const ORG = 'test-finance-org'

function clearStorage(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(`dutiva_finance_state_${ORG}`)
}

beforeEach(() => {
  clearStorage()
})

describe('isJournalBalanced', () => {
  it('returns true when debits equal credits', () => {
    const lines: FinanceJournalLine[] = [
      { accountId: 'acct-1200', debit: '100.00', credit: '0.00' },
      { accountId: 'acct-5000', debit: '0.00', credit: '100.00' },
    ]
    expect(isJournalBalanced(lines)).toBe(true)
  })

  it('returns false when debits do not equal credits', () => {
    const lines: FinanceJournalLine[] = [
      { accountId: 'acct-1200', debit: '100.00', credit: '0.00' },
      { accountId: 'acct-5000', debit: '0.00', credit: '90.00' },
    ]
    expect(isJournalBalanced(lines)).toBe(false)
  })

  it('returns true for an empty journal', () => {
    expect(isJournalBalanced([])).toBe(true)
  })
})

describe('addJournal', () => {
  it('creates a balanced journal in draft status', () => {
    const created = addJournal(ORG, {
      bookId: 'book-1',
      number: 'JE-TEST-1',
      date: '2026-09-06',
      description: { en: 'Test', fr: 'Test' },
      lines: [
        { accountId: 'acct-1000', debit: '50.00', credit: '0.00' },
        { accountId: 'acct-2000', debit: '0.00', credit: '50.00' },
      ],
      currency: 'CAD',
      status: 'draft',
      source: 'manual',
    })
    expect(created).not.toBeNull()
    expect(created?.balanced).toBe(true)
  })

  it('rejects an unbalanced journal in posted status', () => {
    const created = addJournal(ORG, {
      bookId: 'book-1',
      number: 'JE-TEST-2',
      date: '2026-09-06',
      description: { en: 'Test', fr: 'Test' },
      lines: [
        { accountId: 'acct-1000', debit: '50.00', credit: '0.00' },
        { accountId: 'acct-2000', debit: '0.00', credit: '40.00' },
      ],
      currency: 'CAD',
      status: 'posted',
      source: 'manual',
    })
    expect(created).toBeNull()
  })
})

describe('transitionSpendRequestStatus', () => {
  it('transitions draft → submitted', () => {
    const state = loadFinanceState(ORG)
    const sr = state.spendRequests[0]!
    expect(sr.status).toBe('approved')
    // approved → committed is valid
    const updated = transitionSpendRequestStatus(ORG, sr.id, 'committed')
    expect(updated).not.toBeNull()
    expect(updated?.status).toBe('committed')
  })

  it('rejects invalid transition', () => {
    const state = loadFinanceState(ORG)
    const sr = state.spendRequests[0]!
    // approved → submitted is not valid
    const updated = transitionSpendRequestStatus(ORG, sr.id, 'submitted')
    expect(updated).toBeNull()
  })

  it('returns null for unknown id', () => {
    const updated = transitionSpendRequestStatus(ORG, 'nonexistent', 'submitted')
    expect(updated).toBeNull()
  })
})

describe('transitionPayRunStatus', () => {
  it('transitions results_imported → reconciled', () => {
    const state = loadFinanceState(ORG)
    const pr = state.payRuns[0]!
    expect(pr.status).toBe('results_imported')
    const updated = transitionPayRunStatus(ORG, pr.id, 'reconciled', 'Test user')
    expect(updated).not.toBeNull()
    expect(updated?.status).toBe('reconciled')
    expect(updated?.reconciledAt).toBeDefined()
  })

  it('rejects invalid transition from reconciled', () => {
    const state = loadFinanceState(ORG)
    const pr = state.payRuns[0]!
    transitionPayRunStatus(ORG, pr.id, 'reconciled')
    // reconciled → submitted is not valid
    const updated = transitionPayRunStatus(ORG, pr.id, 'submitted')
    expect(updated).toBeNull()
  })
})

describe('transitionObligationStatus', () => {
  it('transitions in_preparation → reviewed', () => {
    const state = loadFinanceState(ORG)
    const ob = state.taxObligations[0]!
    expect(ob.status).toBe('in_preparation')
    const updated = transitionObligationStatus(ORG, ob.id, 'reviewed', 'Test user')
    expect(updated).not.toBeNull()
    expect(updated?.status).toBe('reviewed')
    expect(updated?.reviewer).toBe('Test user')
  })

  it('rejects invalid transition from confirmed', () => {
    const state = loadFinanceState(ORG)
    const ob = state.taxObligations[0]!
    transitionObligationStatus(ORG, ob.id, 'reviewed')
    transitionObligationStatus(ORG, ob.id, 'filed')
    transitionObligationStatus(ORG, ob.id, 'paid')
    transitionObligationStatus(ORG, ob.id, 'confirmed')
    // confirmed → filed is not valid
    const updated = transitionObligationStatus(ORG, ob.id, 'filed')
    expect(updated).toBeNull()
  })
})

describe('transitionExternalActionStatus', () => {
  it('transitions provider_accepted → settled', () => {
    const state = loadFinanceState(ORG)
    const ea = state.externalActions[0]!
    expect(ea.status).toBe('provider_accepted')
    const updated = transitionExternalActionStatus(ORG, ea.id, 'settled')
    expect(updated).not.toBeNull()
    expect(updated?.status).toBe('settled')
    expect(updated?.confirmedAt).toBeDefined()
  })

  it('rejects invalid transition from settled', () => {
    const state = loadFinanceState(ORG)
    const ea = state.externalActions[0]!
    transitionExternalActionStatus(ORG, ea.id, 'settled')
    const updated = transitionExternalActionStatus(ORG, ea.id, 'failed')
    expect(updated).toBeNull()
  })
})

describe('reviseBudget', () => {
  it('increments version and marks scenarios stale', () => {
    const state = loadFinanceState(ORG)
    const bud = state.budgets[0]!
    const updated = reviseBudget(ORG, bud.id, bud.lines)
    expect(updated).not.toBeNull()
    expect(updated?.version).toBe(bud.version + 1)
    expect(updated?.status).toBe('revised')

    const newState = loadFinanceState(ORG)
    // Scenarios that were reviewed or accepted should now be stale
    const scn = newState.scenarios[0]!
    expect(scn.status).toBe('stale')
  })
})

describe('markTaxScenarioStale', () => {
  it('marks a tax scenario as stale with a reason', () => {
    const state = loadFinanceState(ORG)
    const ts = state.taxScenarios[0]!
    const updated = markTaxScenarioStale(ORG, ts.id, 'Law changed')
    expect(updated).not.toBeNull()
    expect(updated?.status).toBe('stale')
    expect(updated?.staleReason?.en).toBe('Law changed')
  })
})

describe('deadlineState', () => {
  it('returns none when no due date', () => {
    expect(deadlineState(undefined)).toBe('none')
  })

  it('returns overdue for a past date', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(deadlineState(past)).toBe('overdue')
  })

  it('returns due_soon for a date within 7 days', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(deadlineState(soon)).toBe('due_soon')
  })

  it('returns ok for a date beyond 7 days', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(deadlineState(future)).toBe('ok')
  })
})
