import { defineMessages } from '../../core'

/* Payroll — pay runs, liabilities, and provider submissions. */
export const financePayroll = defineMessages({
  finance_payroll_title: { en: 'Payroll', fr: 'Paie' },
  finance_payroll_runs: { en: 'Pay runs', fr: 'Traitements de paie' },
  finance_payroll_no_runs: { en: 'No pay runs.', fr: 'Aucun traitement de paie.' },
  finance_payroll_period: { en: 'Pay period', fr: 'Période de paie' },
  finance_payroll_gross: { en: 'Gross pay', fr: 'Salaire brut' },
  finance_payroll_deductions: { en: 'Employee deductions', fr: 'Déductions de l’employé' },
  finance_payroll_employer: { en: 'Employer contributions', fr: 'Cotisations patronales' },
  finance_payroll_net: { en: 'Net pay', fr: 'Salaire net' },
  finance_payroll_fees: { en: 'Provider fees', fr: 'Frais du fournisseur' },
  finance_payroll_jurisdictions: { en: 'Jurisdictions', fr: 'Juridictions' },
  finance_payroll_exceptions: { en: 'Exceptions', fr: 'Exceptions' },
  finance_payroll_liabilities: { en: 'Payroll liabilities', fr: 'Passifs de paie' },
  finance_payroll_mark_inputs_approved: { en: 'Approve inputs', fr: 'Approuver les intrants' },
  finance_payroll_mark_submitted: { en: 'Submit to provider', fr: 'Soumettre au fournisseur' },
  finance_payroll_mark_results: { en: 'Import results', fr: 'Importer les résultats' },
  finance_payroll_mark_reconciled: { en: 'Mark reconciled', fr: 'Marquer rapproché' },
  finance_payroll_restricted: {
    en: 'Payroll details are restricted.',
    fr: 'Les détails de paie sont restreints.',
  },
  finance_payroll_admin_only: {
    en: 'Payroll records are visible to admins only. Ask a workspace admin to grant access or review pay runs.',
    fr: "Les dossiers de paie sont visibles par les administrateurs uniquement. Demandez à un administrateur de l'espace d'accorder l'accès ou de réviser les traitements.",
  },

  /* Payroll liability settlement */
  finance_payroll_settle_liability: { en: 'Mark settled', fr: 'Marquer réglé' },

  /* Payroll external actions */
  finance_payroll_external_actions: { en: 'Payroll submissions', fr: 'Soumissions de paie' },
  finance_payroll_no_external_actions: {
    en: 'No payroll submissions tracked',
    fr: 'Aucune soumission de paie suivie',
  },
})
