import { defineMessages } from '../../core'

/* Transactions screen — bank-item triage, matching, and reconciliations. */
export const financeTransactions = defineMessages({
  finance_transactions_title: { en: 'Transactions', fr: 'Transactions' },
  finance_transactions_bank_items: { en: 'Bank items', fr: 'Écritures bancaires' },
  finance_transactions_reconciliations: { en: 'Reconciliations', fr: 'Rapprochements' },
  finance_transactions_unmatched: { en: 'Unmatched items', fr: 'Écritures non rapprochées' },
  finance_transactions_no_bank_items: { en: 'No bank items.', fr: 'Aucune écriture bancaire.' },
  finance_transactions_match_status: { en: 'Match status', fr: 'Statut de rapprochement' },
  finance_transactions_opening: { en: 'Opening balance', fr: 'Solde d’ouverture' },
  finance_transactions_closing: { en: 'Closing balance', fr: 'Solde de clôture' },
  finance_transactions_difference: { en: 'Difference', fr: 'Écart' },
  finance_transactions_reviewer: { en: 'Reviewer', fr: 'Réviseur' },

  /* Bank item matching */
  finance_bank_accept_suggested: { en: 'Accept match', fr: 'Accepter la correspondance' },
  finance_bank_mark_matched: { en: 'Mark matched', fr: 'Marquer rapproché' },
  finance_bank_mark_exception: { en: 'Mark exception', fr: 'Marquer comme exception' },
  finance_bank_matched_to: { en: 'Matched to', fr: 'Rapproché avec' },
  finance_bank_reopen: { en: 'Reopen', fr: 'Rouvrir' },

  /* Reconciliation actions */
  finance_reconciliation_mark_reconciled: { en: 'Mark reconciled', fr: 'Marquer rapproché' },
  finance_reconciliation_mark_exception: { en: 'Mark exception', fr: 'Marquer comme exception' },

  /* Row triage and selection */
  finance_transactions_ai_suggestion: { en: 'AI suggestion:', fr: "Suggestion de l'IA :" },
  finance_transactions_note: { en: 'Note', fr: 'Note' },
  finance_transactions_change_account: { en: 'Change account', fr: 'Changer de compte' },
  finance_transactions_categorize: { en: 'Categorize', fr: 'Catégoriser' },
  finance_transactions_accept_all: {
    en: 'Accept all suggested',
    fr: 'Accepter toutes les suggestions',
  },
  finance_transactions_no_description: { en: '(no description)', fr: '(sans description)' },
  finance_transactions_save_changes: { en: 'Save', fr: 'Enregistrer' },
  finance_transactions_accept_suggestion: { en: 'Accept', fr: 'Accepter' },
  finance_transactions_select_all: { en: 'Select all', fr: 'Tout sélectionner' },
  finance_transactions_selected_count: {
    en: '{count} selected',
    fr: '{count} sélectionné(s)',
  },
  finance_transactions_accept_selected: {
    en: 'Accept suggested',
    fr: 'Accepter les suggestions',
  },
  finance_transactions_clear_selection: { en: 'Clear', fr: 'Effacer' },
})
