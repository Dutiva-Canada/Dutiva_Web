import { defineMessages } from '../../core'

/* External actions — provider references, exports, and settlement states. */
export const financeExternal = defineMessages({
  finance_external_title: { en: 'External actions', fr: 'Actions externes' },
  finance_external_no_actions: { en: 'No external actions.', fr: 'Aucune action externe.' },
  finance_external_record_type: { en: 'Record type', fr: 'Type de dossier' },
  finance_external_provider_ref: { en: 'Provider reference', fr: 'Référence fournisseur' },
  finance_external_confirmed_at: { en: 'Confirmed at', fr: 'Confirmé le' },
  finance_external_idempotency_key: { en: 'Idempotency key', fr: 'Clé d’idempotence' },

  /* External action transitions */
  finance_external_prepare_export: { en: 'Prepare export', fr: "Préparer l'export" },
  finance_external_mark_accepted: { en: 'Mark accepted', fr: 'Marquer accepté' },
  finance_external_mark_settled: { en: 'Mark settled', fr: 'Marquer réglé' },
  finance_external_mark_failed: { en: 'Mark failed', fr: 'Marquer échoué' },
})
