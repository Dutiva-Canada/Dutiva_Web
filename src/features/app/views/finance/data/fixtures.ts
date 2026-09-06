import { bi } from '@/i18n/core'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo fixtures for the finance workspace, including a Canadian SMB
 * corporation with one book, payroll, invoices, bills, budgets, and tax
 * obligations.
 *
 * [FR self-authored for fixture copy; not from a design handoff.]
 */

const entity: FinanceWorkspaceState['entities'][number] = {
  id: 'ent-1',
  legalName: 'Northgate Logistics Inc.',
  legalForm: 'corporation',
  fiscalYearStart: '2026-01-01',
  functionalCurrency: 'CAD',
  jurisdictions: ['ON', 'QC'],
  accountingSourceId: 'qb-001',
  payrollSourceId: 'adp-001',
  active: true,
}

const book: FinanceWorkspaceState['books'][number] = {
  id: 'book-1',
  entityId: 'ent-1',
  label: bi('Main ledger', 'Grand livre principal'),
  basis: 'accrual',
  authoritativeSource: bi('QuickBooks Online', 'QuickBooks Online'),
  lastSyncedAt: '2026-09-05T22:00:00Z',
}

const period: FinanceWorkspaceState['fiscalPeriods'][number] = {
  id: 'period-2026-q3',
  entityId: 'ent-1',
  label: 'Q3 2026',
  startDate: '2026-07-01',
  endDate: '2026-09-30',
  status: 'open',
}

const customer: FinanceWorkspaceState['parties'][number] = {
  id: 'party-cust-1',
  entityId: 'ent-1',
  name: 'Maple Freight Co.',
  type: 'customer',
  externalId: 'QB-C-1001',
  bankingDetailsOnFile: false,
  active: true,
}

const supplier: FinanceWorkspaceState['parties'][number] = {
  id: 'party-sup-1',
  entityId: 'ent-1',
  name: 'TechSupply Canada',
  type: 'supplier',
  externalId: 'QB-V-2001',
  bankingDetailsOnFile: true,
  active: true,
}

const bankAccount: FinanceWorkspaceState['bankAccounts'][number] = {
  id: 'bank-1',
  entityId: 'ent-1',
  label: bi('Operating account', 'Compte d’exploitation'),
  currency: 'CAD',
  last4: '4471',
  restricted: false,
  earmarkedAmount: '5000.00',
}

const taxAccount: FinanceWorkspaceState['bankAccounts'][number] = {
  id: 'bank-2',
  entityId: 'ent-1',
  label: bi('Tax reserve account', 'Compte de réserve fiscale'),
  currency: 'CAD',
  last4: '8829',
  restricted: true,
  earmarkedAmount: '12000.00',
}

const ledgerAccounts: FinanceWorkspaceState['ledgerAccounts'] = [
  {
    id: 'acct-1000',
    bookId: 'book-1',
    code: '1000',
    name: bi('Cash — Operating', 'Encaisse — Exploitation'),
    type: 'asset',
    sensitive: false,
    active: true,
  },
  {
    id: 'acct-1200',
    bookId: 'book-1',
    code: '1200',
    name: bi('Accounts receivable', 'Clients'),
    type: 'asset',
    sensitive: false,
    active: true,
  },
  {
    id: 'acct-2000',
    bookId: 'book-1',
    code: '2000',
    name: bi('Accounts payable', 'Fournisseurs'),
    type: 'liability',
    sensitive: false,
    active: true,
  },
  {
    id: 'acct-2200',
    bookId: 'book-1',
    code: '2200',
    name: bi('GST/HST payable', 'TPS/TVH à payer'),
    type: 'liability',
    sensitive: false,
    active: true,
  },
  {
    id: 'acct-5000',
    bookId: 'book-1',
    code: '5000',
    name: bi('Revenue — Services', 'Revenus — Services'),
    type: 'revenue',
    sensitive: false,
    active: true,
  },
  {
    id: 'acct-6000',
    bookId: 'book-1',
    code: '6000',
    name: bi('Salaries and wages', 'Salaires et traitements'),
    type: 'expense',
    sensitive: true,
    active: true,
  },
]

