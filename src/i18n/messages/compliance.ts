import { defineMessages } from '../core'

/**
 * Compliance view chrome — transcribed from the App v2 prototype
 * (`buildComplianceView()`, `markEvidence()`, `explainObligation()`,
 * `askAdvisorAboutRisk()` and the `lbl.*` map in `buildAppViewModel()`).
 *
 * EN verbatim from the prototype; FR from its inline `L(en, fr)` pairs and
 * `frDict()`. FR strings with no source in the prototype are marked
 * [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(complianceMessages.key)`.
 */
export const complianceMessages = defineMessages({
  /* ── Jurisdiction filter (prototype `jurs` + markup aria-label) ─────────── */
  compliance_jur_filter_aria: { en: 'Jurisdiction filter', fr: 'Filtre de compétence' }, // [FR self-authored]
  compliance_jur_all: { en: 'All jurisdictions', fr: 'Toutes les compétences' },
  compliance_jur_ontario: { en: 'Ontario', fr: 'Ontario' },
  compliance_jur_quebec: { en: 'Quebec', fr: 'Québec' },
  compliance_jur_bc: {
    en: 'British Columbia (coming soon)',
    fr: 'Colombie-Britannique (bientôt)',
  },
  compliance_jur_federal: { en: 'Federal', fr: 'Fédéral' },

  /* ── Stat cards ─────────────────────────────────────────────────────────── */
  compliance_stat_open_obligations: { en: 'Open obligations', fr: 'Obligations ouvertes' },
  compliance_stat_due_soon: { en: 'Due in 30 days', fr: 'Échéance sous 30 jours' },
  compliance_stat_open_risk: { en: 'Open risk items', fr: 'Éléments à risque ouverts' },
  compliance_stat_provinces: { en: 'Provinces covered', fr: 'Provinces couvertes' },

  /* ── Obligation register ────────────────────────────────────────────────── */
  compliance_register: { en: 'Obligation register', fr: 'Registre des obligations' },
  compliance_oriented_note: {
    en: 'Compliance-oriented tracking — Dutiva does not certify or guarantee compliance.',
    fr: 'Suivi axé sur la conformité — Dutiva ne certifie ni ne garantit la conformité.',
  },
  compliance_owner: { en: 'Owner', fr: 'Responsable' },
  compliance_due: { en: 'Due', fr: 'Échéance' },
  compliance_recurrence: { en: 'Recurrence', fr: 'Récurrence' },
  compliance_evidence_recorded: {
    en: 'Evidence recorded just now — logged in the audit trail.',
    fr: 'Preuve consignée à l’instant — inscrite au journal d’audit.',
  },
  compliance_mark_evidence: { en: 'Mark evidence on file', fr: 'Consigner la preuve' },
  compliance_explain_advisor: { en: 'Explain with Advisor', fr: 'Expliquer avec le Conseiller' },
  compliance_audit_note: {
    en: 'Status changes and evidence records are captured in the audit log.',
    fr: 'Les changements d’état et les preuves consignées sont inscrits au journal d’audit.',
  },
  compliance_toast_evidence: {
    en: 'Evidence recorded — logged in the audit trail',
    fr: 'Preuve consignée — inscrite au journal d’audit',
  },

  /* ── Posture by area ────────────────────────────────────────────────────── */
  compliance_posture: { en: 'Posture by area', fr: 'Posture par domaine' },

  /* ── Active risk flags ──────────────────────────────────────────────────── */
  compliance_flags: { en: 'Active risk flags', fr: 'Signalements de risque actifs' },
  compliance_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  compliance_legislation: { en: 'Legislation', fr: 'Législation' },
  compliance_next_action: { en: 'Next action', fr: 'Prochaine action' },
  compliance_resolve_advisor: { en: 'Resolve with Advisor', fr: 'Résoudre avec le Conseiller' },

  /* ── Regulatory watchlist ───────────────────────────────────────────────── */
  compliance_watchlist: { en: 'Regulatory watchlist', fr: 'Veille réglementaire' },

  /* ── Advisor rail (prototype `explainObligation` / `askAdvisorAboutRisk`) ─ */
  compliance_explain_text: {
    en: 'Here’s what this obligation covers and why it’s tracked.',
    fr: 'Voici ce que couvre cette obligation et pourquoi elle est suivie.',
  },
  compliance_not_legal_advice: { en: 'Not legal advice', fr: 'Pas un avis juridique' },
  compliance_flag_rail_text: {
    en: 'Here’s the detail behind this flag, and what I’d do next.',
    // [FR self-authored]
    fr: 'Voici le détail derrière ce signalement, et ce que je ferais ensuite.',
  },
  compliance_open_full_case: { en: 'Open full case', fr: 'Ouvrir le dossier complet' },

  /* ── Production findings register (real persistence — no design-handoff
     counterpart; [FR self-authored] throughout) ─────────────────────────── */
  compliance_prod_add: { en: 'Log finding', fr: 'Consigner un constat' },
  compliance_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  compliance_prod_title_label: { en: 'Finding', fr: 'Constat' },
  compliance_prod_severity: { en: 'Severity', fr: 'Gravité' },
  compliance_prod_description: { en: 'Description (optional)', fr: 'Description (facultatif)' },
  compliance_prod_recommendation: {
    en: 'Recommendation (optional)',
    fr: 'Recommandation (facultatif)',
  },
  compliance_prod_save: { en: 'Save finding', fr: 'Enregistrer le constat' },
  compliance_prod_count_open: { en: 'open findings', fr: 'constats ouverts' },
  compliance_prod_count_open_one: { en: 'open finding', fr: 'constat ouvert' },
  compliance_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  compliance_prod_empty_title: {
    en: 'No findings yet',
    fr: 'Aucun constat pour l’instant',
  },
  compliance_prod_empty_body: {
    en: 'Log your first compliance finding, or let the Advisor surface them as your workspace grows.',
    fr: 'Consignez votre premier constat de conformité, ou laissez le Conseiller les relever à mesure que votre espace de travail grandit.',
  },
  compliance_prod_error: {
    en: 'Couldn’t load findings.',
    fr: 'Impossible de charger les constats.',
  },
  compliance_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  compliance_prod_added: { en: 'Finding logged', fr: 'Constat consigné' },
  compliance_prod_add_failed: {
    en: 'Couldn’t log the finding. Try again.',
    fr: 'Impossible de consigner le constat. Réessayez.',
  },
  compliance_prod_remove: { en: 'Remove', fr: 'Retirer' },
  compliance_prod_removed: { en: 'Finding removed', fr: 'Constat retiré' },
  compliance_prod_remove_failed: {
    en: 'Couldn’t remove the finding.',
    fr: 'Impossible de retirer le constat.',
  },
  compliance_prod_resolve: { en: 'Mark resolved', fr: 'Marquer comme résolu' },
  compliance_prod_reopen: { en: 'Reopen', fr: 'Rouvrir' },
  compliance_prod_resolved_chip: { en: 'Resolved', fr: 'Résolu' },
  compliance_prod_status_failed: {
    en: 'Couldn’t update the finding.',
    fr: 'Impossible de mettre à jour le constat.',
  },
  compliance_prod_rec_label: { en: 'Recommendation', fr: 'Recommandation' },
  compliance_prod_sev_info: { en: 'Info', fr: 'Info' },
  compliance_prod_sev_low: { en: 'Low', fr: 'Faible' },
  compliance_prod_sev_medium: { en: 'Medium', fr: 'Moyenne' },
  compliance_prod_sev_high: { en: 'High', fr: 'Élevée' },
  compliance_prod_sev_critical: { en: 'Critical', fr: 'Critique' },

  /* ── Obligation register (production, 0069) — all [FR self-authored] ────── */
  compliance_prod_ob_section: { en: 'Obligation register', fr: 'Registre des obligations' },
  compliance_prod_ob_add: { en: 'Add obligation', fr: 'Ajouter une obligation' },
  compliance_prod_ob_title_label: { en: 'Obligation', fr: 'Obligation' },
  compliance_prod_ob_area: { en: 'Area / statute', fr: 'Domaine / loi' },
  compliance_prod_ob_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  compliance_prod_ob_due: { en: 'Due date', fr: 'Échéance' },
  compliance_prod_ob_recurrence: { en: 'Recurrence', fr: 'Récurrence' },
  compliance_prod_ob_owner: { en: 'Owner', fr: 'Responsable' },
  compliance_prod_ob_status: { en: 'Status', fr: 'Statut' },
  compliance_prod_ob_evidence: { en: 'Evidence', fr: 'Preuve' },
  compliance_prod_ob_status_ok: { en: 'Evidence on file', fr: 'Preuve au dossier' },
  compliance_prod_ob_status_progress: { en: 'In progress', fr: 'En cours' },
  compliance_prod_ob_status_needs: { en: 'Needs evidence', fr: 'Preuve requise' },
  compliance_prod_ob_overdue_chip: { en: 'Overdue', fr: 'En retard' },
  compliance_prod_ob_due_label: { en: 'Due {date}', fr: 'Échéance : {date}' },
  compliance_prod_ob_empty: {
    en: 'No obligations yet. Track recurring statutory duties — reviews, filings, training — and the score reflects what has evidence on file.',
    fr: 'Aucune obligation pour l’instant. Suivez les obligations légales récurrentes — examens, dépôts, formations — et le score reflète ce qui a une preuve au dossier.',
  },
  compliance_prod_ob_added: { en: 'Obligation added.', fr: 'Obligation ajoutée.' },
  compliance_prod_ob_add_failed: {
    en: 'Could not add the obligation. Try again.',
    fr: 'Impossible d’ajouter l’obligation. Réessayez.',
  },
  compliance_prod_ob_status_failed: {
    en: 'Could not update the obligation status. Try again.',
    fr: 'Impossible de mettre à jour le statut de l’obligation. Réessayez.',
  },
  compliance_prod_ob_removed: { en: 'Obligation removed.', fr: 'Obligation supprimée.' },
  compliance_prod_ob_remove_failed: {
    en: 'Could not remove the obligation. Try again.',
    fr: 'Impossible de supprimer l’obligation. Réessayez.',
  },
  compliance_prod_ob_remove: { en: 'Remove obligation', fr: 'Supprimer l’obligation' },
})
