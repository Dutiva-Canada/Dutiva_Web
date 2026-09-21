import { bi } from '@/i18n/core'
import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str, today } from '@/features/app/agent/match'
import type {
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceLegalEntity,
  FinanceObligationStatus,
  FinanceParty,
  FinanceRequestStatus,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxType,
} from './data/types'

/**
 * Finance agent tools — the weekly-ops slice of the ERP seam
 * (docs/AGENT_LAYER.md).
 *
 * The module is a full accounting workspace (invoices, spend requests,
 * journals, payroll, obligations, budgets, forecasts, bank reconciliation).
 * The agent surface is deliberately narrower: what a founder touches
 * weekly, expressed through the same `FinanceDataContextValue` mutators the
 * screens call.
 *
 * What is NOT a tool, and why:
 * - `add_invoice` — an invoice needs real subtotal/tax decomposition;
 *   params can't express that honestly, so the UI form owns creation.
 * - Journals, pay runs, close periods, reconciliations — high-blast-radius
 *   transitions; humans run the month-end ceremony.
 * - Entities, bank accounts, ledger accounts, category rules — structural
 *   admin, not weekly ops.
 * Absence is the enforcement.
 *
 * Finance mutators are production-only (`canWrite === false` in demo —
 * fixtures are read-only), so commit tools check it first and fail with the
 * demo capability message rather than writing nothing.
 */

const MODULE = 'finance'
const moduleLabel = M.agent_fin_module

const INVOICE_STATUSES: readonly FinanceInvoiceStatus[] = [
  'draft',
  'issued',
  'partial',
  'paid',
  'overdue',
  'disputed',
  'written_off',
  'cancelled',
]
const REQUEST_STATUSES: readonly FinanceRequestStatus[] = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'committed',
  'cancelled',
]
const OBLIGATION_STATUSES: readonly FinanceObligationStatus[] = [
  'planned',
  'in_preparation',
  'reviewed',
  'filed',
  'paid',
  'confirmed',
  'overdue',
  'withdrawn',
]
const TAX_TYPES: readonly FinanceTaxType[] = [
  'income_tax',
  'gst_hst',
  'qst',
  'payroll_source_deductions',
  'employer_contributions',
  'other',
]
const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP'] as const

export interface FinanceAgentContext {
  canWrite: boolean
  invoices(): readonly FinanceInvoice[]
  spendRequests(): readonly FinanceSpendRequest[]
  obligations(): readonly FinanceTaxObligation[]
  parties(): readonly FinanceParty[]
  entities(): readonly FinanceLegalEntity[]
  transitionInvoiceStatus(
    id: string,
    nextStatus: FinanceInvoiceStatus,
    paidAmount?: string,
  ): Promise<FinanceInvoice | null>
  addSpendRequest(item: Omit<FinanceSpendRequest, 'id'>): Promise<FinanceSpendRequest | null>
  transitionSpendRequestStatus(
    id: string,
    nextStatus: FinanceRequestStatus,
    approver?: string,
  ): Promise<FinanceSpendRequest | null>
  addTaxObligation(item: Omit<FinanceTaxObligation, 'id'>): Promise<FinanceTaxObligation | null>
}

function unavailable() {
  return {
    status: 'failed',
    code: 'module_unavailable',
    message: M.agent_err_capability_demo,
  } as const
}

function writeFailed() {
  return {
    status: 'failed',
    code: 'invalid_params',
    message: M.agent_fin_result_write_failed,
  } as const
}

function partyName(parties: readonly FinanceParty[], id: string | undefined): string {
  if (!id) return ''
  return parties.find((p) => p.id === id)?.name ?? ''
}