const invoice: FinanceWorkspaceState['invoices'][number] = {
  id: 'inv-1',
  entityId: 'ent-1',
  customerId: 'party-cust-1',
  number: 'INV-2026-0042',
  issueDate: '2026-08-15',
  dueDate: '2026-09-15',
  currency: 'CAD',
  subtotal: '10000.00',
  taxTotal: '1300.00',
  total: '11300.00',
  paidAmount: '0.00',
  status: 'issued',
  sourceSystem: bi('QuickBooks Online', 'QuickBooks Online'),
  notes: bi('Quarterly logistics consulting', 'Conseil logistique trimestriel'),
}

const overdueInvoice: FinanceWorkspaceState['invoices'][number] = {
  id: 'inv-2',
  entityId: 'ent-1',
  customerId: 'party-cust-1',
  number: 'INV-2026-0038',
  issueDate: '2026-07-01',
  dueDate: '2026-08-01',
  currency: 'CAD',
  subtotal: '7500.00',
  taxTotal: '975.00',
  total: '8475.00',
  paidAmount: '4000.00',
  status: 'overdue',
  sourceSystem: bi('QuickBooks Online', 'QuickBooks Online'),
}

const bill: FinanceWorkspaceState['bills'][number] = {
  id: 'bill-1',
  entityId: 'ent-1',
  supplierId: 'party-sup-1',
  number: 'BILL-TS-9912',
  issueDate: '2026-08-20',
  dueDate: '2026-09-20',
  currency: 'CAD',
  subtotal: '2500.00',
  taxTotal: '325.00',
  total: '2825.00',
  paidAmount: '0.00',
  status: 'posted',
  purchaseOrderId: 'po-1',
  sourceSystem: bi('QuickBooks Online', 'QuickBooks Online'),
}

const spendRequest: FinanceWorkspaceState['spendRequests'][number] = {
  id: 'sr-1',
  entityId: 'ent-1',
  requester: 'Jordan Lee',
  purpose: bi('New warehouse laptops (3 units)', 'Ordinateurs portables d’entrepôt (3 unités)'),
  supplierId: 'party-sup-1',
  projectId: 'proj-warehouse',
  amount: '3600.00',
  currency: 'CAD',
  evidenceRef: 'receipt-1',
  status: 'approved',
  approver: 'Martin Constantineau',
  approvedAt: '2026-09-03T14:00:00Z',
  approvalVersion: 'v1',
  submittedAt: '2026-09-01T10:00:00Z',
}

const purchaseOrder: FinanceWorkspaceState['purchaseOrders'][number] = {
  id: 'po-1',
  entityId: 'ent-1',
  supplierId: 'party-sup-1',
  number: 'PO-2026-0017',
  date: '2026-08-18',
  currency: 'CAD',
  total: '3600.00',
  matchedAmount: '0.00',
  status: 'open',
  projectId: 'proj-warehouse',
}

const expense: FinanceWorkspaceState['expenses'][number] = {
  id: 'exp-1',
  entityId: 'ent-1',
  requester: 'Jordan Lee',
  purpose: bi('Client lunch — Maple Freight', 'Dîner client — Maple Freight'),
  amount: '85.00',
  currency: 'CAD',
  projectId: 'proj-warehouse',
  status: 'submitted',
  taxable: false,
  submittedAt: '2026-09-04T16:00:00Z',
}

const subscription: FinanceWorkspaceState['subscriptions'][number] = {
  id: 'sub-1',
  entityId: 'ent-1',
  label: bi('QuickBooks Online Plus', 'QuickBooks Online Plus'),
  supplierId: 'party-sup-1',
  cost: '70.00',
  currency: 'CAD',
  renewalTerm: bi('Monthly', 'Mensuel'),
  nextRenewalDate: '2026-10-01',
  noticeDate: '2026-09-15',
  owner: 'Martin Constantineau',
  active: true,
}

const journal: FinanceWorkspaceState['journals'][number] = {
  id: 'jrnl-1',
  bookId: 'book-1',
  number: 'JE-2026-0150',
  date: '2026-08-15',
  description: bi('Invoice INV-2026-0042 issued', 'Facture INV-2026-0042 émise'),
  lines: [
    { accountId: 'acct-1200', debit: '11300.00', credit: '0.00' },
    { accountId: 'acct-5000', debit: '0.00', credit: '10000.00' },
    { accountId: 'acct-2200', debit: '0.00', credit: '1300.00' },
  ],
  currency: 'CAD',
  status: 'posted',
  source: 'import',
  balanced: true,
}

