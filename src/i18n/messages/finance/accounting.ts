import { defineMessages } from '../../core'

/* Accounting — books, chart of accounts, journals, period close, audit trail. */
export const financeAccounting = defineMessages({
  finance_accounting_title: { en: 'Accounting', fr: 'Comptabilité' },
  finance_accounting_books: { en: 'Books', fr: 'Livres' },
  finance_accounting_ledger: { en: 'Chart of accounts', fr: 'Plan comptable' },
  finance_accounting_journals: { en: 'Journals', fr: 'Journaux' },
  finance_accounting_no_journals: { en: 'No journals.', fr: 'Aucun journal.' },
  finance_accounting_add_journal: { en: 'Add journal', fr: 'Ajouter un journal' },
  finance_accounting_close: { en: 'Period close', fr: 'Clôture de période' },
  finance_accounting_balanced: { en: 'Balanced', fr: 'Équilibré' },
  finance_accounting_unbalanced: { en: 'Unbalanced', fr: 'Déséquilibré' },
  finance_accounting_unbalanced_warning: {
    en: 'Unbalanced journals cannot become posted actuals.',
    fr: 'Les journaux déséquilibrés ne peuvent pas devenir des écritures réelles.',
  },
  finance_accounting_code: { en: 'Code', fr: 'Code' },
  finance_accounting_account_type: { en: 'Type', fr: 'Type' },
  finance_accounting_debit: { en: 'Debit', fr: 'Débit' },
  finance_accounting_credit: { en: 'Credit', fr: 'Crédit' },
  finance_accounting_authoritative_source: { en: 'Authoritative source', fr: 'Source faisant foi' },
  finance_accounting_last_synced: { en: 'Last synced', fr: 'Dernière synchronisation' },
  finance_accounting_sensitive: { en: 'Sensitive', fr: 'Sensible' },

  /* Journal actions */
  finance_journal_post: { en: 'Post', fr: 'Comptabiliser' },
  finance_journal_reverse: { en: 'Reverse', fr: 'Extourner' },
  finance_journal_unbalanced: {
    en: 'Unbalanced — cannot post',
    fr: 'Non équilibré — comptabilisation impossible',
  },

  /* Create journal form */
  finance_journal_create: { en: 'New journal entry', fr: 'Nouvelle écriture' },
  finance_journal_number: { en: 'Journal number', fr: 'Numéro de journal' },
  finance_journal_date: { en: 'Date', fr: 'Date' },
  finance_journal_description: { en: 'Description', fr: 'Description' },
  finance_journal_book: { en: 'Book', fr: 'Livre' },
  finance_journal_source: { en: 'Source', fr: 'Source' },
  finance_journal_lines: { en: 'Lines', fr: 'Lignes' },
  finance_journal_add_line: { en: 'Add line', fr: 'Ajouter une ligne' },
  finance_journal_account: { en: 'Account', fr: 'Compte' },
  finance_journal_debit: { en: 'Debit', fr: 'Débit' },
  finance_journal_credit: { en: 'Credit', fr: 'Crédit' },

  /* Close period actions */
  finance_close_period_start_review: { en: 'Start review', fr: 'Commencer la révision' },
  finance_close_period_approve: { en: 'Approve', fr: 'Approuver' },
  finance_close_period_lock: { en: 'Lock', fr: 'Verrouiller' },
  finance_close_period_reopen: { en: 'Reopen', fr: 'Rouvrir' },

  /* Audit trail */
  finance_audit_title: { en: 'Audit trail', fr: "Piste d'audit" },
  finance_audit_no_events: {
    en: 'No audit events recorded.',
    fr: "Aucun événement d'audit enregistré.",
  },
  finance_audit_actor: { en: 'Actor', fr: 'Acteur' },
  finance_audit_action: { en: 'Action', fr: 'Action' },
  finance_audit_record: { en: 'Record', fr: 'Dossier' },
  finance_audit_timestamp: { en: 'Timestamp', fr: 'Horodatage' },

  /* Account types (ledger account form) */
  finance_account_type_asset: { en: 'Asset', fr: 'Actif' },
  finance_account_type_liability: { en: 'Liability', fr: 'Passif' },
  finance_account_type_equity: { en: 'Equity', fr: 'Capitaux propres' },
  finance_account_type_revenue: { en: 'Revenue', fr: 'Revenu' },
  finance_account_type_expense: { en: 'Expense', fr: 'Charge' },
  finance_account_type_contra: { en: 'Contra', fr: 'Contrepartie' },
})
