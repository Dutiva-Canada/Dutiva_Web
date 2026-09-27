import { defineMessages } from '../../core'

/* Shell, navigation tabs, common actions, and cross-screen states. */
export const financeChrome = defineMessages({
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

  /* Deadline states */
  finance_overdue: { en: 'Overdue', fr: 'En retard' },
  finance_due_soon: { en: 'Due soon', fr: 'Bientôt à échéance' },

  /* Empty filtered state */
  finance_no_results: {
    en: 'No results match the current filter.',
    fr: 'Aucun résultat ne correspond au filtre actuel.',
  },

  /* Status filter */
  finance_filter_all: { en: 'All', fr: 'Tous' },

  /* Lifecycle messages */
  finance_invalid_transition: {
    en: 'This status transition is not allowed.',
    fr: 'Cette transition de statut n’est pas autorisée.',
  },
  finance_not_found: { en: 'Record not found.', fr: 'Dossier introuvable.' },

  /* Money representation */
  finance_total_currency: { en: 'Total', fr: 'Total' },

  /* Closed period */
  finance_period_locked: {
    en: 'This period is locked. Ordinary edits are not allowed.',
    fr: 'Cette période est verrouillée. Les modifications ordinaires ne sont pas autorisées.',
  },
})
