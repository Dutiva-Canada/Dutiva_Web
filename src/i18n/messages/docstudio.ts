import { defineMessages } from '../core'

/**
 * Document Studio overlay strings — transcribed from the App v2 prototype
 * (`buildDocStudioView()`, the doc-studio methods, and `buildI18n()`'s
 * esign / disclaimer_full entries). FR self-authored (Québec French) only
 * where the prototype ships no translation; those keys are marked
 * `FR self-authored`.
 */
export const docstudioMessages = defineMessages({
  /* Header */
  docstudio_dialog_aria: { en: 'Document Studio', fr: 'Studio de documents' },
  docstudio_ai_draft: { en: 'AI draft', fr: 'ébauche IA' }, // FR self-authored
  docstudio_edit_draft: { en: 'Edit draft', fr: 'Modifier l’ébauche' },
  docstudio_done_editing: { en: 'Done editing', fr: 'Terminer la modification' },
  docstudio_close_aria: { en: 'Close', fr: 'Fermer' }, // FR self-authored

  /* Generation state */
  docstudio_generating: { en: 'Advisor is drafting…', fr: 'Le Conseiller rédige…' },
  docstudio_generating_aria: { en: 'Generating draft', fr: 'Génération de l’ébauche' }, // FR self-authored

  /* Risk chip + meta bar */
  docstudio_chip_high_risk: { en: 'High-risk document', fr: 'Document à risque élevé' },
  docstudio_chip_standard: { en: 'Standard', fr: 'Standard' },
  docstudio_meta_show: { en: 'Document details', fr: 'Détails du document' },
  docstudio_meta_hide: { en: 'Hide details', fr: 'Masquer les détails' },

  /* Meta rows */
  docstudio_meta_linked: { en: 'Linked to', fr: 'Lié à' },
  docstudio_meta_jur: { en: 'Jurisdiction', fr: 'Compétence' },
  docstudio_meta_governing: { en: 'Governing context', fr: 'Contexte applicable' },
  docstudio_meta_template: { en: 'Template version', fr: 'Version du modèle' },
  docstudio_meta_created: { en: 'Created', fr: 'Créé' },
  docstudio_meta_modified: { en: 'Last modified', fr: 'Dernière modification' },
  docstudio_just_now: { en: 'Just now', fr: 'À l’instant' },
  docstudio_meta_reviewed: { en: 'Reviewed by', fr: 'Révisé par' },
  docstudio_meta_legal: { en: 'Legal review', fr: 'Révision juridique' },
  docstudio_meta_retention: { en: 'Retention', fr: 'Conservation' },
  docstudio_meta_export: { en: 'Export status', fr: 'État d’exportation' },
  docstudio_exported_as: { en: 'Exported as ', fr: 'Exporté en ' },
  docstudio_not_exported: { en: 'Not exported', fr: 'Non exporté' },
  docstudio_meta_signature: { en: 'Signature status', fr: 'État de la signature' },
  docstudio_signature_sent: {
    en: 'Sent — awaiting signature',
    fr: 'Envoyé — en attente de signature',
  },
  docstudio_signature_not_sent: { en: 'Not sent', fr: 'Non envoyé' },
  docstudio_assumptions: { en: 'Assumptions used', fr: 'Hypothèses utilisées' },
  docstudio_missing: { en: 'Missing information', fr: 'Renseignements manquants' },
  docstudio_audit_note: {
    en: 'Generation, edits, exports, and signature requests are recorded in the audit log.',
    fr: 'La génération, les modifications, les exportations et les demandes de signature sont consignées au journal d’audit.',
  },

  /* Revise chips */
  docstudio_revise_label: {
    en: 'Ask Advisor to revise',
    fr: 'Demander une révision au Conseiller',
  },
  docstudio_revise_formal: { en: 'More formal', fr: 'Plus formel' },
  docstudio_revise_shorten: { en: 'Shorten', fr: 'Raccourcir' },
  docstudio_revise_compassionate: { en: 'More compassionate', fr: 'Plus empathique' },

  /* High-risk gate */
  docstudio_gate_title: { en: 'Review before sending', fr: 'Vérification avant l’envoi' },
  docstudio_gate_body: {
    en: 'This document involves a high-risk HR decision. Confirm the facts, jurisdiction, employment agreement terms, and whether legal review is required before sending.',
    fr: 'Ce document concerne une décision RH à risque élevé. Confirmez les faits, la compétence applicable, les modalités du contrat d’emploi et la nécessité d’une révision juridique avant l’envoi.',
  },
  docstudio_gate_confirm: { en: 'Confirm and continue', fr: 'Confirmer et continuer' },
  docstudio_gate_cancel: { en: 'Go back', fr: 'Retour' },
  docstudio_gate_legal: {
    en: 'Request legal review instead',
    fr: 'Demander plutôt une révision juridique',
  },

  /* Export + signature actions */
  docstudio_export_pdf: { en: 'Export PDF', fr: 'Exporter en PDF' },
  docstudio_export_word: { en: 'Export Word', fr: 'Exporter en Word' },
  docstudio_copy_link: { en: 'Copy link', fr: 'Copier le lien' },
  docstudio_esign_send: { en: 'Send for e-signature', fr: 'Envoyer pour signature électronique' },
  docstudio_esign_pending: {
    en: 'Signature requested — awaiting response',
    fr: 'Signature demandée — en attente de réponse',
  },
  docstudio_section_edit_aria: { en: 'Edit section', fr: 'Modifier la section' }, // FR self-authored

  /* AI revision notes (prototype `applyRevision` — EN only there; FR self-authored) */
  docstudio_ainote_formal: {
    en: 'Advisor made the tone more formal throughout.',
    fr: 'Le Conseiller a rendu le ton plus formel dans l’ensemble du document.',
  },
  docstudio_ainote_shorten: {
    en: 'Advisor shortened this to the essential points.',
    fr: 'Le Conseiller a raccourci le texte à l’essentiel.',
  },
  docstudio_ainote_compassionate: {
    en: 'Advisor added a more compassionate opening line.',
    fr: 'Le Conseiller a ajouté une phrase d’ouverture plus empathique.',
  },

  /* Toasts */
  docstudio_toast_ready_suffix: {
    en: ' draft ready — review before sending',
    fr: ' — ébauche prête ; vérifiez avant l’envoi',
  },
  docstudio_toast_revised: {
    en: 'Advisor revised the draft',
    fr: 'Le Conseiller a révisé l’ébauche', // FR self-authored
  },
  docstudio_toast_esign: {
    en: 'Sent for e-signature',
    fr: 'Envoyé pour signature électronique',
  },
  docstudio_toast_legal: {
    en: 'Legal review requested — routed to employment counsel',
    fr: 'Révision juridique demandée — acheminée au conseiller juridique en emploi',
  },

  /* Unknown-template fallbacks (prototype EN only; FR self-authored) */
  docstudio_fallback_category: { en: 'General', fr: 'Général' },
  docstudio_fallback_generate: {
    en: 'Advisor will draft this based on your specifics — click a quick action below to get started.',
    fr: 'Le Conseiller rédigera ce document selon vos précisions — cliquez sur une action rapide ci-dessous pour commencer.',
  },
  docstudio_fallback_library_1: {
    en: 'Advisor hasn’t drafted this yet.',
    fr: 'Le Conseiller n’a pas encore rédigé ce document.',
  },
  docstudio_fallback_library_2: {
    en: 'Describe what this document should cover and Advisor will generate a first draft.',
    fr: 'Décrivez ce que ce document doit couvrir et le Conseiller en générera une première ébauche.',
  },
})
