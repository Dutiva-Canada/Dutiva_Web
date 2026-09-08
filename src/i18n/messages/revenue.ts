import { defineMessages } from '../core'

/**
 * Revenue workspace chrome.
 * EN + FR [FR self-authored].
 */
export const revenueMessages = defineMessages({
  rev_title: { en: 'Revenue', fr: 'Revenus' },
  rev_subtitle: {
    en: 'Track revenue streams and customer invoices.',
    fr: 'Suivez les flux de revenus et les factures clients.',
  },

  /* Tabs */
  rev_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  rev_tab_streams: { en: 'Streams', fr: 'Flux' },
  rev_tab_invoices: { en: 'Invoices', fr: 'Factures' },

  /* Mode notice */
  rev_demo_read_only: {
    en: 'Demo workspace: changes are not persisted.',
    fr: 'Espace de travail de démonstration : les modifications ne sont pas conservées.',
  },
  rev_production_synced: {
    en: 'Production mode syncs with your workspace database.',
    fr: 'Le mode production se synchronise avec la base de données de votre espace de travail.',
  },

  /* Overview analytics */
  rev_mrr: { en: 'Monthly recurring revenue', fr: 'Revenu mensuel récurrent' },
  rev_active_streams_summary: {
    en: '{n} active recurring streams',
    fr: '{n} flux récurrents actifs',
  },
  rev_open_invoices: { en: 'Open invoice total', fr: 'Total des factures ouvertes' },
  rev_open_invoices_count: { en: '{n} open invoices', fr: '{n} factures ouvertes' },
  rev_paid_ytd: { en: 'Paid YTD', fr: 'Payé depuis le début de l’année' },
  rev_paid_ytd_summary: { en: '{n} paid this year', fr: '{n} payées cette année' },
  rev_overdue: { en: 'Overdue invoices', fr: 'Factures en retard' },
  rev_overdue_summary: { en: '{n} past due', fr: '{n} en souffrance' },
  rev_recent_invoices: { en: 'Recently sent invoices', fr: 'Factures récemment envoyées' },

  /* CRM / Comms cross-view */
  rev_pipeline: { en: 'Pipeline', fr: 'Pipeline' },
  rev_active_campaigns: { en: 'Active campaigns', fr: 'Campagnes actives' },
  rev_recent_activity: { en: 'Recent customer activity', fr: 'Activité client récente' },
  rev_upcoming_comms: { en: 'Upcoming communications', fr: 'Communications à venir' },
  rev_value: { en: 'Value', fr: 'Valeur' },
  rev_deals: { en: 'deals', fr: 'opportunités' },
  rev_go_to_crm: { en: 'Open CRM', fr: 'Ouvrir le CRM' },
  rev_go_to_comms: { en: 'Open Comms', fr: 'Ouvrir Comms' },
  rev_empty_crm: {
    en: 'No CRM data yet. Start in CRM.',
    fr: 'Aucune donnée CRM. Commencez dans le CRM.',
  },
  rev_empty_comms: { en: 'No active campaigns.', fr: 'Aucune campagne active.' },

  /* Entity link target modules */
  rev_links_crm_deals: { en: 'CRM deals', fr: 'Opportunités CRM' },
  rev_links_comms_initiatives: { en: 'Comms initiatives', fr: 'Initiatives Comms' },
  rev_links_streams: { en: 'Revenue streams', fr: 'Flux de revenus' },

  /* Stream / invoice labels */
  rev_name: { en: 'Name', fr: 'Nom' },
  rev_customer_name: { en: 'Customer name', fr: 'Nom du client' },
  rev_type: { en: 'Type', fr: 'Type' },
  rev_status: { en: 'Status', fr: 'Statut' },
  rev_amount: { en: 'Amount', fr: 'Montant' },
  rev_currency: { en: 'Currency', fr: 'Devise' },
  rev_frequency: { en: 'Frequency', fr: 'Fréquence' },
  rev_frequency_none: { en: 'None', fr: 'Aucune' },
  rev_start_date: { en: 'Start date', fr: 'Date de début' },
  rev_end_date: { en: 'End date', fr: 'Date de fin' },
  rev_issue_date: { en: 'Issue date', fr: 'Date d’émission' },
  rev_due_date: { en: 'Due date', fr: 'Date d’échéance' },
  rev_paid_date: { en: 'Paid date', fr: 'Date de paiement' },
  rev_stream: { en: 'Stream', fr: 'Flux' },
  rev_select_stream: { en: 'No stream', fr: 'Aucun flux' },
  rev_notes: { en: 'Notes', fr: 'Notes' },
  rev_customer: { en: 'Customer', fr: 'Client' },
  rev_due: { en: 'Due', fr: 'Échéance' },
  rev_issue: { en: 'Issued', fr: 'Émise' },

  /* Stream statuses */
  rev_stream_status_active: { en: 'Active', fr: 'Actif' },
  rev_stream_status_paused: { en: 'Paused', fr: 'En pause' },
  rev_stream_status_completed: { en: 'Completed', fr: 'Terminé' },
  rev_stream_status_cancelled: { en: 'Cancelled', fr: 'Annulé' },

  /* Invoice statuses */
  rev_invoice_status_draft: { en: 'Draft', fr: 'Brouillon' },
  rev_invoice_status_sent: { en: 'Sent', fr: 'Envoyée' },
  rev_invoice_status_paid: { en: 'Paid', fr: 'Payée' },
  rev_invoice_status_overdue: { en: 'Overdue', fr: 'En retard' },
  rev_invoice_status_cancelled: { en: 'Cancelled', fr: 'Annulée' },

  /* Stream types */
  rev_stream_type_recurring: { en: 'Recurring', fr: 'Récurrent' },
  rev_stream_type_one_time: { en: 'One-time', fr: 'Ponctuel' },

  /* Frequencies */
  rev_frequency_monthly: { en: 'Monthly', fr: 'Mensuel' },
  rev_frequency_quarterly: { en: 'Quarterly', fr: 'Trimestriel' },
  rev_frequency_annually: { en: 'Annually', fr: 'Annuel' },

  /* Currencies */
  rev_currency_CAD: { en: 'CAD', fr: 'CAD' },
  rev_currency_USD: { en: 'USD', fr: 'USD' },
  rev_currency_EUR: { en: 'EUR', fr: 'EUR' },
  rev_currency_GBP: { en: 'GBP', fr: 'GBP' },

  /* Actions */
  rev_save: { en: 'Save', fr: 'Enregistrer' },
  rev_save_changes: { en: 'Save changes', fr: 'Enregistrer les modifications' },
  rev_cancel: { en: 'Cancel', fr: 'Annuler' },
  rev_edit: { en: 'Edit', fr: 'Modifier' },
  rev_remove: { en: 'Remove', fr: 'Retirer' },
  rev_add_stream: { en: 'Add stream', fr: 'Ajouter un flux' },
  rev_add_invoice: { en: 'Add invoice', fr: 'Ajouter une facture' },

  /* Empty states */
  rev_empty_streams: {
    en: 'No revenue streams yet. Add one to get started.',
    fr: 'Aucun flux de revenus. Ajoutez-en un pour commencer.',
  },
  rev_empty_invoices: {
    en: 'No invoices yet. Add one to get started.',
    fr: 'Aucune facture. Ajoutez-en une pour commencer.',
  },

  /* Disclaimer */
  rev_disclaimer: {
    en: 'Tracks revenue streams and invoices; it does not replace your accounting records.',
    fr: 'Fait le suivi des flux de revenus et des factures; cela ne remplace pas vos registres comptables.',
  },
})
