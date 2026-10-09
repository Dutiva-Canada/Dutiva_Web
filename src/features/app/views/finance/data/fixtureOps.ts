import { bi } from '@/i18n/core'
import { DEFAULT_CATEGORY_RULES } from './defaultCategoryRules'
import { entity } from './fixtureStructure'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo finance fixtures — debt, cash sweeps, tax, approvals, audit events, external actions, category rules, import session.
 *
 * Split from fixtures.ts under the 800-line source budget; assembled into
 * initialFinanceState there.
 */

export const debt: FinanceWorkspaceState['debts'][number] = {
  id: 'debt-1',
  entityId: 'ent-1',
  label: bi('Business line of credit', 'Marge de crédit commerciale'),
  lender: bi('Big Five Bank', 'Grande banque canadienne'),
  principal: '50000.00',
  balance: '32000.00',
  interestRate: '7.25',
  currency: 'CAD',
  maturityDate: '2026-11-30',
  /* Covenant + notice columns exist since the debts table shipped but were
     never rendered — the fixture exercises them on the Treasury tab, and
     the near maturity exercises the "maturing soon" marker. */
  noticePeriod: '60 days',
  covenantRef: 'DSC ≥ 1.25×',
  status: 'active',
}

/* Cash sweeps — operating → tax reserve. Dutiva records the sweep; the
   executed row carries its executed date, the scheduled one doesn't. */
export const sweepExecuted: FinanceWorkspaceState['cashSweeps'][number] = {
  id: 'sweep-1',
  entityId: 'ent-1',
  fromAccountId: 'bank-1',
  toAccountId: 'bank-2',
  amount: '4000.00',
  currency: 'CAD',
  status: 'executed',
  scheduledDate: '2026-09-15',
  executedDate: '2026-09-16',
  reference: 'Q3 instalment sweep',
}

export const sweepScheduled: FinanceWorkspaceState['cashSweeps'][number] = {
  id: 'sweep-2',
  entityId: 'ent-1',
  fromAccountId: 'bank-1',
  toAccountId: 'bank-2',
  amount: '2500.00',
  currency: 'CAD',
  status: 'scheduled',
  scheduledDate: '2026-10-01',
  reference: 'Q4 instalment sweep',
}

export const taxObligation: FinanceWorkspaceState['taxObligations'][number] = {
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

export const taxObligation2: FinanceWorkspaceState['taxObligations'][number] = {
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

export const taxScenario: FinanceWorkspaceState['taxScenarios'][number] = {
  id: 'taxscn-1',
  entityId: 'ent-1',
  label: bi('Accelerated CCA on warehouse equipment', 'DPA accélérée sur l’équipement d’entrepôt'),
  baseline: '2026 baseline',
  proposedDecision: bi(
    'Purchase $20k equipment in Q4, claim Class 8 at 50%',
    'Acheter 20k d’équipement au T4, réclamer la classe 8 à 50%',
  ),
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

export const approval: FinanceWorkspaceState['approvals'][number] = {
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

export const auditEvent: FinanceWorkspaceState['auditEvents'][number] = {
  id: 'audit-1',
  entityId: 'ent-1',
  actor: 'Martin Constantineau',
  action: bi('Approved spend request', 'Demande de dépense approuvée'),
  recordType: 'spend_request',
  recordId: 'sr-1',
  timestamp: '2026-09-03T14:00:00Z',
  outcome: bi('Committed', 'Engagé'),
}

/* Finance-lifecycle events for the governance audit trail — the cap-table
   and partner rows are derived from state, so the board view reads the
   same records the workspace writes. */
export const auditCallReceived: FinanceWorkspaceState['auditEvents'][number] = {
  id: 'audit-2',
  entityId: 'ent-2',
  actor: 'Riley Chen',
  action: bi('Recorded capital call receipt', 'Réception d’appel de capital enregistrée'),
  recordType: 'capital_call',
  recordId: 'call-1',
  timestamp: '2026-08-12T16:30:00Z',
  outcome: bi('Received', 'Reçu'),
}

export const auditCommitmentCreated: FinanceWorkspaceState['auditEvents'][number] = {
  id: 'audit-3',
  entityId: 'ent-2',
  actor: 'Martin Constantineau',
  action: bi('Created capital commitment', 'Engagement de capital créé'),
  recordType: 'commitment',
  recordId: 'cmt-1',
  timestamp: '2026-07-02T10:15:00Z',
  outcome: bi('Active', 'Actif'),
}

export const auditDealAdvanced: FinanceWorkspaceState['auditEvents'][number] = {
  id: 'audit-4',
  entityId: 'ent-2',
  actor: 'Jordan Lee',
  action: bi('Advanced deal stage', 'Étape de l’opération avancée'),
  recordType: 'deal',
  recordId: 'deal-1',
  timestamp: '2026-09-18T09:45:00Z',
  outcome: bi('Moved to negotiation', 'Passée à la négociation'),
}

export const externalAction: FinanceWorkspaceState['externalActions'][number] = {
  id: 'ext-1',
  entityId: 'ent-1',
  recordType: 'payroll_submission',
  recordId: 'pr-1',
  status: 'provider_accepted',
  payloadVersion: 'v1',
  idempotencyKey: 'pr-1-v1',
  providerRef: 'ADP-2026-18-001',
  notes: bi(
    'Pay run submitted to ADP; results imported.',
    'Traitement de paie soumis à ADP ; résultats importés.',
  ),
}

export const categoryRules: FinanceWorkspaceState['categoryRules'] = DEFAULT_CATEGORY_RULES.map(
  (rule, index) => ({
    id: `cat-rule-${index + 1}`,
    entityId: entity.id,
    pattern: rule.pattern,
    matchType: rule.matchType,
    ledgerAccountId: `acct-${rule.ledgerAccountCode}`,
    direction: rule.direction,
    priority: rule.priority,
    active: true,
  }),
)

export const importSession: FinanceWorkspaceState['importSessions'][number] = {
  id: 'imp-1',
  entityId: 'ent-1',
  bankAccountId: 'bank-1',
  fileName: 'operating_2026_08.csv',
  importedAt: '2026-08-20T10:00:00Z',
  totalRows: 42,
  newItems: 38,
  duplicates: 4,
  errors: 0,
  status: 'imported',
}
