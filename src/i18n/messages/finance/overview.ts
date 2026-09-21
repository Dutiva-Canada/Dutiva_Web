import { defineMessages } from '../../core'

/* Overview screen — KPIs, queues, and typed exception rows. */
export const financeOverview = defineMessages({
  finance_overview_cash_position: { en: 'Cash position', fr: 'Position de trésorerie' },
  finance_overview_upcoming: { en: 'Upcoming obligations', fr: 'Obligations à venir' },
  finance_overview_approvals: { en: 'Approvals queue', fr: 'File d’approbations' },
  finance_overview_exceptions: { en: 'Exceptions', fr: 'Exceptions' },
  finance_overview_budget_headroom: { en: 'Budget headroom', fr: 'Marge budgétaire' },
  finance_overview_no_upcoming: {
    en: 'No upcoming obligations.',
    fr: 'Aucune obligation à venir.',
  },
  finance_overview_no_exceptions: { en: 'No open exceptions.', fr: 'Aucune exception ouverte.' },
  finance_exception_type_bank: { en: 'Bank item', fr: 'Élément bancaire' },
  finance_exception_type_reconciliation: { en: 'Reconciliation', fr: 'Rapprochement' },
  finance_exception_type_payroll: { en: 'Payroll run', fr: 'Traitement de paie' },
  finance_overview_no_approvals: {
    en: 'No items awaiting approval.',
    fr: 'Aucun élément en attente d’approbation.',
  },
  finance_overview_data_freshness: { en: 'Data freshness', fr: 'Fraîcheur des données' },
  finance_overview_all_areas: {
    en: 'Open a tab above to drill into a workspace area.',
    fr: 'Ouvrez un onglet ci-dessus pour explorer un secteur de l’espace de travail.',
  },

  /* Overview KPIs */
  finance_overview_kpis: { en: 'Key metrics', fr: 'Indicateurs clés' },
  finance_overview_ar: { en: 'Outstanding receivables', fr: 'Créances en suspens' },
  finance_overview_ap: { en: 'Outstanding payables', fr: 'Dettes en suspens' },
  finance_overview_burn_rate: { en: 'Monthly burn', fr: 'Brûlage mensuel' },
  finance_overview_cash_total: { en: 'Cash on hand', fr: 'Trésorerie disponible' },
})
