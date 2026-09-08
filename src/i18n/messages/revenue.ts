import { defineMessages } from '../core'

/**
 * Revenue overview chrome.
 * EN + FR [FR self-authored].
 */
export const revenueMessages = defineMessages({
  rev_title: { en: 'Revenue', fr: 'Revenus' },
  rev_subtitle: {
    en: 'A cross-module view of pipeline, campaigns, and customer activity.',
    fr: 'Une vue transversale de la pipeline, des campagnes et de l’activité client.',
  },
  rev_pipeline: { en: 'Pipeline', fr: 'Pipeline' },
  rev_active_campaigns: { en: 'Active campaigns', fr: 'Campagnes actives' },
  rev_recent_activity: { en: 'Recent customer activity', fr: 'Activité client récente' },
  rev_upcoming_comms: { en: 'Upcoming communications', fr: 'Communications à venir' },
  rev_value: { en: 'Value', fr: 'Valeur' },
  rev_deals: { en: 'deals', fr: 'opportunités' },
  rev_go_to_crm: { en: 'Open CRM', fr: 'Ouvrir le CRM' },
  rev_go_to_comms: { en: 'Open Comms', fr: 'Ouvrir Comms' },
  rev_empty_crm: { en: 'No CRM data yet. Start in CRM.', fr: 'Aucune donnée CRM. Commencez dans le CRM.' },
  rev_empty_comms: { en: 'No active campaigns.', fr: 'Aucune campagne active.' },
  rev_disclaimer: {
    en: 'Pulls from CRM and Comms; it does not replace those modules.',
    fr: 'Tire du CRM et de Comms; cela ne remplace pas ces modules.',
  },
})
