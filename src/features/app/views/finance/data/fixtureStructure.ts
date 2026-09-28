import { bi } from '@/i18n/core'
import { DEFAULT_LEDGER_ACCOUNTS } from './defaultCategoryRules'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo finance fixtures — entities, book, fiscal period, parties, accounts, ledger accounts.
 *
 * Split from fixtures.ts under the 800-line source budget; assembled into
 * initialFinanceState there.
 */

export const entity: FinanceWorkspaceState['entities'][number] = {
  id: 'ent-1',
  legalName: 'Northgate Logistics Inc.',
  legalForm: 'corporation',
  fiscalYearStart: '2026-01-01',
  functionalCurrency: 'CAD',
  jurisdictions: ['ON', 'QC'],
  accountingSourceId: 'qb-001',
  payrollSourceId: 'adp-001',
  /* The operating company is wholly owned by the holding company below —
     this edge is what turns the entity registry into a holdings structure. */
  parentEntityId: 'ent-2',
  ownershipPct: '100',
  active: true,
}

export const holdingEntity: FinanceWorkspaceState['entities'][number] = {
  id: 'ent-2',
  legalName: 'Northgate Holdings Inc.',
  legalForm: 'corporation',
  fiscalYearStart: '2026-01-01',
  functionalCurrency: 'CAD',
  jurisdictions: ['ON'],
  active: true,
}

export const book: FinanceWorkspaceState['books'][number] = {
  id: 'book-1',
  entityId: 'ent-1',
  label: bi('Main ledger', 'Grand livre principal'),
  basis: 'accrual',
  authoritativeSource: bi('QuickBooks Online', 'QuickBooks Online'),
  lastSyncedAt: '2026-09-05T22:00:00Z',
}

export const period: FinanceWorkspaceState['fiscalPeriods'][number] = {
  id: 'period-2026-q3',
  entityId: 'ent-1',
  label: 'Q3 2026',
  startDate: '2026-07-01',
  endDate: '2026-09-30',
  status: 'open',
}

export const customer: FinanceWorkspaceState['parties'][number] = {
  id: 'party-cust-1',
  entityId: 'ent-1',
  name: 'Maple Freight Co.',
  type: 'customer',
  externalId: 'QB-C-1001',
  bankingDetailsOnFile: false,
  active: true,
}

export const supplier: FinanceWorkspaceState['parties'][number] = {
  id: 'party-sup-1',
  entityId: 'ent-1',
  name: 'TechSupply Canada',
  type: 'supplier',
  externalId: 'QB-V-2001',
  bankingDetailsOnFile: true,
  active: true,
}

export const investor: FinanceWorkspaceState['parties'][number] = {
  id: 'party-inv-1',
  entityId: 'ent-2',
  name: 'Laurentian Growth Partners',
  type: 'investor',
  bankingDetailsOnFile: true,
  contactName: 'Amélie Bouchard',
  contactEmail: 'abouchard@laurentiangrowth.example',
  active: true,
}

export const lender: FinanceWorkspaceState['parties'][number] = {
  id: 'party-len-1',
  entityId: 'ent-2',
  name: 'Big Five Bank',
  type: 'lender',
  bankingDetailsOnFile: true,
  contactName: 'Daniel Roy',
  contactEmail: 'droy@bigfivebank.example',
  contactPhone: '+1 514 555 0187',
  active: true,
}

export const bankAccount: FinanceWorkspaceState['bankAccounts'][number] = {
  id: 'bank-1',
  entityId: 'ent-1',
  label: bi('Operating account', 'Compte d’exploitation'),
  currency: 'CAD',
  last4: '4471',
  restricted: false,
  earmarkedAmount: '5000.00',
}

export const taxAccount: FinanceWorkspaceState['bankAccounts'][number] = {
  id: 'bank-2',
  entityId: 'ent-1',
  label: bi('Tax reserve account', 'Compte de réserve fiscale'),
  currency: 'CAD',
  last4: '8829',
  restricted: true,
  earmarkedAmount: '12000.00',
}

export const ledgerAccounts: FinanceWorkspaceState['ledgerAccounts'] = DEFAULT_LEDGER_ACCOUNTS.map(
  (la) => ({
    id: `acct-${la.code}`,
    bookId: book.id,
    code: la.code,
    name: la.name,
    type: la.type,
    sensitive: la.sensitive ?? false,
    active: true,
  }),
)