/** A settled/closed invoice can't go back to paid through a status flip. */
const NON_PAYABLE: readonly FinanceInvoiceStatus[] = ['paid', 'written_off', 'cancelled']
const OPEN_SPEND: readonly FinanceRequestStatus[] = ['draft', 'submitted']

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<FinanceAgentContext>({
  id: 'finance.invoices',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_fin_invoices_label,
  description: M.agent_fin_invoices_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: INVOICE_STATUSES,
      description: M.agent_fin_p_invoice_status,
    },
  ],
  run: (fin, params) => {
    const status = str(params, 'status') as FinanceInvoiceStatus | undefined
    const items = fin.invoices().filter((inv) => !status || inv.status === status)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_fin_invoices_none }
    }
    const parties = fin.parties()
    const titles = items.slice(0, 5).map((inv) => {
      const late = inv.dueDate < today() && !NON_PAYABLE.includes(inv.status) ? ' ⚠' : ''
      const customer = partyName(parties, inv.customerId)
      return `${inv.number}${customer ? ` — ${customer}` : ''} — ${inv.currency} ${inv.total} (${inv.status})${late}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} invoice${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} facture${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<FinanceAgentContext>({
  id: 'finance.spend_requests',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_fin_spend_label,
  description: M.agent_fin_spend_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: REQUEST_STATUSES,
      description: M.agent_fin_p_spend_status,
    },
  ],
  run: (fin, params) => {
    const status = str(params, 'status') as FinanceRequestStatus | undefined
    const items = fin.spendRequests().filter((r) => !status || r.status === status)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_fin_spend_none }
    }
    const titles = items
      .slice(0, 5)
      .map((r) => `${r.purpose.en} — ${r.requester} — ${r.currency} ${r.amount} (${r.status})`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} request${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} demande${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<FinanceAgentContext>({
  id: 'finance.obligations',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_fin_obligations_label,
  description: M.agent_fin_obligations_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: OBLIGATION_STATUSES,
      description: M.agent_fin_p_obligation_status,
    },
  ],
  run: (fin, params) => {
    const status = str(params, 'status') as FinanceObligationStatus | undefined
    const items = fin
      .obligations()
      .filter((o) =>
        status ? o.status === status : !['paid', 'confirmed', 'withdrawn'].includes(o.status),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_fin_obligations_none }
    }
    const titles = items.slice(0, 5).map((o) => {
      const late = o.dueDate < today() ? ' ⚠' : ''
      return `${o.type} — ${o.period} — due ${o.dueDate} (${o.status})${late}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} obligation${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} obligation${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<FinanceAgentContext>({
  id: 'finance.mark_invoice_paid',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_fin_mark_paid_label,
  description: M.agent_fin_mark_paid_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_fin_p_match_invoice,
      maxLength: 200,
    },
  ],
  run: async (fin, params) => {
    if (!fin.canWrite) return unavailable()
    const needle = str(params, 'title')
    const parties = fin.parties()
    const invoice =
      findByName(fin.invoices(), needle, (i) => i.number) ??
      findByName(fin.invoices(), needle, (i) => partyName(parties, i.customerId))
    if (!invoice) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_invoice_not_found }
    }
    if (invoice.status === 'paid') {
      return ok({
        en: `Already paid — ${invoice.number}.`,
        fr: `Déjà payée — ${invoice.number}.`,
      })
    }
    if (invoice.status === 'cancelled' || invoice.status === 'written_off') {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_invoice_not_payable }
    }
    const updated = await fin.transitionInvoiceStatus(invoice.id, 'paid')
    if (!updated) return writeFailed()
    return ok(
      {
        en: `Marked as paid — ${invoice.number} — ${invoice.currency} ${invoice.total}.`,
        fr: `Marquée comme payée — ${invoice.number} — ${invoice.currency} ${invoice.total}.`,
      },
      invoice.id,
    )
  },
})

