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
    en: 'Production mode — data is saved to this browser only until a database migration is deployed.',
    fr: 'Mode production — les données sont enregistrées dans ce navigateur uniquement jusqu’au déploiement d’une migration de base de données.',
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
})
