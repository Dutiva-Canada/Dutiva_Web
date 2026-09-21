import { defineMessages } from '../../core'

/* Plans & budgets — budgets, scenarios, forecasts, variance, cash flow. */
export const financePlans = defineMessages({
  finance_plans_title: { en: 'Plans & budgets', fr: 'Plans et budgets' },
  finance_plans_budgets: { en: 'Budgets', fr: 'Budgets' },
  finance_plans_no_budgets: { en: 'No budgets.', fr: 'Aucun budget.' },
  finance_plans_add_budget: { en: 'Add budget', fr: 'Ajouter un budget' },
  finance_plans_scenarios: { en: 'Scenarios', fr: 'Scénarios' },
  finance_plans_no_scenarios: { en: 'No scenarios.', fr: 'Aucun scénario.' },
  finance_plans_forecasts: { en: 'Forecasts', fr: 'Prévisions' },
  finance_plans_budgeted: { en: 'Budgeted', fr: 'Budgété' },
  finance_plans_actual: { en: 'Actual', fr: 'Réel' },
  finance_plans_committed: { en: 'Committed', fr: 'Engagé' },
  finance_plans_headroom: { en: 'Headroom', fr: 'Marge' },
  finance_plans_version: { en: 'Version', fr: 'Version' },
  finance_plans_assumptions: { en: 'Assumptions', fr: 'Hypothèses' },
  finance_plans_cutoff: { en: 'Actuals cutoff', fr: 'Coupure des réels' },
  finance_plans_stale: { en: 'Stale — review needed', fr: 'Périmé — révision requise' },
  finance_plans_revise: { en: 'Revise', fr: 'Réviser' },

  /* Plans — budget create/edit */
  finance_budget_create: { en: 'New budget', fr: 'Nouveau budget' },
  finance_budget_label: { en: 'Label', fr: 'Libellé' },
  finance_budget_owner: { en: 'Owner', fr: 'Responsable' },
  finance_budget_lines: { en: 'Budget lines', fr: 'Lignes budgétaires' },
  finance_budget_add_line: { en: 'Add line', fr: 'Ajouter une ligne' },
  finance_budget_department: { en: 'Department', fr: 'Département' },
  finance_budget_period: { en: 'Period', fr: 'Période' },
  finance_budget_amount: { en: 'Amount', fr: 'Montant' },
  finance_budget_approve: { en: 'Approve', fr: 'Approuver' },

  /* Plans — scenario create */
  finance_scenario_create: { en: 'New scenario', fr: 'Nouveau scénario' },
  finance_scenario_label: { en: 'Label', fr: 'Libellé' },
  finance_scenario_type: { en: 'Type', fr: 'Type' },
  finance_scenario_assumptions: { en: 'Assumptions', fr: 'Hypothèses' },
  finance_scenario_cutoff: { en: 'Cutoff date', fr: 'Date de coupure' },
  finance_scenario_revenue: { en: 'Projected revenue', fr: 'Revenus projetés' },
  finance_scenario_expense: { en: 'Projected expense', fr: 'Dépenses projetées' },
  finance_scenario_cashflow: { en: 'Projected cash flow', fr: 'Flux de trésorerie projeté' },
  finance_scenario_review: { en: 'Mark reviewed', fr: 'Marquer révisé' },
  finance_scenario_accept: { en: 'Accept', fr: 'Accepter' },

  /* Plans — forecast create */
  finance_forecast_create: { en: 'New forecast', fr: 'Nouvelle prévision' },
  finance_forecast_label: { en: 'Label', fr: 'Libellé' },
  finance_forecast_type: { en: 'Type', fr: 'Type' },
  finance_forecast_owner: { en: 'Owner', fr: 'Responsable' },
  finance_forecast_freeze: { en: 'Freeze', fr: 'Geler' },

  /* Budget variance */
  finance_variance_title: { en: 'Budget variance', fr: 'Écart budgétaire' },
  finance_variance_department: { en: 'Department', fr: 'Département' },
  finance_variance_period: { en: 'Period', fr: 'Période' },
  finance_variance_budgeted: { en: 'Budgeted', fr: 'Budgété' },
  finance_variance_actual: { en: 'Actual', fr: 'Réel' },
  finance_variance_committed: { en: 'Committed', fr: 'Engagé' },
  finance_variance_headroom: { en: 'Headroom', fr: 'Marge' },
  finance_variance_pct: { en: 'Used %', fr: 'Utilisé %' },

  /* Cash-flow projection */
  finance_cashflow_title: { en: 'Cash-flow projection', fr: 'Projection de trésorerie' },
  finance_cashflow_period: { en: 'Period', fr: 'Période' },
  finance_cashflow_inflow: { en: 'Inflow', fr: 'Entrées' },
  finance_cashflow_outflow: { en: 'Outflow', fr: 'Sorties' },
  finance_cashflow_net: { en: 'Net', fr: 'Net' },
  finance_cashflow_closing: { en: 'Closing balance', fr: 'Solde de clôture' },

  /* Budget revise flow */
  finance_budget_revise_lines: { en: 'Revise lines', fr: 'Réviser les lignes' },
  finance_budget_actual_amount: { en: 'Actual', fr: 'Réel' },
  finance_budget_committed_amount: { en: 'Committed', fr: 'Engagé' },

  /* Forecast period editor */
  finance_forecast_add_period: { en: 'Add period', fr: 'Ajouter une période' },
  finance_forecast_period_label: { en: 'Period label', fr: 'Libellé de période' },
  finance_forecast_start_date: { en: 'Start date', fr: 'Date de début' },
  finance_forecast_end_date: { en: 'End date', fr: 'Date de fin' },
  finance_forecast_inflow: { en: 'Inflow', fr: 'Entrées' },
  finance_forecast_outflow: { en: 'Outflow', fr: 'Sorties' },
  finance_forecast_net: { en: 'Net', fr: 'Net' },
  finance_forecast_closing: { en: 'Closing balance', fr: 'Solde de clôture' },
  finance_forecast_save_periods: { en: 'Save periods', fr: 'Enregistrer les périodes' },

  /* Plan frozen badge */
  finance_plan_frozen: { en: 'Frozen', fr: 'Gelé' },

  /* Scenario types */
  finance_scenario_type_baseline: { en: 'Baseline', fr: 'Référence' },
  finance_scenario_type_hiring: { en: 'Hiring', fr: 'Embauche' },
  finance_scenario_type_capital_purchase: { en: 'Capital purchase', fr: 'Achat d’immobilisations' },
  finance_scenario_type_financing: { en: 'Financing', fr: 'Financement' },
  finance_scenario_type_operating_change: {
    en: 'Operating change',
    fr: 'Changement d’exploitation',
  },
  finance_scenario_type_tax: { en: 'Tax', fr: 'Fiscalité' },

  /* Forecast types */
  finance_forecast_type_monthly_operating: {
    en: 'Monthly operating',
    fr: 'Exploitation mensuelle',
  },
  finance_forecast_type_13_week_cash: { en: '13-week cash', fr: 'Trésorerie de 13 semaines' },
  finance_forecast_type_custom: { en: 'Custom', fr: 'Personnalisé' },
})