defineTool<FinanceAgentContext>({
  id: 'finance.add_spend_request',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_fin_add_spend_label,
  description: M.agent_fin_add_spend_desc,
  params: [
    {
      name: 'purpose',
      type: 'string',
      required: true,
      description: M.agent_fin_p_purpose,
      maxLength: 200,
    },
    { name: 'amount', type: 'number', required: true, description: M.agent_fin_p_amount },
    { name: 'currency', type: 'enum', enum: CURRENCIES, description: M.agent_fin_p_currency },
    { name: 'requester', type: 'string', description: M.agent_fin_p_requester, maxLength: 160 },
  ],
  run: async (fin, params) => {
    if (!fin.canWrite) return unavailable()
    const entity = fin.entities()[0]
    if (!entity) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_result_no_entity }
    }
    const purpose = str(params, 'purpose') ?? ''
    const amount = typeof params.amount === 'number' ? params.amount.toFixed(2) : undefined
    if (!amount) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_result_bad_amount }
    }
    const created = await fin.addSpendRequest({
      entityId: entity.id,
      requester: str(params, 'requester') ?? 'Workspace user',
      purpose: bi(purpose, purpose),
      amount,
      currency: (str(params, 'currency') as (typeof CURRENCIES)[number] | undefined) ?? 'CAD',
      status: 'draft',
      submittedAt: new Date().toISOString(),
    })
    if (!created) return writeFailed()
    /* Same two steps the UI takes: the form files a draft, the button
       submits it for approval. */
    const submitted = await fin.transitionSpendRequestStatus(
      created.id,
      'submitted',
      'Workspace user',
    )
    if (!submitted) {
      return ok(
        {
          en: `Spend request logged as draft — ${purpose} — ${created.currency} ${created.amount}. Submit it in Purchases to request approval.`,
          fr: `Demande consignée en brouillon — ${purpose} — ${created.currency} ${created.amount}. Soumettez-la dans Achats pour approbation.`,
        },
        created.id,
      )
    }
    return ok(
      {
        en: `Spend request submitted — ${purpose} — ${created.currency} ${created.amount}.`,
        fr: `Demande soumise — ${purpose} — ${created.currency} ${created.amount}.`,
      },
      created.id,
    )
  },
})

defineTool<FinanceAgentContext>({
  id: 'finance.approve_spend',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_fin_approve_spend_label,
  description: M.agent_fin_approve_spend_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_fin_p_match_spend,
      maxLength: 200,
    },
  ],
  run: async (fin, params) => {
    if (!fin.canWrite) return unavailable()
    const request = findByName(fin.spendRequests(), str(params, 'title'), (r) => r.purpose.en)
    if (!request) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_spend_not_found }
    }
    if (request.status === 'approved' || request.status === 'committed') {
      return ok({
        en: `Already approved — ${request.purpose.en}.`,
        fr: `Déjà approuvée — ${request.purpose.en}.`,
      })
    }
    if (!OPEN_SPEND.includes(request.status)) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_spend_not_approvable }
    }
    if (request.status === 'draft') {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_spend_not_submitted }
    }
    const updated = await fin.transitionSpendRequestStatus(request.id, 'approved', 'Workspace user')
    if (!updated) return writeFailed()
    return ok(
      {
        en: `Approved — ${request.purpose.en} — ${request.currency} ${request.amount}.`,
        fr: `Approuvée — ${request.purpose.en} — ${request.currency} ${request.amount}.`,
      },
      request.id,
    )
  },
})

defineTool<FinanceAgentContext>({
  id: 'finance.add_obligation',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_fin_add_obligation_label,
  description: M.agent_fin_add_obligation_desc,
  params: [
    {
      name: 'type',
      type: 'enum',
      enum: TAX_TYPES,
      required: true,
      description: M.agent_fin_p_obligation_type,
    },
    {
      name: 'period',
      type: 'string',
      required: true,
      description: M.agent_fin_p_period,
      maxLength: 60,
    },
    { name: 'dueDate', type: 'date', required: true, description: M.agent_fin_p_due },
    { name: 'estimatedAmount', type: 'number', description: M.agent_fin_p_estimated },
    {
      name: 'jurisdiction',
      type: 'string',
      description: M.agent_fin_p_jurisdiction,
      maxLength: 120,
    },
  ],
  run: async (fin, params) => {
    if (!fin.canWrite) return unavailable()
    const entity = fin.entities()[0]
    if (!entity) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_fin_result_no_entity }
    }
    const jurisdiction = str(params, 'jurisdiction')
    const created = await fin.addTaxObligation({
      entityId: entity.id,
      type: (str(params, 'type') as FinanceTaxType | undefined) ?? 'other',
      jurisdiction: bi(jurisdiction ?? 'Canada', jurisdiction ?? 'Canada'),
      period: str(params, 'period') ?? '',
      dueDate: str(params, 'dueDate') ?? '',
      estimatedAmount:
        typeof params.estimatedAmount === 'number' ? params.estimatedAmount.toFixed(2) : '0.00',
      currency: 'CAD',
      status: 'planned',
    })
    if (!created) return writeFailed()
    return ok(
      {
        en: `Obligation on file — ${created.type} — ${created.period} — due ${created.dueDate}.`,
        fr: `Obligation consignée — ${created.type} — ${created.period} — échéance ${created.dueDate}.`,
      },
      created.id,
    )
  },
})
