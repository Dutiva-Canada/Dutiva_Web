import type { Bi } from '@/i18n/core'

/* ---------- Entity and structural records ---------- */

export type FinanceCurrency = 'CAD' | 'USD' | 'EUR' | 'GBP'

export type FinanceLegalForm =
  'corporation' | 'partnership' | 'sole_proprietor' | 'nonprofit' | 'trust'

export interface FinanceLegalEntity {
  id: string
  legalName: string
  legalForm: FinanceLegalForm
  fiscalYearStart: string
  /** Functional currency for accounting. */
  functionalCurrency: FinanceCurrency
  jurisdictions: string[]
  /** External accounting system identifier (e.g. QuickBooks company ID). */
  accountingSourceId?: string
  /** External payroll provider identifier. */
  payrollSourceId?: string
  /** Owning entity in the holdings structure — e.g. a holdco. */
  parentEntityId?: string
  /** The parent's stake in this entity, decimal percent string. */
  ownershipPct?: string
  active: boolean
}

export interface FinanceBook {
  id: string
  entityId: string
  label: Bi
  basis: 'accrual' | 'cash'
  /** Source system that is authoritative for posted entries in this book. */
  authoritativeSource: Bi
  lastSyncedAt?: string
}

export interface FinanceFiscalPeriod {
  id: string
  entityId: string
  label: string
  startDate: string
  endDate: string
  status: 'open' | 'closing' | 'closed' | 'locked'
}

/* ---------- Parties and accounts ---------- */

export type FinancePartyType =
  'customer' | 'supplier' | 'employee' | 'bank' | 'advisor' | 'investor' | 'lender'

export interface FinanceParty {
  id: string
  entityId: string
  name: string
  type: FinancePartyType
  externalId?: string
  /** Restricted payee details are masked in general views. */
  bankingDetailsOnFile: boolean
  /** Point of contact — used mostly for investors/lenders, but the
      columns exist on every party. */
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  active: boolean
}

export interface FinanceBankAccount {
  id: string
  entityId: string
  label: Bi
  currency: FinanceCurrency
  /** Last 4 digits only; full number is restricted. */
  last4?: string
  restricted: boolean
  earmarkedAmount?: string
  /** ISO 8601 date for deposit or financing maturity, if applicable. */
  maturityDate?: string
}

export interface FinanceLedgerAccount {
  id: string
  bookId: string
  code: string
  name: Bi
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'contra'
  /** Whether this account is restricted from general ledger users. */
  sensitive: boolean
  active: boolean
}