const bankItem: FinanceWorkspaceState['bankItems'][number] = {
  id: 'bi-1',
  bankAccountId: 'bank-1',
  date: '2026-09-01',
  amount: '4000.00',
  currency: 'CAD',
  description: 'Payment from Maple Freight Co.',
  matchStatus: 'matched',
  matchedInvoiceId: 'inv-2',
}

const unmatchedBankItem: FinanceWorkspaceState['bankItems'][number] = {
  id: 'bi-2',
  bankAccountId: 'bank-1',
  date: '2026-09-03',
  amount: '-42.50',
  currency: 'CAD',
  description: 'Bank fee — wire transfer',
  matchStatus: 'unmatched',
}

const reconciliation: FinanceWorkspaceState['reconciliations'][number] = {
  id: 'rec-1',
  bankAccountId: 'bank-1',
  periodId: 'period-2026-q3',
  openingBalance: '45000.00',
  closingBalance: '52000.00',
  statementTotal: '52000.00',
  bookTotal: '51957.50',
  difference: '42.50',
  status: 'exception',
}

const payPeriod: FinanceWorkspaceState['payPeriods'][number] = {
  id: 'pp-2026-18',
  entityId: 'ent-1',
  label: 'Pay period 18 — Aug 24 to Sep 6',
  startDate: '2026-08-24',
  endDate: '2026-09-06',
  payDate: '2026-09-11',
  frequency: 'biweekly',
}

const payRun: FinanceWorkspaceState['payRuns'][number] = {
  id: 'pr-1',
  entityId: 'ent-1',
  periodId: 'pp-2026-18',
  status: 'results_imported',
  grossPay: '24000.00',
  employeeDeductions: '5200.00',
  employerContributions: '2100.00',
  netPay: '18800.00',
  providerFees: '125.00',
  currency: 'CAD',
  jurisdictions: ['ON', 'QC'],
  calculationSource: bi('ADP Workforce Now', 'ADP Workforce Now'),
  ruleVersion: '2026-Q3',
  approvedBy: 'Martin Constantineau',
  approvedAt: '2026-09-04T12:00:00Z',
  submittedAt: '2026-09-04T13:00:00Z',
  exceptions: [
    bi('QC employee YTD total differs from prior period by $320.', 'Le total cumulatif de l’employé QC diffère de la période précédente de 320 $.'),
  ],
}

const payrollLiability: FinanceWorkspaceState['payrollLiabilities'][number] = {
  id: 'pl-1',
  entityId: 'ent-1',
  payRunId: 'pr-1',
  type: 'source_deductions',
  amount: '5200.00',
  currency: 'CAD',
  dueDate: '2026-09-15',
  settled: false,
}

const budget: FinanceWorkspaceState['budgets'][number] = {
  id: 'bud-2026',
  entityId: 'ent-1',
  label: bi('2026 annual budget', 'Budget annuel 2026'),
  status: 'approved',
  currency: 'CAD',
  owner: 'Martin Constantineau',
  approvedAt: '2026-01-05T10:00:00Z',
  version: 1,
  lines: [
    {
      id: 'bl-1',
      department: 'Operations',
      projectId: 'proj-warehouse',
      period: 'Q3 2026',
      amount: '15000.00',
      currency: 'CAD',
      actualAmount: '9200.00',
      committedAmount: '3600.00',
    },
    {
      id: 'bl-2',
      department: 'Sales',
      period: 'Q3 2026',
      amount: '8000.00',
      currency: 'CAD',
      actualAmount: '3100.00',
      committedAmount: '0.00',
    },
  ],
}

const scenario: FinanceWorkspaceState['scenarios'][number] = {
  id: 'scn-1',
  entityId: 'ent-1',
  label: bi('Hire one warehouse lead — Q4', 'Embaucher un chef d’entrepôt — T4'),
  type: 'hiring',
  assumptions: bi(
    'Start Nov 1, $72k base, 20% employer burden, equipment $2k, recruitment $3k.',
    'Début le 1er nov., 72k base, 20% charges patronales, équipement 2k, recrutement 3k.',
  ),
  cutoffDate: '2026-09-06',
  currency: 'CAD',
  projectedRevenue: '0.00',
  projectedExpense: '14000.00',
  projectedCashFlow: '-14000.00',
  status: 'reviewed',
  reviewer: 'Martin Constantineau',
  reviewedAt: '2026-09-05T18:00:00Z',
}

