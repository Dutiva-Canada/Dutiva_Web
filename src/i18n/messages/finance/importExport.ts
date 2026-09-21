import { defineMessages } from '../../core'

/* Import & Export — statement imports, auto-categorization, rules, and AI analysis. */
export const financeImportExport = defineMessages({
  finance_tab_import_export: { en: 'Import & export', fr: 'Import et export' },
  finance_import_title: { en: 'Import bank statement', fr: 'Importer un relevé bancaire' },
  finance_import_description: {
    en: 'Upload a CSV or Excel file exported from your bank. Transactions are parsed and auto-categorized using your rules.',
    fr: 'Téléversez un fichier CSV ou Excel exporté par votre banque. Les transactions sont analysées et catégorisées automatiquement selon vos règles.',
  },
  finance_import_select_account: { en: 'Bank account', fr: 'Compte bancaire' },
  finance_import_select_file: {
    en: 'Choose CSV or Excel file',
    fr: 'Choisir un fichier CSV ou Excel',
  },
  finance_import_file_selected: { en: 'File selected', fr: 'Fichier sélectionné' },
  finance_import_process: { en: 'Import', fr: 'Importer' },
  finance_import_result: {
    en: 'Imported {new} new transactions, skipped {dup} duplicates, {err} errors.',
    fr: 'Importé {new} nouvelles transactions, ignoré {dup} doublons, {err} erreurs.',
  },
  finance_import_no_file: {
    en: 'Select a file to import.',
    fr: 'Sélectionnez un fichier à importer.',
  },
  finance_import_no_account: {
    en: 'Select a bank account.',
    fr: 'Sélectionnez un compte bancaire.',
  },
  finance_import_no_accounts: {
    en: 'No bank accounts yet. Create one in the Treasury tab before importing statements.',
    fr: 'Aucun compte bancaire pour l’instant. Créez-en un dans l’onglet Trésorerie avant d’importer des relevés.',
  },
  finance_import_failed: { en: 'Import failed.', fr: 'L’import a échoué.' },
  finance_import_history: { en: 'Import history', fr: 'Historique des imports' },
  finance_import_no_history: { en: 'No imports yet.', fr: "Aucun import pour l'instant." },
  finance_import_file_name: { en: 'File', fr: 'Fichier' },
  finance_import_date: { en: 'Date', fr: 'Date' },
  finance_import_rows: { en: 'Rows', fr: 'Lignes' },
  finance_import_new: { en: 'New', fr: 'Nouvelles' },
  finance_import_dupes: { en: 'Duplicates', fr: 'Doublons' },
  finance_import_errors: { en: 'Errors', fr: 'Erreurs' },
  finance_import_amount: { en: 'Amount', fr: 'Montant' },
  finance_import_view_errors: { en: 'View errors', fr: 'Voir les erreurs' },
  finance_import_download_errors: {
    en: 'Download error report',
    fr: 'Télécharger le rapport d’erreurs',
  },
  finance_import_bulk_wizard: { en: 'Bulk import wizard', fr: 'Assistant d’importation en bloc' },
  finance_import_xlsx_supported: {
    en: 'CSV and Excel files are supported.',
    fr: 'Les fichiers CSV et Excel sont pris en charge.',
  },
  finance_import_select_account_first: {
    en: 'Select a bank account to upload a statement.',
    fr: 'Sélectionnez un compte bancaire pour téléverser un relevé.',
  },
  finance_import_demo_disabled: {
    en: 'Imports are disabled in the demo workspace. Switch to your production workspace to import.',
    fr: 'Les importations sont désactivées dans l’espace de démonstration. Passez à votre espace de production pour importer.',
  },
  finance_import_delete: { en: 'Delete', fr: 'Supprimer' },
  finance_import_delete_confirm: {
    en: 'Delete this import and its {count} transactions?',
    fr: 'Supprimer cet import et ses {count} transactions?',
  },

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
  finance_categorize_none: {
    en: 'No transactions matched your category rules.',
    fr: 'Aucune transaction ne correspond à vos règles de catégorisation.',
  },
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
  finance_rules_seed_result: {
    en: 'Added {count} default category rules.',
    fr: 'Ajouté {count} règles de catégorisation par défaut.',
  },
  finance_rules_seed_none: {
    en: 'No default rules were added. You may already have the same patterns, or no entity/book exists.',
    fr: 'Aucune règle par défaut n’a été ajoutée. Les mêmes motifs existent peut-être déjà, ou aucune entité/livre n’est défini.',
  },
  finance_rules_deactivate: { en: 'Deactivate', fr: 'Désactiver' },
  finance_rules_activate: { en: 'Activate', fr: 'Activer' },
  finance_rules_remove: { en: 'Remove', fr: 'Retirer' },

  /* Export */
  finance_export_title: { en: 'Export', fr: 'Export' },
  finance_export_description: {
    en: 'Download finance data as CSV for accounting import or as JSON for backup.',
    fr: 'Téléchargez les données financières en CSV pour importation comptable ou en JSON pour sauvegarde.',
  },
  finance_export_bank_items: {
    en: 'Export bank items (CSV)',
    fr: 'Exporter les écritures bancaires (CSV)',
  },
  finance_export_journals: {
    en: 'Export journals (CSV)',
    fr: 'Exporter les écritures comptables (CSV)',
  },
  finance_export_invoices: { en: 'Export invoices (CSV)', fr: 'Exporter les factures (CSV)' },
  finance_export_bills: {
    en: 'Export bills (CSV)',
    fr: 'Exporter les factures fournisseurs (CSV)',
  },
  finance_export_workspace: {
    en: 'Export full workspace (JSON)',
    fr: "Exporter l'espace de travail complet (JSON)",
  },

  /* Rule suggestions */
  finance_suggest_rules: { en: 'Suggest rules', fr: 'Suggérer des règles' },
  finance_suggest_rules_loading: {
    en: 'Analyzing transactions…',
    fr: 'Analyse des transactions en cours…',
  },
  finance_suggest_rules_none: {
    en: 'No rule suggestions found.',
    fr: 'Aucune suggestion de règle trouvée.',
  },
  finance_suggest_rules_none_detail: {
    en: 'Either existing rules already cover these transactions, the descriptions do not form a clear group, or there are no ledger accounts for the AI to match against. Try loading defaults or adding ledger accounts.',
    fr: 'Soit les règles existantes couvrent déjà ces transactions, soit les descriptions ne forment pas un groupe clair, soit il n’y a pas de comptes de grand livre contre lesquels l’IA peut faire correspondre. Essayez de charger les valeurs par défaut ou d’ajouter des comptes de grand livre.',
  },
  finance_suggest_rules_result: {
    en: '{count} rule suggestion(s).',
    fr: '{count} suggestion(s) de règle.',
  },
  finance_suggest_rules_add: { en: 'Add rule', fr: 'Ajouter la règle' },
  finance_suggest_rules_add_all: { en: 'Add all', fr: 'Tout ajouter' },
  finance_suggest_rules_ignore: { en: 'Ignore', fr: 'Ignorer' },
  finance_suggest_rules_from: {
    en: 'From {count} transaction(s)',
    fr: 'À partir de {count} transaction(s)',
  },
  finance_suggest_rules_confidence_high: { en: 'High confidence', fr: 'Confiance élevée' },
  finance_suggest_rules_confidence_medium: { en: 'Medium confidence', fr: 'Confiance moyenne' },
  finance_suggest_rules_confidence_low: { en: 'Low confidence', fr: 'Confiance faible' },
  finance_suggest_rules_ai_loading: { en: 'Loading AI model…', fr: 'Chargement du modèle IA…' },
  finance_suggest_rules_ai_toggle: { en: 'Use AI model', fr: 'Utiliser le modèle IA' },
  finance_suggest_rules_ai_error: {
    en: 'AI model failed. Falling back to local suggestions.',
    fr: 'Le modèle IA a échoué. Retour aux suggestions locales.',
  },

  /* AI import analysis */
  finance_ai_note_matched: {
    en: 'AI matched to {account} ({code}). Confidence: {confidence}.',
    fr: "L'IA a associé à {account} ({code}). Confiance : {confidence}.",
  },
  finance_ai_note_feedback: {
    en: 'Matched to {account} ({code}) based on a previous correction. Confidence: {confidence}.',
    fr: "Associé à {account} ({code}) d'après une correction antérieure. Confiance : {confidence}.",
  },
  finance_ai_note_review: {
    en: 'Could not confidently match. Review recommended.',
    fr: "Impossible d'associer avec confiance. Révision recommandée.",
  },
  finance_ai_settings_title: { en: 'AI import analysis', fr: 'Analyse des imports par IA' },
  finance_ai_settings_description: {
    en: 'Automatically analyse imported transactions, suggest or apply ledger accounts, and learn from your corrections.',
    fr: 'Analyser automatiquement les transactions importées, suggérer ou appliquer des comptes du grand livre, et apprendre de vos corrections.',
  },
  finance_ai_settings_enable: {
    en: 'Analyse imports automatically',
    fr: 'Analyser les imports automatiquement',
  },
  finance_ai_settings_mode: { en: 'AI mode', fr: 'Mode IA' },
  finance_ai_settings_mode_suggest: { en: 'Suggest only', fr: 'Suggérer seulement' },
  finance_ai_settings_mode_auto_high: {
    en: 'Auto-apply high confidence',
    fr: 'Appliquer automatiquement les confiances élevées',
  },
  finance_ai_settings_mode_auto_all: {
    en: 'Auto-apply all matches',
    fr: 'Appliquer automatiquement toutes les associations',
  },
  finance_ai_import_analyzing: {
    en: 'Analysing imported transactions with AI…',
    fr: 'Analyse des transactions importées par IA en cours…',
  },
  finance_ai_import_result: {
    en: 'AI analysed {count} transaction(s). {matched} matched, {suggested} suggested for review.',
    fr: "L'IA a analysé {count} transaction(s). {matched} associée(s), {suggested} en attente de révision.",
  },
  finance_ai_import_result_none: {
    en: 'AI could not confidently match any imported transactions.',
    fr: "L'IA n'a pu associer aucune transaction importée avec confiance.",
  },
  finance_ai_import_result_rules: {
    en: '{count} new categorization rule(s) created.',
    fr: '{count} nouvelle(s) règle(s) de catégorisation créée(s).',
  },
  finance_ai_import_no_ledger: {
    en: 'AI analysis is on, but there are no ledger accounts yet. Load defaults or add ledger accounts so the AI can match transactions.',
    fr: 'L’analyse IA est activée, mais il n’y a pas encore de comptes de grand livre. Chargez les valeurs par défaut ou ajoutez des comptes de grand livre pour que l’IA puisse faire correspondre les transactions.',
  },
})
