import { defineMessages } from '../../core'

/* Tax — obligations, planning scenarios, and external actions. */
export const financeTax = defineMessages({
  finance_tax_title: { en: 'Tax', fr: 'Fiscalité' },
  finance_tax_obligations: { en: 'Tax obligations', fr: 'Obligations fiscales' },
  finance_tax_no_obligations: { en: 'No tax obligations.', fr: 'Aucune obligation fiscale.' },
  finance_tax_add_obligation: { en: 'Add obligation', fr: 'Ajouter une obligation' },
  finance_tax_scenarios: { en: 'Tax planning scenarios', fr: 'Scénarios de planification fiscale' },
  finance_tax_no_scenarios: { en: 'No tax scenarios.', fr: 'Aucun scénario fiscal.' },
  finance_tax_add_scenario: { en: 'Add scenario', fr: 'Ajouter un scénario' },
  finance_tax_jurisdiction: { en: 'Jurisdiction', fr: 'Juridiction' },
  finance_tax_type: { en: 'Tax type', fr: 'Type d’impôt' },
  finance_tax_payment_due: { en: 'Payment due', fr: 'Paiement dû' },
  finance_tax_preparer: { en: 'Preparer', fr: 'Préparateur' },
  finance_tax_reviewer: { en: 'Reviewer', fr: 'Réviseur' },
  finance_tax_estimated: { en: 'Estimated', fr: 'Estimé' },
  finance_tax_confirmed: { en: 'Confirmed', fr: 'Confirmé' },
  finance_tax_filing_ref: { en: 'Filing reference', fr: 'Référence de dépôt' },
  finance_tax_mark_in_preparation: { en: 'Start preparation', fr: 'Commencer la préparation' },
  finance_tax_mark_reviewed: { en: 'Mark reviewed', fr: 'Marquer révisé' },
  finance_tax_mark_filed: { en: 'Mark filed', fr: 'Marquer produit' },
  finance_tax_mark_paid: { en: 'Mark paid', fr: 'Marquer payé' },
  finance_tax_mark_confirmed: { en: 'Confirm', fr: 'Confirmer' },
  finance_tax_mark_withdrawn: { en: 'Withdraw', fr: 'Retirer' },
  finance_tax_enacted: { en: 'Enacted', fr: 'Promulgué' },
  finance_tax_proposed: { en: 'Proposed', fr: 'Proposé' },
  finance_tax_disclaimer: {
    en: 'A tax scenario is a planning record, not a filed return. Estimated reductions are not guaranteed tax savings.',
    fr: 'Un scénario fiscal est un dossier de planification, non une déclaration produite. Les réductions estimées ne sont pas des économies fiscales garanties.',
  },

  /* External actions section in Tax */
  finance_tax_external_actions: { en: 'External actions', fr: 'Actions externes' },

  /* Tax scenario actions */
  finance_tax_scenario_review: { en: 'Mark reviewed', fr: 'Marquer révisé' },
  finance_tax_scenario_accept: { en: 'Accept', fr: 'Accepter' },
  finance_tax_scenario_mark_stale: { en: 'Mark stale', fr: 'Marquer obsolète' },

  /* Tax create forms */
  finance_tax_create_obligation: { en: 'New tax obligation', fr: 'Nouvelle obligation fiscale' },
  finance_tax_period: { en: 'Period', fr: 'Période' },
  finance_tax_due_date: { en: 'Filing due date', fr: 'Échéance de production' },
  finance_tax_create_scenario: { en: 'New tax scenario', fr: 'Nouveau scénario fiscal' },
  finance_tax_scenario_label: { en: 'Label', fr: 'Libellé' },
  finance_tax_scenario_baseline: { en: 'Baseline', fr: 'Référence' },
  finance_tax_scenario_decision: { en: 'Proposed decision', fr: 'Décision proposée' },
  finance_tax_scenario_profit: { en: 'Projected profit', fr: 'Bénéfice projeté' },
  finance_tax_scenario_taxable_income: {
    en: 'Projected taxable income',
    fr: 'Revenu imposable projeté',
  },
  finance_tax_scenario_projected_tax: { en: 'Projected tax', fr: 'Impôt projeté' },
  finance_tax_scenario_projected_cashflow: {
    en: 'Projected cash flow',
    fr: 'Flux de trésorerie projeté',
  },
  finance_tax_scenario_assumptions: { en: 'Assumptions', fr: 'Hypothèses' },
  finance_tax_scenario_law_version: { en: 'Law version', fr: 'Version de la loi' },
  finance_tax_scenario_enacted: { en: 'Enacted', fr: 'Promulguée' },
  finance_tax_scenario_proposed: { en: 'Proposed', fr: 'Proposée' },

  /* Tax types */
  finance_tax_type_income_tax: { en: 'Income tax', fr: 'Impôt sur le revenu' },
  finance_tax_type_gst_hst: { en: 'GST/HST', fr: 'TPS/TVH' },
  finance_tax_type_qst: { en: 'QST', fr: 'TVQ' },
  finance_tax_type_payroll_source_deductions: {
    en: 'Payroll source deductions',
    fr: 'Retenues à la source sur la paie',
  },
  finance_tax_type_employer_contributions: {
    en: 'Employer contributions',
    fr: 'Cotisations patronales',
  },
  finance_tax_type_other: { en: 'Other', fr: 'Autre' },
})
