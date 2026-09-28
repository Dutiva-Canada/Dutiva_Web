import { bi } from '@/i18n/core'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo finance fixtures — budget, scenario, forecast, reserve goals, holding.
 *
 * Split from fixtures.ts under the 800-line source budget; assembled into
 * initialFinanceState there.
 */

export const budget: FinanceWorkspaceState['budgets'][number] = {
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

export const scenario: FinanceWorkspaceState['scenarios'][number] = {
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

export const forecast: FinanceWorkspaceState['forecasts'][number] = {
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

export const reserveGoal: FinanceWorkspaceState['reserveGoals'][number] = {
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

export const reserveGoal2: FinanceWorkspaceState['reserveGoals'][number] = {
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

export const holding: FinanceWorkspaceState['holdings'][number] = {
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
