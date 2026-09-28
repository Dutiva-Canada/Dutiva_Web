import type { FinanceWorkspaceState } from './types'
import {
  entity,
  holdingEntity,
  book,
  period,
  customer,
  supplier,
  investor,
  lender,
  bankAccount,
  taxAccount,
  ledgerAccounts,
} from './fixtureStructure'
import {
  invoice,
  overdueInvoice,
  bill,
  spendRequest,
  purchaseOrder,
  expense,
  subscription,
} from './fixtureDocuments'
import {
  journal,
  bankItem,
  unmatchedBankItem,
  reconciliation,
  payPeriod,
  payRun,
  payrollLiability,
} from './fixtureLedger'
import { budget, scenario, forecast, reserveGoal, reserveGoal2, holding } from './fixturePlanning'
import {
  watchlistItem,
  watchlistItem2,
  decisionEntry,
  decisionEntry2,
  commitmentInvestor,
  commitmentLender,
  capitalCallReceived,
  capitalCallScheduled,
  linkDeal,
  linkHolding,
  dealAcquisition,
  dealInvestment,
  dealFinancing,
  dealPassed,
} from './fixtureInvest'
import {
  debt,
  sweepExecuted,
  sweepScheduled,
  taxObligation,
  taxObligation2,
  taxScenario,
  approval,
  auditEvent,
  auditCallReceived,
  auditCommitmentCreated,
  auditDealAdvanced,
  externalAction,
  categoryRules,
  importSession,
} from './fixtureOps'

/**
 * Demo fixtures for the finance workspace, including a Canadian SMB
 * corporation with one book, payroll, invoices, bills, budgets, and tax
 * obligations. Fixture records live in the fixture* sibling modules
 * (800-line source budget); this file only assembles the workspace state.
 *
 * [FR self-authored for fixture copy; not from a design handoff.]
 */
export const initialFinanceState: FinanceWorkspaceState = {
  entities: [entity, holdingEntity],
  books: [book],
  fiscalPeriods: [period],
  parties: [customer, supplier, investor, lender],
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
  watchlistItems: [watchlistItem, watchlistItem2],
  decisionEntries: [decisionEntry, decisionEntry2],
  deals: [dealAcquisition, dealInvestment, dealFinancing, dealPassed],
  commitments: [commitmentInvestor, commitmentLender],
  capitalCalls: [capitalCallReceived, capitalCallScheduled],
  debts: [debt],
  cashSweeps: [sweepExecuted, sweepScheduled],
  documentLinks: [linkDeal, linkHolding],
  taxObligations: [taxObligation, taxObligation2],
  taxScenarios: [taxScenario],
  approvals: [approval],
  auditEvents: [auditEvent, auditCallReceived, auditCommitmentCreated, auditDealAdvanced],
  externalActions: [externalAction],
  categoryRules,
  importSessions: [importSession],
  aiImportSettings: { aiImportEnabled: false, aiImportMode: 'auto_high' },
  categorizationFeedback: [],
}
