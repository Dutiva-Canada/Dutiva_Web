import { defineMessages } from '../core'

/**
 * Finance workspace chrome. These keys are workspace-scoped and used by
 * the new `/app/finance` feature area only.
 *
 * [FR self-authored — not from a design handoff; reviewed against the blueprint.]
 */
export const financeMessages = defineMessages({
  /* Shell */
  finance_title: { en: 'Finance', fr: 'Finance' },
  finance_subtitle: {
    en: 'Track what you own and owe, what must be paid or filed, and what you can afford.',
    fr: 'Suivez ce que vous possédez et devez, ce qui doit être payé ou produit, et ce que vous pouvez vous permettre.',
  },
  finance_disclaimer: {
    en: 'Dutiva coordinates financial records and review; it does not move money, file returns, or provide tax advice.',
    fr: 'Dutiva coordonne les dossiers financiers et les révisions; il ne transfère pas de fonds, ne produit pas de déclarations et ne fournit pas de conseils fiscaux.',
  },
  finance_demo_read_only: {
    en: 'Demo mode — data is read-only sample content.',
    fr: 'Mode démo — les données sont du contenu d’exemple en lecture seule.',
  },
  finance_production_local_only: {
    en: 'Production mode — data is saved to this browser only. Supabase is not configured.',
    fr: 'Mode production — les données sont enregistrées dans ce navigateur uniquement. Supabase n’est pas configuré.',
  },
  finance_production_workspace: {
    en: 'Production mode — data is saved to your organization workspace.',
    fr: 'Mode production — les données sont enregistrées dans l’espace de travail de votre organisation.',
  },

  /* Navigation tabs */
  finance_tab_overview: { en: 'Overview', fr: 'Vue d’ensemble' },
  finance_tab_transactions: { en: 'Transactions', fr: 'Transactions' },
  finance_tab_sales: { en: 'Sales & collections', fr: 'Ventes et recouvrement' },
  finance_tab_purchases: { en: 'Purchases & expenses', fr: 'Achats et dépenses' },
  finance_tab_payroll: { en: 'Payroll', fr: 'Paie' },
  finance_tab_accounting: { en: 'Accounting', fr: 'Comptabilité' },
  finance_tab_plans: { en: 'Plans & budgets', fr: 'Plans et budgets' },
  finance_tab_treasury: { en: 'Treasury', fr: 'Trésorerie' },
  finance_tab_tax: { en: 'Tax', fr: 'Fiscalité' },
  finance_tab_evidence: { en: 'Evidence', fr: 'Preuves' },

  /* Common actions */
  finance_add: { en: 'Add', fr: 'Ajouter' },
  finance_save: { en: 'Save', fr: 'Enregistrer' },
  finance_cancel: { en: 'Cancel', fr: 'Annuler' },
  finance_edit: { en: 'Edit', fr: 'Modifier' },
  finance_remove: { en: 'Remove', fr: 'Retirer' },
  finance_create: { en: 'Create', fr: 'Créer' },
  finance_close: { en: 'Close', fr: 'Fermer' },
  finance_none: { en: 'None', fr: 'Aucun' },
  finance_search: { en: 'Search', fr: 'Rechercher' },
  finance_amount: { en: 'Amount', fr: 'Montant' },
  finance_currency: { en: 'Currency', fr: 'Devise' },
  finance_due_date: { en: 'Due date', fr: 'Échéance' },
  finance_owner: { en: 'Owner', fr: 'Responsable' },
  finance_status: { en: 'Status', fr: 'Statut' },
  finance_entity: { en: 'Entity', fr: 'Entité' },
  finance_period: { en: 'Period', fr: 'Période' },
  finance_source: { en: 'Source', fr: 'Source' },

  /* Overview */
  finance_overview_cash_position: { en: 'Cash position', fr: 'Position de trésorerie' },
  finance_overview_upcoming: { en: 'Upcoming obligations', fr: 'Obligations à venir' },
  finance_overview_approvals: { en: 'Approvals queue', fr: 'File d’approbations' },
  finance_overview_exceptions: { en: 'Exceptions', fr: 'Exceptions' },
  finance_overview_budget_headroom: { en: 'Budget headroom', fr: 'Marge budgétaire' },
  finance_overview_no_upcoming: { en: 'No upcoming obligations.', fr: 'Aucune obligation à venir.' },
  finance_overview_no_exceptions: { en: 'No open exceptions.', fr: 'Aucune exception ouverte.' },
  finance_overview_no_approvals: { en: 'No items awaiting approval.', fr: 'Aucun élément en attente d’approbation.' },
  finance_overview_data_freshness: { en: 'Data freshness', fr: 'Fraîcheur des données' },
  finance_overview_all_areas: { en: 'Open a tab above to drill into a workspace area.', fr: 'Ouvrez un onglet ci-dessus pour explorer un secteur de l’espace de travail.' },

  /* Transactions */
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

  /* Sales & collections */
  finance_sales_title: { en: 'Sales & collections', fr: 'Ventes et recouvrement' },
  finance_sales_invoices: { en: 'Invoices', fr: 'Factures' },
  finance_sales_no_invoices: { en: 'No invoices.', fr: 'Aucune facture.' },
  finance_sales_add_invoice: { en: 'Add invoice', fr: 'Ajouter une facture' },
  finance_sales_number: { en: 'Number', fr: 'Numéro' },
  finance_sales_customer: { en: 'Customer', fr: 'Client' },
  finance_sales_issue_date: { en: 'Issue date', fr: 'Date d’émission' },
  finance_sales_total: { en: 'Total', fr: 'Total' },
  finance_sales_paid: { en: 'Paid', fr: 'Payé' },
  finance_sales_outstanding: { en: 'Outstanding', fr: 'Solde dû' },
  finance_sales_credits: { en: 'Credits', fr: 'Avoirs' },

  /* Purchases & expenses */
  finance_purchases_title: { en: 'Purchases & expenses', fr: 'Achats et dépenses' },
  finance_purchases_requests: { en: 'Spend requests', fr: 'Demandes de dépense' },
  finance_purchases_no_requests: { en: 'No spend requests.', fr: 'Aucune demande de dépense.' },
  finance_purchases_add_request: { en: 'Add spend request', fr: 'Ajouter une demande de dépense' },
  finance_purchases_requester: { en: 'Requester', fr: 'Demandeur' },
  finance_purchases_purpose: { en: 'Purpose', fr: 'Objet' },
  finance_purchases_approver: { en: 'Approver', fr: 'Approbateur' },
  finance_purchases_pos: { en: 'Purchase orders', fr: 'Bons de commande' },
  finance_purchases_expenses: { en: 'Expenses', fr: 'Dépenses' },
  finance_purchases_subscriptions: { en: 'Subscriptions', fr: 'Abonnements' },
  finance_purchases_mark_submitted: { en: 'Submit', fr: 'Soumettre' },
  finance_purchases_mark_approved: { en: 'Approve', fr: 'Approuver' },
  finance_purchases_mark_rejected: { en: 'Reject', fr: 'Rejeter' },
  finance_purchases_mark_committed: { en: 'Mark committed', fr: 'Marquer engagé' },
  finance_purchases_mark_cancelled: { en: 'Cancel', fr: 'Annuler' },

  /* Payroll */
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
  finance_payroll_restricted: { en: 'Payroll details are restricted.', fr: 'Les détails de paie sont restreints.' },
  finance_payroll_admin_only: {
    en: 'Payroll records are visible to admins only. Ask a workspace admin to grant access or review pay runs.',
    fr: 'Les dossiers de paie sont visibles par les administrateurs uniquement. Demandez à un administrateur de l\'espace d\'accorder l\'accès ou de réviser les traitements.',
  },

  /* Accounting */
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

  /* Plans & budgets */
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

  /* Treasury */
  finance_treasury_title: { en: 'Treasury', fr: 'Trésorerie' },
  finance_treasury_accounts: { en: 'Bank accounts', fr: 'Comptes bancaires' },
  finance_treasury_reserves: { en: 'Reserve goals', fr: 'Objectifs de réserve' },
  finance_treasury_holdings: { en: 'Corporate holdings', fr: 'Placements d’entreprise' },
  finance_treasury_debt: { en: 'Debt & financing', fr: 'Dette et financement' },
  finance_treasury_no_reserves: { en: 'No reserve goals.', fr: 'Aucun objectif de réserve.' },
  finance_treasury_no_holdings: { en: 'No holdings.', fr: 'Aucun placement.' },
  finance_treasury_no_debt: { en: 'No debt records.', fr: 'Aucun dossier de dette.' },
  finance_treasury_target: { en: 'Target', fr: 'Cible' },
  finance_treasury_current: { en: 'Current', fr: 'Actuel' },
  finance_treasury_market_value: { en: 'Market value', fr: 'Valeur au marché' },
  finance_treasury_cost_basis: { en: 'Cost basis', fr: 'Coût de base' },
  finance_treasury_as_of: { en: 'As of', fr: 'Au' },
  finance_treasury_stale: { en: 'Stale valuation', fr: 'Évaluation périmée' },
  finance_treasury_maturity: { en: 'Maturity', fr: 'Échéance' },
  finance_treasury_interest_rate: { en: 'Interest rate', fr: 'Taux d’intérêt' },
  finance_treasury_balance: { en: 'Balance', fr: 'Solde' },
  finance_treasury_restricted: { en: 'Restricted', fr: 'Restreint' },
  finance_treasury_earmarked: { en: 'Earmarked', fr: 'Affecté' },

  /* Tax */
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

  /* External actions */
  finance_external_title: { en: 'External actions', fr: 'Actions externes' },
  finance_external_no_actions: { en: 'No external actions.', fr: 'Aucune action externe.' },
  finance_external_record_type: { en: 'Record type', fr: 'Type de dossier' },
  finance_external_provider_ref: { en: 'Provider reference', fr: 'Référence fournisseur' },
  finance_external_confirmed_at: { en: 'Confirmed at', fr: 'Confirmé le' },
  finance_external_idempotency_key: { en: 'Idempotency key', fr: 'Clé d’idempotence' },

  /* Deadline states */
  finance_overdue: { en: 'Overdue', fr: 'En retard' },
  finance_due_soon: { en: 'Due soon', fr: 'Bientôt à échéance' },

  /* Empty filtered state */
  finance_no_results: { en: 'No results match the current filter.', fr: 'Aucun résultat ne correspond au filtre actuel.' },

  /* Status filter */
  finance_filter_all: { en: 'All', fr: 'Tous' },

  /* Lifecycle messages */
  finance_invalid_transition: { en: 'This status transition is not allowed.', fr: 'Cette transition de statut n’est pas autorisée.' },
  finance_not_found: { en: 'Record not found.', fr: 'Dossier introuvable.' },

  /* Money representation */
  finance_total_currency: { en: 'Total', fr: 'Total' },

  /* Evidence & receipts */
  finance_evidence_title: { en: 'Evidence & receipts', fr: 'Preuves et reçus' },
  finance_evidence_upload: { en: 'Upload receipt', fr: 'Téléverser un reçu' },
  finance_evidence_no_receipts: { en: 'No receipts uploaded.', fr: 'Aucun reçu téléversé.' },
  finance_evidence_reviewed: { en: 'Reviewed', fr: 'Révisé' },
  finance_evidence_pending: { en: 'Pending review', fr: 'En attente de révision' },
  finance_evidence_mark_reviewed: { en: 'Mark reviewed', fr: 'Marquer révisé' },
  finance_evidence_download: { en: 'Download', fr: 'Télécharger' },
  finance_evidence_uploaded_at: { en: 'Uploaded', fr: 'Téléversé' },
  finance_evidence_upload_error: {
    en: 'Could not upload the file. Check your connection and try again.',
    fr: 'Impossible de téléverser le fichier. Vérifiez votre connexion et réessayez.',
  },
  finance_evidence_select_file: { en: 'Choose a file', fr: 'Choisir un fichier' },
  finance_evidence_checklist: { en: 'Evidence checklist', fr: 'Liste de vérification des preuves' },
  finance_evidence_checklist_hint: {
    en: 'Track whether source documents are attached for each record.',
    fr: 'Suivez si les documents source sont joints pour chaque dossier.',
  },
  finance_evidence_attached: { en: 'Attached', fr: 'Joint' },
  finance_evidence_missing: { en: 'Missing', fr: 'Manquant' },

  /* Closed period */
  finance_period_locked: {
    en: 'This period is locked. Ordinary edits are not allowed.',
    fr: 'Cette période est verrouillée. Les modifications ordinaires ne sont pas autorisées.',
  },

  /* Invoice actions */
  finance_invoice_issue: { en: 'Issue', fr: 'Émettre' },
  finance_invoice_mark_paid: { en: 'Mark paid', fr: 'Marquer payée' },
  finance_invoice_mark_partial: { en: 'Record partial payment', fr: 'Enregistrer un paiement partiel' },
  finance_invoice_dispute: { en: 'Dispute', fr: 'Contester' },
  finance_invoice_write_off: { en: 'Write off', fr: 'Passer en perte' },
  finance_invoice_cancel: { en: 'Cancel', fr: 'Annuler' },
  finance_invoice_mark_overdue: { en: 'Mark overdue', fr: 'Marquer en retard' },

  /* Bill actions */
  finance_bills_title: { en: 'Bills', fr: 'Factures fournisseurs' },
  finance_bills_no_bills: { en: 'No bills.', fr: 'Aucune facture fournisseur.' },
  finance_bill_post: { en: 'Post', fr: 'Afficher' },
  finance_bill_mark_paid: { en: 'Mark paid', fr: 'Marquer payée' },
  finance_bill_mark_partial: { en: 'Record partial payment', fr: 'Enregistrer un paiement partiel' },
  finance_bill_dispute: { en: 'Dispute', fr: 'Contester' },
  finance_bill_cancel: { en: 'Cancel', fr: 'Annuler' },
  finance_bill_mark_overdue: { en: 'Mark overdue', fr: 'Marquer en retard' },

  /* Journal actions */
  finance_journal_post: { en: 'Post', fr: 'Comptabiliser' },
  finance_journal_reverse: { en: 'Reverse', fr: 'Extourner' },
  finance_journal_unbalanced: { en: 'Unbalanced — cannot post', fr: 'Non équilibré — comptabilisation impossible' },

  /* Bank item matching */
  finance_bank_accept_suggested: { en: 'Accept match', fr: 'Accepter la correspondance' },
  finance_bank_mark_matched: { en: 'Mark matched', fr: 'Marquer rapproché' },
  finance_bank_mark_exception: { en: 'Mark exception', fr: 'Marquer comme exception' },
  finance_bank_matched_to: { en: 'Matched to', fr: 'Rapproché avec' },

  /* Reconciliation actions */
  finance_reconciliation_mark_reconciled: { en: 'Mark reconciled', fr: 'Marquer rapproché' },
  finance_reconciliation_mark_exception: { en: 'Mark exception', fr: 'Marquer comme exception' },

  /* Close period actions */
  finance_close_period_start_review: { en: 'Start review', fr: 'Commencer la révision' },
  finance_close_period_approve: { en: 'Approve', fr: 'Approuver' },
  finance_close_period_lock: { en: 'Lock', fr: 'Verrouiller' },
  finance_close_period_reopen: { en: 'Reopen', fr: 'Rouvrir' },

  /* Expense actions */
  finance_expense_approve: { en: 'Approve', fr: 'Approuver' },
  finance_expense_reject: { en: 'Reject', fr: 'Rejeter' },
  finance_expense_reimburse: { en: 'Mark reimbursed', fr: 'Marquer remboursée' },
  finance_expense_submit: { en: 'Submit', fr: 'Soumettre' },

  /* Approval actions */
  finance_approve: { en: 'Approve', fr: 'Approuver' },
  finance_reject: { en: 'Reject', fr: 'Rejeter' },

  /* External actions */
  finance_external_prepare_export: { en: 'Prepare export', fr: 'Préparer l\'export' },
  finance_external_mark_accepted: { en: 'Mark accepted', fr: 'Marquer accepté' },
  finance_external_mark_settled: { en: 'Mark settled', fr: 'Marquer réglé' },
  finance_external_mark_failed: { en: 'Mark failed', fr: 'Marquer échoué' },

  /* Audit trail */
  finance_audit_title: { en: 'Audit trail', fr: 'Piste d\'audit' },
  finance_audit_no_events: { en: 'No audit events recorded.', fr: 'Aucun événement d\'audit enregistré.' },
  finance_audit_actor: { en: 'Actor', fr: 'Acteur' },
  finance_audit_action: { en: 'Action', fr: 'Action' },
  finance_audit_record: { en: 'Record', fr: 'Dossier' },
  finance_audit_timestamp: { en: 'Timestamp', fr: 'Horodatage' },

  /* External actions section in Tax */
  finance_tax_external_actions: { en: 'External actions', fr: 'Actions externes' },

  /* Create invoice form */
  finance_invoice_create: { en: 'New invoice', fr: 'Nouvelle facture' },
  finance_invoice_number: { en: 'Invoice number', fr: 'Numéro de facture' },
  finance_invoice_customer: { en: 'Customer', fr: 'Client' },
  finance_invoice_issue_date: { en: 'Issue date', fr: 'Date d\'émission' },
  finance_invoice_due_date: { en: 'Due date', fr: 'Date d\'échéance' },
  finance_invoice_subtotal: { en: 'Subtotal', fr: 'Sous-total' },
  finance_invoice_tax: { en: 'Tax', fr: 'Taxe' },
  finance_invoice_total: { en: 'Total', fr: 'Total' },
  finance_invoice_entity: { en: 'Entity', fr: 'Entité' },

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

  /* Create spend request form */
  finance_spend_create: { en: 'New spend request', fr: 'Nouvelle demande de dépense' },
  finance_spend_purpose: { en: 'Purpose', fr: 'Objet' },
  finance_spend_requester: { en: 'Requester', fr: 'Demandeur' },
  finance_spend_supplier: { en: 'Supplier', fr: 'Fournisseur' },
  finance_spend_amount: { en: 'Amount', fr: 'Montant' },

  /* Tax scenario actions */
  finance_tax_scenario_review: { en: 'Mark reviewed', fr: 'Marquer révisé' },
  finance_tax_scenario_accept: { en: 'Accept', fr: 'Accepter' },
  finance_tax_scenario_mark_stale: { en: 'Mark stale', fr: 'Marquer obsolète' },

  /* Payroll liability settlement */
  finance_payroll_settle_liability: { en: 'Mark settled', fr: 'Marquer réglé' },

  /* Treasury — reserve goal create/update */
  finance_reserve_create: { en: 'New reserve goal', fr: 'Nouvel objectif de réserve' },
  finance_reserve_type: { en: 'Type', fr: 'Type' },
  finance_reserve_label: { en: 'Label', fr: 'Libellé' },
  finance_reserve_target: { en: 'Target amount', fr: 'Montant cible' },
  finance_reserve_current: { en: 'Current amount', fr: 'Montant actuel' },
  finance_reserve_owner: { en: 'Owner', fr: 'Responsable' },
  finance_reserve_due_date: { en: 'Due date', fr: 'Échéance' },
  finance_reserve_update_progress: { en: 'Update progress', fr: 'Mettre à jour la progression' },
  finance_reserve_mark_stale: { en: 'Mark stale', fr: 'Marquer obsolète' },

  /* Treasury — holdings */
  finance_holding_mark_stale: { en: 'Mark stale', fr: 'Marquer obsolète' },
  finance_holding_refresh: { en: 'Mark current', fr: 'Marquer à jour' },

  /* Treasury — debt */
  finance_debt_mark_paid_off: { en: 'Mark paid off', fr: 'Marquer remboursé' },

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

  /* Evidence — receipt linking and download */
  finance_evidence_link_bill: { en: 'Link to bill', fr: 'Lier à une facture' },
  finance_evidence_link_expense: { en: 'Link to expense', fr: 'Lier à une dépense' },
  finance_evidence_link_none: { en: 'No link', fr: 'Aucun lien' },
  finance_evidence_download_error: { en: 'Could not download file', fr: 'Téléchargement impossible' },

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

  /* Tax create forms */
  finance_tax_create_obligation: { en: 'New tax obligation', fr: 'Nouvelle obligation fiscale' },
  finance_tax_period: { en: 'Period', fr: 'Période' },
  finance_tax_due_date: { en: 'Filing due date', fr: 'Échéance de production' },
  finance_tax_create_scenario: { en: 'New tax scenario', fr: 'Nouveau scénario fiscal' },
  finance_tax_scenario_label: { en: 'Label', fr: 'Libellé' },
  finance_tax_scenario_baseline: { en: 'Baseline', fr: 'Référence' },
  finance_tax_scenario_decision: { en: 'Proposed decision', fr: 'Décision proposée' },
  finance_tax_scenario_profit: { en: 'Projected profit', fr: 'Bénéfice projeté' },
  finance_tax_scenario_taxable_income: { en: 'Projected taxable income', fr: 'Revenu imposable projeté' },
  finance_tax_scenario_projected_tax: { en: 'Projected tax', fr: 'Impôt projeté' },
  finance_tax_scenario_projected_cashflow: { en: 'Projected cash flow', fr: 'Flux de trésorerie projeté' },
  finance_tax_scenario_assumptions: { en: 'Assumptions', fr: 'Hypothèses' },
  finance_tax_scenario_law_version: { en: 'Law version', fr: 'Version de la loi' },
  finance_tax_scenario_enacted: { en: 'Enacted', fr: 'Promulguée' },
  finance_tax_scenario_proposed: { en: 'Proposed', fr: 'Proposée' },

  /* Payroll external actions */
  finance_payroll_external_actions: { en: 'Payroll submissions', fr: 'Soumissions de paie' },
  finance_payroll_no_external_actions: { en: 'No payroll submissions tracked', fr: 'Aucune soumission de paie suivie' },

  /* Overview KPIs */
  finance_overview_kpis: { en: 'Key metrics', fr: 'Indicateurs clés' },
  finance_overview_ar: { en: 'Outstanding receivables', fr: 'Créances en suspens' },
  finance_overview_ap: { en: 'Outstanding payables', fr: 'Dettes en suspens' },
  finance_overview_burn_rate: { en: 'Monthly burn', fr: 'Brûlage mensuel' },
  finance_overview_cash_total: { en: 'Cash on hand', fr: 'Trésorerie disponible' },

  /* Master data */
  finance_bank_account_create: { en: 'New bank account', fr: 'Nouveau compte bancaire' },
  finance_bank_account_label: { en: 'Account label', fr: 'Libellé du compte' },
  finance_bank_account_last4: { en: 'Last 4 digits', fr: '4 derniers chiffres' },
  finance_bank_account_restricted: { en: 'Restricted', fr: 'Restreint' },
  finance_bank_account_earmarked: { en: 'Earmarked amount', fr: 'Montant réservé' },
  finance_bank_account_maturity: { en: 'Maturity date', fr: 'Date d’échéance' },
  finance_ledger_account_create: { en: 'New ledger account', fr: 'Nouveau compte du grand livre' },
  finance_ledger_account_code: { en: 'Code', fr: 'Code' },
  finance_ledger_account_name: { en: 'Account name', fr: 'Nom du compte' },
  finance_ledger_account_type: { en: 'Account type', fr: 'Type de compte' },
  finance_ledger_account_sensitive: { en: 'Sensitive', fr: 'Sensible' },
  finance_party_create: { en: 'New party', fr: 'Nouvelle partie' },
  finance_party_name: { en: 'Name', fr: 'Nom' },
  finance_party_type: { en: 'Party type', fr: 'Type de partie' },
  finance_party_banking_on_file: { en: 'Banking details on file', fr: 'Coordonnées bancaires au dossier' },

  /* Entities */
  finance_tab_entities: { en: 'Entities', fr: 'Entités' },
  finance_entity_title: { en: 'Legal entities', fr: 'Entités juridiques' },
  finance_entity_create: { en: 'New legal entity', fr: 'Nouvelle entité juridique' },
  finance_entity_legal_name: { en: 'Legal name', fr: 'Dénomination légale' },
  finance_entity_legal_form: { en: 'Legal form', fr: 'Forme juridique' },
  finance_entity_legal_form_corporation: { en: 'Corporation', fr: 'Société par actions' },
  finance_entity_legal_form_partnership: { en: 'Partnership', fr: 'Société en nom collectif' },
  finance_entity_legal_form_sole_proprietor: { en: 'Sole proprietor', fr: 'Travailleur autonome' },
  finance_entity_legal_form_nonprofit: { en: 'Non-profit', fr: 'Organisme sans but lucratif' },
  finance_entity_fiscal_year_start: { en: 'Fiscal year start', fr: 'Début d’exercice' },
  finance_entity_functional_currency: { en: 'Functional currency', fr: 'Devise fonctionnelle' },
  finance_entity_jurisdictions: { en: 'Jurisdictions', fr: 'Territoires de compétence' },
  finance_entity_accounting_source_id: { en: 'Accounting source ID', fr: 'ID source comptable' },
  finance_entity_payroll_source_id: { en: 'Payroll source ID', fr: 'ID source paie' },
  finance_entity_active: { en: 'Active', fr: 'Actif' },
  finance_entity_empty: { en: 'No legal entities yet. Create one to use bank accounts, invoices, and other finance records.', fr: 'Aucune entité juridique pour l’instant. Créez-en une pour utiliser les comptes bancaires, factures et autres enregistrements financiers.' },
  finance_entity_select_prompt: { en: 'Create a legal entity in the Entities tab first.', fr: 'Créez d’abord une entité juridique dans l’onglet Entités.' },
  finance_entity_save_failed: { en: 'Couldn’t save the legal entity. Try again.', fr: 'Impossible d’enregistrer l’entité juridique. Réessayez.' },
  finance_entity_edit: { en: 'Edit', fr: 'Modifier' },
  finance_entity_remove: { en: 'Delete', fr: 'Supprimer' },
  finance_entity_remove_confirm: { en: 'Delete this legal entity?', fr: 'Supprimer cette entité juridique?' },

  finance_subscription_create: { en: 'New subscription', fr: 'Nouvel abonnement' },
  finance_subscription_label: { en: 'Label', fr: 'Libellé' },
  finance_subscription_supplier: { en: 'Supplier', fr: 'Fournisseur' },
  finance_subscription_cost: { en: 'Cost', fr: 'Coût' },
  finance_subscription_renewal_term: { en: 'Renewal term', fr: 'Terme de renouvellement' },
  finance_subscription_next_renewal: { en: 'Next renewal date', fr: 'Prochaine date de renouvellement' },
  finance_subscription_notice_date: { en: 'Notice date', fr: 'Date de préavis' },
  finance_subscription_owner: { en: 'Owner', fr: 'Responsable' },

  /* Import & Export */
  finance_tab_import_export: { en: 'Import & export', fr: 'Import et export' },
  finance_import_title: { en: 'Import bank statement', fr: 'Importer un relevé bancaire' },
  finance_import_description: {
    en: 'Upload a CSV or Excel file exported from your bank. Transactions are parsed and auto-categorized using your rules.',
    fr: 'Téléversez un fichier CSV ou Excel exporté par votre banque. Les transactions sont analysées et catégorisées automatiquement selon vos règles.',
  },
  finance_import_select_account: { en: 'Bank account', fr: 'Compte bancaire' },
  finance_import_select_file: { en: 'Choose CSV or Excel file', fr: 'Choisir un fichier CSV ou Excel' },
  finance_import_file_selected: { en: 'File selected', fr: 'Fichier sélectionné' },
  finance_import_process: { en: 'Import', fr: 'Importer' },
  finance_import_result: {
    en: 'Imported {new} new transactions, skipped {dup} duplicates, {err} errors.',
    fr: 'Importé {new} nouvelles transactions, ignoré {dup} doublons, {err} erreurs.',
  },
  finance_import_no_file: { en: 'Select a file to import.', fr: 'Sélectionnez un fichier à importer.' },
  finance_import_no_account: { en: 'Select a bank account.', fr: 'Sélectionnez un compte bancaire.' },
  finance_import_no_accounts: {
    en: 'No bank accounts yet. Create one in the Treasury tab before importing statements.',
    fr: 'Aucun compte bancaire pour l’instant. Créez-en un dans l’onglet Trésorerie avant d’importer des relevés.',
  },
  finance_import_failed: { en: 'Import failed.', fr: 'L’import a échoué.' },
  finance_import_history: { en: 'Import history', fr: 'Historique des imports' },
  finance_import_no_history: { en: 'No imports yet.', fr: 'Aucun import pour l\'instant.' },
  finance_import_file_name: { en: 'File', fr: 'Fichier' },
  finance_import_date: { en: 'Date', fr: 'Date' },
  finance_import_rows: { en: 'Rows', fr: 'Lignes' },
  finance_import_new: { en: 'New', fr: 'Nouvelles' },
  finance_import_dupes: { en: 'Duplicates', fr: 'Doublons' },
  finance_import_errors: { en: 'Errors', fr: 'Erreurs' },
  finance_import_amount: { en: 'Amount', fr: 'Montant' },
  finance_import_view_errors: { en: 'View errors', fr: 'Voir les erreurs' },
  finance_import_download_errors: { en: 'Download error report', fr: 'Télécharger le rapport d’erreurs' },
  finance_import_bulk_wizard: { en: 'Bulk import wizard', fr: 'Assistant d’importation en bloc' },
  finance_import_xlsx_supported: { en: 'CSV and Excel files are supported.', fr: 'Les fichiers CSV et Excel sont pris en charge.' },
  finance_import_select_account_first: { en: 'Select a bank account to upload a statement.', fr: 'Sélectionnez un compte bancaire pour téléverser un relevé.' },
  finance_import_demo_disabled: {
    en: 'Imports are disabled in the demo workspace. Switch to your production workspace to import.',
    fr: 'Les importations sont désactivées dans l’espace de démonstration. Passez à votre espace de production pour importer.',
  },
  finance_import_delete: { en: 'Delete', fr: 'Supprimer' },
  finance_import_delete_confirm: { en: 'Delete this import and its {count} transactions?', fr: 'Supprimer cet import et ses {count} transactions?' },

  /* Auto-categorization */
  finance_categorize_title: { en: 'Auto-categorize', fr: 'Catégorisation automatique' },
  finance_categorize_description: {
    en: 'Match unmatched bank items to ledger accounts using your category rules.',
    fr: 'Associez les écritures non rapprochées aux comptes du grand livre selon vos règles de catégorisation.',
  },
  finance_categorize_run: { en: 'Run auto-categorize', fr: 'Lancer la catégorisation' },
  finance_categorize_result: {
    en: 'Categorized {count} transactions.',
    fr: 'Catégorisé {count} transactions.',
  },
  finance_categorize_none: { en: 'No transactions matched your category rules.', fr: 'Aucune transaction ne correspond à vos règles de catégorisation.' },
  finance_categorize_no_rules: {
    en: 'Add a category rule to start auto-categorizing.',
    fr: 'Ajoutez une règle de catégorisation pour lancer la catégorisation automatique.',
  },

  /* Category rules */
  finance_rules_title: { en: 'Category rules', fr: 'Règles de catégorisation' },
  finance_rules_description: {
    en: 'Rules match transaction descriptions to ledger accounts. Higher priority rules are checked first.',
    fr: 'Les règles associent les descriptions de transactions aux comptes du grand livre. Les règles de priorité élevée sont vérifiées en premier.',
  },
  finance_rules_add: { en: 'Add rule', fr: 'Ajouter une règle' },
  finance_rules_pattern: { en: 'Pattern', fr: 'Motif' },
  finance_rules_match_type: { en: 'Match type', fr: 'Type de correspondance' },
  finance_rules_ledger_account: { en: 'Ledger account', fr: 'Compte du grand livre' },
  finance_rules_direction: { en: 'Direction', fr: 'Sens' },
  finance_rules_priority: { en: 'Priority', fr: 'Priorité' },
  finance_rules_active: { en: 'Active', fr: 'Actif' },
  finance_rules_no_rules: { en: 'No category rules yet.', fr: 'Aucune règle de catégorisation.' },
  finance_rules_seed: { en: 'Load defaults', fr: 'Charger les valeurs par défaut' },
  finance_rules_seed_result: { en: 'Added {count} default category rules.', fr: 'Ajouté {count} règles de catégorisation par défaut.' },
  finance_rules_seed_none: { en: 'No default rules were added. You may already have the same patterns, or no entity/book exists.', fr: 'Aucune règle par défaut n’a été ajoutée. Les mêmes motifs existent peut-être déjà, ou aucune entité/livre n’est défini.' },
  finance_rules_deactivate: { en: 'Deactivate', fr: 'Désactiver' },
  finance_rules_activate: { en: 'Activate', fr: 'Activer' },
  finance_rules_remove: { en: 'Remove', fr: 'Retirer' },

  /* Export */
  finance_export_title: { en: 'Export', fr: 'Export' },
  finance_export_description: {
    en: 'Download finance data as CSV for accounting import or as JSON for backup.',
    fr: 'Téléchargez les données financières en CSV pour importation comptable ou en JSON pour sauvegarde.',
  },
  finance_export_bank_items: { en: 'Export bank items (CSV)', fr: 'Exporter les écritures bancaires (CSV)' },
  finance_export_journals: { en: 'Export journals (CSV)', fr: 'Exporter les écritures comptables (CSV)' },
  finance_export_invoices: { en: 'Export invoices (CSV)', fr: 'Exporter les factures (CSV)' },
  finance_export_bills: { en: 'Export bills (CSV)', fr: 'Exporter les factures fournisseurs (CSV)' },
  finance_export_workspace: { en: 'Export full workspace (JSON)', fr: 'Exporter l\'espace de travail complet (JSON)' },

  /* Rule suggestions */
  finance_suggest_rules: { en: 'Suggest rules', fr: 'Suggérer des règles' },
  finance_suggest_rules_loading: { en: 'Analyzing transactions…', fr: 'Analyse des transactions en cours…' },
  finance_suggest_rules_none: { en: 'No rule suggestions found.', fr: 'Aucune suggestion de règle trouvée.' },
  finance_suggest_rules_none_detail: {
    en: 'Either existing rules already cover these transactions, the descriptions do not form a clear group, or there are no ledger accounts for the AI to match against. Try loading defaults or adding ledger accounts.',
    fr: 'Soit les règles existantes couvrent déjà ces transactions, soit les descriptions ne forment pas un groupe clair, soit il n’y a pas de comptes de grand livre contre lesquels l’IA peut faire correspondre. Essayez de charger les valeurs par défaut ou d’ajouter des comptes de grand livre.',
  },
  finance_suggest_rules_result: { en: '{count} rule suggestion(s).', fr: '{count} suggestion(s) de règle.' },
  finance_suggest_rules_add: { en: 'Add rule', fr: 'Ajouter la règle' },
  finance_suggest_rules_add_all: { en: 'Add all', fr: 'Tout ajouter' },
  finance_suggest_rules_ignore: { en: 'Ignore', fr: 'Ignorer' },
  finance_suggest_rules_from: { en: 'From {count} transaction(s)', fr: 'À partir de {count} transaction(s)' },
  finance_suggest_rules_confidence_high: { en: 'High confidence', fr: 'Confiance élevée' },
  finance_suggest_rules_confidence_medium: { en: 'Medium confidence', fr: 'Confiance moyenne' },
  finance_suggest_rules_confidence_low: { en: 'Low confidence', fr: 'Confiance faible' },
  finance_suggest_rules_ai_loading: { en: 'Loading AI model…', fr: 'Chargement du modèle IA…' },
  finance_suggest_rules_ai_toggle: { en: 'Use AI model', fr: 'Utiliser le modèle IA' },
  finance_suggest_rules_ai_error: { en: 'AI model failed. Falling back to local suggestions.', fr: 'Le modèle IA a échoué. Retour aux suggestions locales.' },

  /* AI import analysis */
  finance_ai_note_matched: {
    en: 'AI matched to {account} ({code}). Confidence: {confidence}.',
    fr: 'L\'IA a associé à {account} ({code}). Confiance : {confidence}.',
  },
  finance_ai_note_feedback: {
    en: 'Matched to {account} ({code}) based on a previous correction. Confidence: {confidence}.',
    fr: 'Associé à {account} ({code}) d\'après une correction antérieure. Confiance : {confidence}.',
  },
  finance_ai_note_review: {
    en: 'Could not confidently match. Review recommended.',
    fr: 'Impossible d\'associer avec confiance. Révision recommandée.',
  },
  finance_ai_settings_title: { en: 'AI import analysis', fr: 'Analyse des imports par IA' },
  finance_ai_settings_description: {
    en: 'Automatically analyse imported transactions, suggest or apply ledger accounts, and learn from your corrections.',
    fr: 'Analyser automatiquement les transactions importées, suggérer ou appliquer des comptes du grand livre, et apprendre de vos corrections.',
  },
  finance_ai_settings_enable: { en: 'Analyse imports automatically', fr: 'Analyser les imports automatiquement' },
  finance_ai_settings_mode: { en: 'AI mode', fr: 'Mode IA' },
  finance_ai_settings_mode_suggest: { en: 'Suggest only', fr: 'Suggérer seulement' },
  finance_ai_settings_mode_auto_high: { en: 'Auto-apply high confidence', fr: 'Appliquer automatiquement les confiances élevées' },
  finance_ai_settings_mode_auto_all: { en: 'Auto-apply all matches', fr: 'Appliquer automatiquement toutes les associations' },
  finance_ai_import_analyzing: { en: 'Analysing imported transactions with AI…', fr: 'Analyse des transactions importées par IA en cours…' },
  finance_ai_import_result: { en: 'AI analysed {count} transaction(s). {matched} matched, {suggested} suggested for review.', fr: 'L\'IA a analysé {count} transaction(s). {matched} associée(s), {suggested} en attente de révision.' },
  finance_ai_import_result_none: { en: 'AI could not confidently match any imported transactions.', fr: 'L\'IA n\'a pu associer aucune transaction importée avec confiance.' },
  finance_ai_import_result_rules: { en: '{count} new categorization rule(s) created.', fr: '{count} nouvelle(s) règle(s) de catégorisation créée(s).' },
  finance_ai_import_no_ledger: {
    en: 'AI analysis is on, but there are no ledger accounts yet. Load defaults or add ledger accounts so the AI can match transactions.',
    fr: 'L’analyse IA est activée, mais il n’y a pas encore de comptes de grand livre. Chargez les valeurs par défaut ou ajoutez des comptes de grand livre pour que l’IA puisse faire correspondre les transactions.',
  },
  finance_transactions_ai_suggestion: { en: 'AI suggestion:', fr: 'Suggestion de l\'IA :' },
  finance_transactions_note: { en: 'Note', fr: 'Note' },
  finance_transactions_change_account: { en: 'Change account', fr: 'Changer de compte' },
  finance_transactions_save_changes: { en: 'Save', fr: 'Enregistrer' },
  finance_transactions_accept_suggestion: { en: 'Accept', fr: 'Accepter' },

  /* Account types (ledger account form) */
  finance_account_type_asset: { en: 'Asset', fr: 'Actif' },
  finance_account_type_liability: { en: 'Liability', fr: 'Passif' },
  finance_account_type_equity: { en: 'Equity', fr: 'Capitaux propres' },
  finance_account_type_revenue: { en: 'Revenue', fr: 'Revenu' },
  finance_account_type_expense: { en: 'Expense', fr: 'Charge' },
  finance_account_type_contra: { en: 'Contra', fr: 'Contrepartie' },

  /* Plan frozen badge */
  finance_plan_frozen: { en: 'Frozen', fr: 'Gelé' },

  /* Reserve goal types */
  finance_reserve_type_emergency_operating: { en: 'Emergency operating', fr: 'Fonds de fonctionnement d’urgence' },
  finance_reserve_type_payroll: { en: 'Payroll', fr: 'Paie' },
  finance_reserve_type_tax: { en: 'Tax', fr: 'Fiscalité' },
  finance_reserve_type_capital_purchase: { en: 'Capital purchase', fr: 'Achat d’immobilisations' },
  finance_reserve_type_other: { en: 'Other', fr: 'Autre' },

  /* Party types */
  finance_party_type_supplier: { en: 'Supplier', fr: 'Fournisseur' },
  finance_party_type_customer: { en: 'Customer', fr: 'Client' },
  finance_party_type_employee: { en: 'Employee', fr: 'Employé' },
  finance_party_type_bank: { en: 'Bank', fr: 'Banque' },
  finance_party_type_advisor: { en: 'Advisor', fr: 'Conseiller' },

  /* Tax types */
  finance_tax_type_income_tax: { en: 'Income tax', fr: 'Impôt sur le revenu' },
  finance_tax_type_gst_hst: { en: 'GST/HST', fr: 'TPS/TVH' },
  finance_tax_type_qst: { en: 'QST', fr: 'TVQ' },
  finance_tax_type_payroll_source_deductions: { en: 'Payroll source deductions', fr: 'Retenues à la source sur la paie' },
  finance_tax_type_employer_contributions: { en: 'Employer contributions', fr: 'Cotisations patronales' },
  finance_tax_type_other: { en: 'Other', fr: 'Autre' },

  /* Scenario types */
  finance_scenario_type_baseline: { en: 'Baseline', fr: 'Référence' },
  finance_scenario_type_hiring: { en: 'Hiring', fr: 'Embauche' },
  finance_scenario_type_capital_purchase: { en: 'Capital purchase', fr: 'Achat d’immobilisations' },
  finance_scenario_type_financing: { en: 'Financing', fr: 'Financement' },
  finance_scenario_type_operating_change: { en: 'Operating change', fr: 'Changement d’exploitation' },
  finance_scenario_type_tax: { en: 'Tax', fr: 'Fiscalité' },

  /* Forecast types */
  finance_forecast_type_monthly_operating: { en: 'Monthly operating', fr: 'Exploitation mensuelle' },
  finance_forecast_type_13_week_cash: { en: '13-week cash', fr: 'Trésorerie de 13 semaines' },
  finance_forecast_type_custom: { en: 'Custom', fr: 'Personnalisé' },
})
