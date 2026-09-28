import type { Bi } from '@/i18n/core'
import type { FinanceCurrency } from './entityTypes'

/* ---------- Budgets and planning ---------- */

export type FinanceBudgetStatus = 'draft' | 'approved' | 'revised' | 'archived'

export interface FinanceBudgetLine {
  id: string
  department?: string
  projectId?: string
  period: string
  amount: string
  currency: FinanceCurrency
  /** Recognized actual cost for this line's period and scope. */
  actualAmount: string
  /** Remaining committed amount (POs not yet billed). */
  committedAmount: string
}

export interface FinanceBudget {
  id: string
  entityId: string
  label: Bi
  status: FinanceBudgetStatus
  currency: FinanceCurrency
  lines: FinanceBudgetLine[]
  owner: string
  approvedAt?: string
  /** Version increments on material change; invalidates downstream plans. */
  version: number
}

export type FinanceScenarioType =
  'baseline' | 'hiring' | 'capital_purchase' | 'financing' | 'operating_change' | 'tax'

export interface FinanceScenario {
  id: string
  entityId: string
  label: Bi
  type: FinanceScenarioType
  assumptions: Bi
  /** Actuals cutoff date this forecast is based on. */
  cutoffDate: string
  currency: FinanceCurrency
  projectedRevenue: string
  projectedExpense: string
  projectedCashFlow: string
  status: 'draft' | 'reviewed' | 'accepted' | 'stale'
  reviewer?: string
  reviewedAt?: string
  /** A later change to facts or rules marks the scenario for review. */
  staleReason?: Bi
}

export interface FinanceForecast {
  id: string
  entityId: string
  label: Bi
  type: '13_week_cash' | 'monthly_operating' | 'custom'
  baselineScenarioId?: string
  currency: FinanceCurrency
  periods: FinanceForecastPeriod[]
  owner: string
  frozenAt?: string
}

export interface FinanceForecastPeriod {
  label: string
  startDate: string
  endDate: string
  inflow: string
  outflow: string
  net: string
  closingBalance: string
}

/* ---------- Treasury ---------- */

export type FinanceReserveType =
  'payroll' | 'tax' | 'emergency_operating' | 'capital_purchase' | 'other'

export interface FinanceReserveGoal {
  id: string
  entityId: string
  type: FinanceReserveType
  label: Bi
  targetAmount: string
  currentAmount: string
  currency: FinanceCurrency
  linkedBankAccountId?: string
  dueDate?: string
  owner: string
}

export interface FinanceHolding {
  id: string
  entityId: string
  label: Bi
  institution: Bi
  units?: string
  costBasis?: string
  carryingValue?: string
  marketValue?: string
  currency: FinanceCurrency
  asOfDate: string
  realizedResult?: string
  unrealizedChange?: string
  incomeYtd?: string
  feesYtd?: string
  valuationSource: Bi
  /** Whether the valuation is stale (no recent price). */
  stale: boolean
}

export interface FinanceDebt {
  id: string
  entityId: string
  label: Bi
  lender: Bi
  principal: string
  balance: string
  interestRate: string
  currency: FinanceCurrency
  maturityDate: string
  noticePeriod?: string
  collateralRef?: string
  covenantRef?: string
  status: 'active' | 'paid_off' | 'defaulted'
}

/* ---------- Treasury cash sweeps (migration 0174) ---------- */

export type FinanceCashSweepStatus = 'scheduled' | 'executed' | 'cancelled'

/**
 * A treasury sweep record — moving money between finance bank accounts
 * (operating → reserve, etc.). Dutiva records the instruction and its
 * outcome; it does not execute the transfer.
 */
export interface FinanceCashSweep {
  id: string
  entityId: string
  fromAccountId: string
  toAccountId: string
  amount: string
  currency: FinanceCurrency
  status: FinanceCashSweepStatus
  scheduledDate: string
  executedDate?: string
  reference?: string
  notes?: Bi
}
/* ---------- Tax ---------- */

export type FinanceTaxType =
  | 'income_tax'
  | 'gst_hst'
  | 'qst'
  | 'payroll_source_deductions'
  | 'employer_contributions'
  | 'other'

export type FinanceObligationStatus =
  | 'planned'
  | 'in_preparation'
  | 'reviewed'
  | 'filed'
  | 'paid'
  | 'confirmed'
  | 'overdue'
  | 'withdrawn'

export interface FinanceTaxObligation {
  id: string
  entityId: string
  type: FinanceTaxType
  jurisdiction: Bi
  period: string
  dueDate: string
  /** Filing deadline and payment deadline are separate. */
  paymentDueDate?: string
  estimatedAmount: string
  confirmedAmount?: string
  currency: FinanceCurrency
  preparer?: string
  reviewer?: string
  status: FinanceObligationStatus
  evidenceRefs?: string[]
  filingRef?: string
  notes?: Bi
}

export interface FinanceTaxScenario {
  id: string
  entityId: string
  label: Bi
  baseline: string
  proposedDecision: Bi
  projectedProfit: string
  projectedTaxableIncome: string
  projectedTax: string
  projectedCashFlow: string
  currency: FinanceCurrency
  assumptions: Bi
  lawVersion: Bi
  /** Enacted rules vs proposed changes are distinguished. */
  enacted: boolean
  reviewer?: string
  reviewedAt?: string
  status: 'draft' | 'reviewed' | 'accepted' | 'stale'
  /** A later change to facts or rules marks the scenario for review. */
  staleReason?: Bi
  /** A tax scenario is a planning record, not a filed return. */
  disclaimer: Bi
}