const forecast: FinanceWorkspaceState['forecasts'][number] = {
  id: 'fc-1',
  entityId: 'ent-1',
  label: bi('13-week cash forecast', 'Prévision de trésorerie sur 13 semaines'),
  type: '13_week_cash',
  baselineScenarioId: 'scn-1',
  currency: 'CAD',
  owner: 'Martin Constantineau',
  frozenAt: '2026-09-05T20:00:00Z',
  periods: [
    {
      label: 'Week 1',
      startDate: '2026-09-08',
      endDate: '2026-09-14',
      inflow: '11300.00',
      outflow: '18800.00',
      net: '-7500.00',
      closingBalance: '44500.00',
    },
    {
      label: 'Week 2',
      startDate: '2026-09-15',
      endDate: '2026-09-21',
      inflow: '5000.00',
      outflow: '5200.00',
      net: '-200.00',
      closingBalance: '44300.00',
    },
  ],
}

const reserveGoal: FinanceWorkspaceState['reserveGoals'][number] = {
  id: 'rg-1',
  entityId: 'ent-1',
  type: 'tax',
  label: bi('Q3 tax instalment reserve', 'Réserve pour versement fiscal T3'),
  targetAmount: '15000.00',
  currentAmount: '12000.00',
  currency: 'CAD',
  linkedBankAccountId: 'bank-2',
  dueDate: '2026-09-30',
  owner: 'Martin Constantineau',
}

const reserveGoal2: FinanceWorkspaceState['reserveGoals'][number] = {
  id: 'rg-2',
  entityId: 'ent-1',
  type: 'payroll',
  label: bi('Payroll reserve — 2 cycles', 'Réserve de paie — 2 cycles'),
  targetAmount: '50000.00',
  currentAmount: '38000.00',
  currency: 'CAD',
  linkedBankAccountId: 'bank-1',
  owner: 'Martin Constantineau',
}

const holding: FinanceWorkspaceState['holdings'][number] = {
  id: 'hold-1',
  entityId: 'ent-1',
  label: bi('Corporate GIC — 90 day', 'CPG d’entreprise — 90 jours'),
  institution: bi('Big Five Bank', 'Grande banque canadienne'),
  costBasis: '30000.00',
  carryingValue: '30000.00',
  marketValue: '30150.00',
  currency: 'CAD',
  asOfDate: '2026-09-01',
  realizedResult: '0.00',
  unrealizedChange: '150.00',
  incomeYtd: '450.00',
  feesYtd: '0.00',
  valuationSource: bi('Bank statement', 'Relevé bancaire'),
  stale: false,
}

const debt: FinanceWorkspaceState['debts'][number] = {
  id: 'debt-1',
  entityId: 'ent-1',
  label: bi('Business line of credit', 'Marge de crédit commerciale'),
  lender: bi('Big Five Bank', 'Grande banque canadienne'),
  principal: '50000.00',
  balance: '32000.00',
  interestRate: '7.25',
  currency: 'CAD',
  maturityDate: '2027-06-30',
  status: 'active',
}

const taxObligation: FinanceWorkspaceState['taxObligations'][number] = {
  id: 'tax-1',
  entityId: 'ent-1',
  type: 'gst_hst',
  jurisdiction: bi('Ontario', 'Ontario'),
  period: 'Q3 2026',
  dueDate: '2026-09-30',
  paymentDueDate: '2026-09-30',
  estimatedAmount: '1300.00',
  currency: 'CAD',
  preparer: 'Jordan Lee',
  reviewer: 'Martin Constantineau',
  status: 'in_preparation',
}

const taxObligation2: FinanceWorkspaceState['taxObligations'][number] = {
  id: 'tax-2',
  entityId: 'ent-1',
  type: 'income_tax',
  jurisdiction: bi('Federal', 'Fédéral'),
  period: '2026 T2',
  dueDate: '2027-06-30',
  paymentDueDate: '2027-03-31',
  estimatedAmount: '18000.00',
  currency: 'CAD',
  preparer: 'External accountant',
  status: 'planned',
}

