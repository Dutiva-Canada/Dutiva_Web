import { beforeEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the seven finance tools on import — the module under test. */
import './agentTools'
import type { FinanceAgentContext } from './agentTools'
import type {
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceLegalEntity,
  FinanceObligationStatus,
  FinanceParty,
  FinanceRequestStatus,
  FinanceSpendRequest,
  FinanceTaxObligation,
} from './data/types'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

const ENTITY: FinanceLegalEntity = {
  id: 'ent-1',
  legalName: 'Northgate Logistics Inc.',
  legalForm: 'corporation',
  fiscalYearStart: '01-01',
  functionalCurrency: 'CAD',
  jurisdictions: ['Canada'],
  active: true,
}

const PARTIES: FinanceParty[] = [
  {
    id: 'pty-1',
    entityId: 'ent-1',
    name: 'Maple Freight Co.',
    type: 'customer',
    bankingDetailsOnFile: false,
    active: true,
  },
]

function invoice(
  id: string,
  number: string,
  status: FinanceInvoiceStatus,
  dueDate = '2026-10-01',
): FinanceInvoice {
  return {
    id,
    entityId: 'ent-1',
    customerId: 'pty-1',
    number,
    issueDate: '2026-09-01',
    dueDate,
    currency: 'CAD',
    subtotal: '1250.00',
    taxTotal: '0.00',
    total: '1250.00',
    paidAmount: '0.00',
    status,
  }
}

function spend(id: string, purpose: string, status: FinanceRequestStatus): FinanceSpendRequest {
  return {
    id,
    entityId: 'ent-1',
    requester: 'Workspace user',
    purpose: bi(purpose, purpose),
    amount: '3600.00',
    currency: 'CAD',
    status,
    submittedAt: '2026-09-10T00:00:00Z',
  }
}

function obligation(
  id: string,
  status: FinanceObligationStatus,
  dueDate = '2026-09-30',
): FinanceTaxObligation {
  return {
    id,
    entityId: 'ent-1',
    type: 'gst_hst',
    jurisdiction: bi('Canada', 'Canada'),
    period: 'Q3 2026',
    dueDate,
    estimatedAmount: '5200.00',
    currency: 'CAD',
    status,
  }
}

const INVOICES = [
  invoice('inv-1', 'INV-2026-0042', 'issued', '2026-08-01'),
  invoice('inv-2', 'INV-2026-0038', 'overdue'),
  invoice('inv-3', 'INV-2026-0050', 'paid'),
]
const SPEND = [
  spend('sr-1', 'New warehouse laptops', 'submitted'),
  spend('sr-2', 'Office chairs', 'draft'),
  spend('sr-3', 'Fleet insurance', 'approved'),
  spend('sr-4', 'Trade show booth', 'rejected'),
]
const OBLIGATIONS = [
  obligation('ob-1', 'in_preparation', '2026-09-30'),
  obligation('ob-2', 'paid', '2026-06-15'),
  obligation('ob-3', 'planned', '2026-01-10'),
]

interface FinCalls {
  invoiceTransitions: Array<{ id: string; next: FinanceInvoiceStatus }>
  addedSpends: Array<Omit<FinanceSpendRequest, 'id'>>
  spendTransitions: Array<{ id: string; next: FinanceRequestStatus; approver?: string }>
  addedObligations: Array<Omit<FinanceTaxObligation, 'id'>>
}

function setupFinance(opts?: { canWrite?: boolean; failWrites?: boolean; noEntity?: boolean }) {
  const calls: FinCalls = {
    invoiceTransitions: [],
    addedSpends: [],
    spendTransitions: [],
    addedObligations: [],
  }
  const writable = opts?.canWrite !== false && !opts?.failWrites
  const ctx: FinanceAgentContext = {
    canWrite: opts?.canWrite !== false,
    invoices: () => INVOICES,
    spendRequests: () =>
      SPEND.map((r) => {
        const t = calls.spendTransitions.find((x) => x.id === r.id)
        return t ? { ...r, status: t.next } : r
      }),
    obligations: () => OBLIGATIONS,
    parties: () => PARTIES,
    entities: () => (opts?.noEntity ? [] : [ENTITY]),
    transitionInvoiceStatus: async (id, next) => {
      calls.invoiceTransitions.push({ id, next })
      return writable ? (INVOICES.find((i) => i.id === id) ?? null) : null
    },
    addSpendRequest: async (item) => {
      calls.addedSpends.push(item)
      return writable ? spend('sr-new', item.purpose.en, item.status) : null
    },
    transitionSpendRequestStatus: async (id, next, approver) => {
      calls.spendTransitions.push({ id, next, approver })
      return writable ? (SPEND.find((r) => r.id === id) ?? spend(id, 'x', next)) : null
    },
    addTaxObligation: async (item) => {
      calls.addedObligations.push(item)
      return writable ? { ...item, id: 'ob-new' } : null
    },
  }
  bindModuleContext('finance', ctx)
  return calls
}

function run(toolId: string, params: Record<string, unknown>, exec: AgentToolExecution = DEMO) {
  return executeAgentProposal(createProposal(toolId, bi('proposal', 'proposition'), params), exec)
}

describe('finance agent tools', () => {
  beforeEach(() => {
    resetModuleContextsForTest()
  })

  it('lists invoices with customer names, flagging past-due open ones', async () => {
    setupFinance()
    const { outcome } = await run('finance.invoices', {})
    expect(outcome.status === 'completed' && outcome.message.en).toContain('3 invoices')
    expect(outcome.status === 'completed' && outcome.message.en).toContain(
      'INV-2026-0042 — Maple Freight Co. — CAD 1250.00 (issued) ⚠',
    )
  })

  it('filters invoices by status', async () => {
    setupFinance()
    const { outcome } = await run('finance.invoices', { status: 'paid' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 invoice')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('INV-2026-0050')
  })

  it('lists spend requests with a status filter', async () => {
    setupFinance()
    const { outcome } = await run('finance.spend_requests', { status: 'submitted' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 request')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('New warehouse laptops')
  })

  it('lists open obligations by due date, flagging the past-due one', async () => {
    setupFinance()
    const { outcome } = await run('finance.obligations', {})
    const text = outcome.status === 'completed' ? outcome.message.en : ''
    expect(text).toContain('2 obligations')
    expect(text.indexOf('ob-3') === -1 && text.indexOf('2026-01-10') !== -1).toBe(true)
    expect(text).not.toContain('2026-06-15')
    expect(text).toContain('⚠')
  })

  it('marks an invoice paid by number', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.mark_invoice_paid', { title: 'INV-2026-0042' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Marked as paid')
    expect(calls.invoiceTransitions).toEqual([{ id: 'inv-1', next: 'paid' }])
  })

  it('resolves the invoice by customer name too', async () => {
    const calls = setupFinance()
    await run('finance.mark_invoice_paid', { title: 'Maple Freight' })
    expect(calls.invoiceTransitions[0]?.id).toBe('inv-1')
  })

  it('is idempotent on an already-paid invoice', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.mark_invoice_paid', { title: 'INV-2026-0050' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Already paid')
    expect(calls.invoiceTransitions).toEqual([])
  })

  it('files and submits a spend request with the amount normalized', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.add_spend_request', {
      purpose: 'New laptops',
      amount: 3600,
    })
    expect(outcome.status === 'completed' && outcome.message.en).toContain(
      'Spend request submitted',
    )
    expect(calls.addedSpends[0]).toMatchObject({
      entityId: 'ent-1',
      requester: 'Workspace user',
      amount: '3600.00',
      currency: 'CAD',
      status: 'draft',
    })
    expect(calls.spendTransitions).toEqual([
      { id: 'sr-new', next: 'submitted', approver: 'Workspace user' },
    ])
  })

  it('reports a draft when the submit step fails', async () => {
    const calls = setupFinance()
    // First write succeeds (draft), second (submit) returns null.
    let n = 0
    const { outcome } = await (async () => {
      resetModuleContextsForTest()
      const ctx: FinanceAgentContext = {
        canWrite: true,
        invoices: () => INVOICES,
        spendRequests: () => SPEND,
        obligations: () => OBLIGATIONS,
        parties: () => PARTIES,
        entities: () => [ENTITY],
        transitionInvoiceStatus: async () => null,
        addSpendRequest: async (item) => {
          calls.addedSpends.push(item)
          return spend('sr-new', item.purpose.en, 'draft')
        },
        transitionSpendRequestStatus: async () => {
          n++
          return null
        },
        addTaxObligation: async () => null,
      }
      bindModuleContext('finance', ctx)
      return run('finance.add_spend_request', { purpose: 'Laptops', amount: 100 })
    })()
    expect(outcome.status === 'completed' && outcome.message.en).toContain('as draft')
    expect(n).toBe(1)
  })

  it('approves a submitted spend request by purpose', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.approve_spend', { title: 'laptops' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Approved')
    expect(calls.spendTransitions).toEqual([
      { id: 'sr-1', next: 'approved', approver: 'Workspace user' },
    ])
  })

  it('refuses to approve a draft — submit first', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.approve_spend', { title: 'Office chairs' })
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
    expect(outcome.status === 'failed' && outcome.message.en).toContain('still a draft')
    expect(calls.spendTransitions).toEqual([])
  })

  it('is idempotent on an already-approved request', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.approve_spend', { title: 'Fleet insurance' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Already approved')
    expect(calls.spendTransitions).toEqual([])
  })

  it('files a tax obligation as planned with Canada as the default jurisdiction', async () => {
    const calls = setupFinance()
    const { outcome } = await run('finance.add_obligation', {
      type: 'gst_hst',
      period: 'Q3 2026',
      dueDate: '2026-10-31',
    })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Obligation on file')
    expect(calls.addedObligations[0]).toMatchObject({
      entityId: 'ent-1',
      type: 'gst_hst',
      period: 'Q3 2026',
      dueDate: '2026-10-31',
      status: 'planned',
      estimatedAmount: '0.00',
    })
  })

  it('fails commits honestly when the demo workspace cannot write', async () => {
    const calls = setupFinance({ canWrite: false })
    const { outcome } = await run('finance.mark_invoice_paid', { title: 'INV-2026-0042' })
    expect(outcome.status === 'failed' && outcome.code).toBe('module_unavailable')
    expect(calls.invoiceTransitions).toEqual([])
  })

  it('fails cleanly when a production write returns nothing', async () => {
    setupFinance({ failWrites: true })
    const { outcome } = await run('finance.mark_invoice_paid', { title: 'INV-2026-0042' })
    expect(outcome.status === 'failed' && outcome.message.en).toContain('couldn’t save')
  })

  it('refuses a commit for a production viewer', async () => {
    const calls = setupFinance()
    const { outcome } = await run(
      'finance.add_spend_request',
      { purpose: 'Blocked', amount: 10 },
      { mode: 'production', role: 'viewer', organizationId: 'org-9' },
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('forbidden')
    expect(calls.addedSpends).toEqual([])
  })
})
