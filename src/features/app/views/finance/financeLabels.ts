import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import type {
  FinanceBankMatchStatus,
  FinanceBudgetStatus,
  FinanceCurrency,
  FinanceExternalActionStatus,
  FinanceInvoiceStatus,
  FinanceJournalStatus,
  FinanceLegalForm,
  FinanceObligationStatus,
  FinancePayRunStatus,
  FinanceRequestStatus,
  FinanceReserveType,
  FinanceScenarioType,
  FinanceTaxType,
} from './data/types'

export const CURRENCY_LABEL: Record<FinanceCurrency, Bi> = {
  CAD: { en: 'CAD', fr: 'CAD' },
  USD: { en: 'USD', fr: 'USD' },
  EUR: { en: 'EUR', fr: 'EUR' },
  GBP: { en: 'GBP', fr: 'GBP' },
}

export const LEGAL_FORM_LABEL: Record<FinanceLegalForm, Bi> = {
  corporation: { en: 'Corporation', fr: 'Société' },
  partnership: { en: 'Partnership', fr: 'Société en nom collectif' },
  sole_proprietor: { en: 'Sole proprietor', fr: 'Entreprise individuelle' },
  nonprofit: { en: 'Non-profit', fr: 'Organisme sans but lucratif' },
}

export const INVOICE_STATUS_LABEL: Record<FinanceInvoiceStatus, Bi> = {
  draft: { en: 'Draft', fr: 'Brouillon' },
  issued: { en: 'Issued', fr: 'Émise' },
  partial: { en: 'Partial', fr: 'Partiel' },
  paid: { en: 'Paid', fr: 'Payée' },
  overdue: { en: 'Overdue', fr: 'En retard' },
  disputed: { en: 'Disputed', fr: 'Contestée' },
  written_off: { en: 'Written off', fr: 'Mise en perte' },
  cancelled: { en: 'Cancelled', fr: 'Annulée' },
}

export const REQUEST_STATUS_LABEL: Record<FinanceRequestStatus, Bi> = {
  draft: { en: 'Draft', fr: 'Brouillon' },
  submitted: { en: 'Submitted', fr: 'Soumise' },
  approved: { en: 'Approved', fr: 'Approuvée' },
  rejected: { en: 'Rejected', fr: 'Rejetée' },
  committed: { en: 'Committed', fr: 'Engagée' },
  cancelled: { en: 'Cancelled', fr: 'Annulée' },
}

export const BANK_MATCH_LABEL: Record<FinanceBankMatchStatus, Bi> = {
  unmatched: { en: 'Unmatched', fr: 'Non rapproché' },
  suggested: { en: 'Suggested', fr: 'Suggéré' },
  matched: { en: 'Matched', fr: 'Rapproché' },
  exception: { en: 'Exception', fr: 'Exception' },
}

export const JOURNAL_STATUS_LABEL: Record<FinanceJournalStatus, Bi> = {
  draft: { en: 'Draft', fr: 'Brouillon' },
  posted: { en: 'Posted', fr: 'Comptabilisé' },
  reversed: { en: 'Reversed', fr: 'Inversé' },
}

export const PAY_RUN_STATUS_LABEL: Record<FinancePayRunStatus, Bi> = {
  inputs_open: { en: 'Inputs open', fr: 'Intrants ouverts' },
  inputs_approved: { en: 'Inputs approved', fr: 'Intrants approuvés' },
  submitted: { en: 'Submitted', fr: 'Soumis' },
  results_imported: { en: 'Results imported', fr: 'Résultats importés' },
  reconciled: { en: 'Reconciled', fr: 'Rapproché' },
  exception: { en: 'Exception', fr: 'Exception' },
}

export const BUDGET_STATUS_LABEL: Record<FinanceBudgetStatus, Bi> = {
  draft: { en: 'Draft', fr: 'Brouillon' },
  approved: { en: 'Approved', fr: 'Approuvé' },
  revised: { en: 'Revised', fr: 'Révisé' },
  archived: { en: 'Archived', fr: 'Archivé' },
}

export const SCENARIO_TYPE_LABEL: Record<FinanceScenarioType, Bi> = {
  baseline: { en: 'Baseline', fr: 'Référence' },
  hiring: { en: 'Hiring', fr: 'Embauche' },
  capital_purchase: { en: 'Capital purchase', fr: 'Achat d’immobilisations' },
  financing: { en: 'Financing', fr: 'Financement' },
  operating_change: { en: 'Operating change', fr: 'Changement d’exploitation' },
  tax: { en: 'Tax', fr: 'Fiscal' },
}

export const RESERVE_TYPE_LABEL: Record<FinanceReserveType, Bi> = {
  payroll: { en: 'Payroll', fr: 'Paie' },
  tax: { en: 'Tax', fr: 'Impôt' },
  emergency_operating: { en: 'Emergency operating', fr: 'Exploitation d’urgence' },
  capital_purchase: { en: 'Capital purchase', fr: 'Achat d’immobilisations' },
  other: { en: 'Other', fr: 'Autre' },
}

export const TAX_TYPE_LABEL: Record<FinanceTaxType, Bi> = {
  income_tax: { en: 'Income tax', fr: 'Impôt sur le revenu' },
  gst_hst: { en: 'GST/HST', fr: 'TPS/TVH' },
  qst: { en: 'QST', fr: 'TVQ' },
  payroll_source_deductions: { en: 'Payroll source deductions', fr: 'Retenues à la source sur la paie' },
  employer_contributions: { en: 'Employer contributions', fr: 'Cotisations patronales' },
  other: { en: 'Other', fr: 'Autre' },
}

export const OBLIGATION_STATUS_LABEL: Record<FinanceObligationStatus, Bi> = {
  planned: { en: 'Planned', fr: 'Planifiée' },
  in_preparation: { en: 'In preparation', fr: 'En préparation' },
  reviewed: { en: 'Reviewed', fr: 'Révisée' },
  filed: { en: 'Filed', fr: 'Produite' },
  paid: { en: 'Paid', fr: 'Payée' },
  confirmed: { en: 'Confirmed', fr: 'Confirmée' },
  overdue: { en: 'Overdue', fr: 'En retard' },
  withdrawn: { en: 'Withdrawn', fr: 'Retirée' },
}

export const EXTERNAL_ACTION_STATUS_LABEL: Record<FinanceExternalActionStatus, Bi> = {
  internal_approval: { en: 'Internal approval', fr: 'Approbation interne' },
  export_prepared: { en: 'Export prepared', fr: 'Export préparé' },
  provider_accepted: { en: 'Provider accepted', fr: 'Fournisseur a accepté' },
  settled: { en: 'Settled', fr: 'Réglé' },
  filing_accepted: { en: 'Filing accepted', fr: 'Dépôt accepté' },
  failed: { en: 'Failed', fr: 'Échec' },
  returned: { en: 'Returned', fr: 'Retourné' },
  unknown: { en: 'Unknown', fr: 'Inconnu' },
}

export { M as FINANCE_MESSAGES }