const taxScenario: FinanceWorkspaceState['taxScenarios'][number] = {
  id: 'taxscn-1',
  entityId: 'ent-1',
  label: bi('Accelerated CCA on warehouse equipment', 'DPA accélérée sur l’équipement d’entrepôt'),
  baseline: '2026 baseline',
  proposedDecision: bi('Purchase $20k equipment in Q4, claim Class 8 at 50%', 'Acheter 20k d’équipement au T4, réclamer la classe 8 à 50%'),
  projectedProfit: '180000.00',
  projectedTaxableIncome: '160000.00',
  projectedTax: '24000.00',
  projectedCashFlow: '-20000.00',
  currency: 'CAD',
  assumptions: bi(
    'Class 8 50% rate, half-year rule, active business income under small-business limit.',
    'Classe 8 taux 50%, règle de mi-année, revenu d’entreprise active sous la limite PME.',
  ),
  lawVersion: bi('Enacted 2025 rates', 'Taux 2025 promulgués'),
  enacted: true,
  reviewer: 'External accountant',
  reviewedAt: '2026-09-04T15:00:00Z',
  status: 'reviewed',
  disclaimer: bi(
    'A tax scenario is a planning record, not a filed return. Estimated reductions are not guaranteed tax savings.',
    'Un scénario fiscal est un dossier de planification, non une déclaration produite. Les réductions estimées ne sont pas des économies fiscales garanties.',
  ),
}

const approval: FinanceWorkspaceState['approvals'][number] = {
  id: 'appr-1',
  entityId: 'ent-1',
  recordType: 'spend_request',
  recordId: 'sr-1',
  approver: 'Martin Constantineau',
  decision: 'approved',
  approvedAmount: '3600.00',
  approvedCurrency: 'CAD',
  payeeVersion: 'party-sup-1-v1',
  rationale: bi('Within operations budget.', 'Dans le budget d’exploitation.'),
  decidedAt: '2026-09-03T14:00:00Z',
}

const auditEvent: FinanceWorkspaceState['auditEvents'][number] = {
  id: 'audit-1',
  entityId: 'ent-1',
  actor: 'Martin Constantineau',
  action: bi('Approved spend request', 'Demande de dépense approuvée'),
  recordType: 'spend_request',
  recordId: 'sr-1',
  timestamp: '2026-09-03T14:00:00Z',
  outcome: bi('Committed', 'Engagé'),
}

const externalAction: FinanceWorkspaceState['externalActions'][number] = {
  id: 'ext-1',
  entityId: 'ent-1',
  recordType: 'payroll_submission',
  recordId: 'pr-1',
  status: 'provider_accepted',
  payloadVersion: 'v1',
  idempotencyKey: 'pr-1-v1',
  providerRef: 'ADP-2026-18-001',
  notes: bi('Pay run submitted to ADP; results imported.', 'Traitement de paie soumis à ADP; résultats importés.'),
}

export const initialFinanceState: FinanceWorkspaceState = {
  entities: [entity],
  books: [book],
  fiscalPeriods: [period],
  parties: [customer, supplier],
  bankAccounts: [bankAccount, taxAccount],
  ledgerAccounts,
  invoices: [invoice, overdueInvoice],
  bills: [bill],
  credits: [],
  receipts: [],
  spendRequests: [spendRequest],
  purchaseOrders: [purchaseOrder],
  expenses: [expense],
  subscriptions: [subscription],
  journals: [journal],
  bankItems: [bankItem, unmatchedBankItem],
  reconciliations: [reconciliation],
  closePeriods: [],
  payPeriods: [payPeriod],
  payRuns: [payRun],
  payrollLiabilities: [payrollLiability],
  budgets: [budget],
  scenarios: [scenario],
  forecasts: [forecast],
  reserveGoals: [reserveGoal, reserveGoal2],
  holdings: [holding],
  debts: [debt],
  taxObligations: [taxObligation, taxObligation2],
  taxScenarios: [taxScenario],
  approvals: [approval],
  auditEvents: [auditEvent],
  externalActions: [externalAction],
}
