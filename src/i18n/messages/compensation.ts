import { defineMessages } from '../core'

/**
 * Compensation view — chrome strings from the prototype's
 * `buildCompensationView()` / `askAboutComp()` (App v2.dc.html) plus the
 * `lbl` entries it renders (annualPayroll, belowMidpoint, people, table
 * headers). EN verbatim; FR from the prototype's inline `L(en, fr)` pairs,
 * `buildI18n()` and `frDict()`. FR strings with no source in the prototype
 * are marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(compensationMessages.key)`.
 */
export const compensationMessages = defineMessages({
  comp_banner: {
    en: 'Restricted module — visible to Owner/Admin, HR Manager, and Finance roles. Access and changes are recorded in the audit log.',
    fr: 'Module restreint — visible pour les rôles Propriétaire/Admin, Responsable RH et Finances. Les accès et les changements sont consignés au journal d’audit.',
  },

  /* Stat tiles. */
  comp_annual_payroll: { en: 'Annual base payroll', fr: 'Masse salariale de base annuelle' },
  comp_below_midpoint: { en: 'Below market midpoint', fr: 'Sous le point milieu du marché' },
  comp_people: { en: 'People', fr: 'Personnes' },

  /* Section labels. */
  comp_changes_label: { en: 'Changes & approvals', fr: 'Changements et approbations' },
  comp_overview_label: { en: 'Compensation overview', fr: 'Aperçu de la rémunération' },
  comp_requested_by: { en: 'Requested by', fr: 'Demandé par' },
  comp_review_with_advisor: { en: 'Review with Advisor', fr: 'Réviser avec le Conseiller' },
  comp_separation_note: {
    en: 'Compensation data is never used for wellbeing, discipline, or performance inferences.',
    fr: 'Les données de rémunération ne servent jamais à des inférences sur le bien-être, la discipline ou le rendement.',
  },

  /* Overview table headers. */
  comp_th_name: { en: 'Name', fr: 'Nom' },
  comp_th_role: { en: 'Role', fr: 'Poste' },
  comp_th_band: { en: 'Band', fr: 'Échelle' },
  comp_th_base: { en: 'Base', fr: 'Base' },
  comp_th_vs_market: { en: 'vs market', fr: 'c. marché' },

  /* Change-review rail turn (prototype `ch.onReview`). */
  comp_change_review_intro: {
    en: 'Here’s where this change stands and what it needs before it can move.',
    fr: 'Voici où en est ce changement et ce qu’il lui faut pour avancer.',
  },
  comp_change_review_suffix: {
    en: 'HR/Finance review is recommended before any change is approved.',
    fr: 'Un examen RH/Finances est recommandé avant d’approuver tout changement.',
  },

  /* Per-employee pay rail (prototype `askAboutComp`). */
  comp_rail_title_suffix: { en: ' — pay', fr: ' — rémunération' }, // [FR self-authored]
  comp_below_title: { en: 'Below market midpoint', fr: 'Sous le point milieu du marché' },
  comp_within_title: { en: 'Within market band', fr: 'Dans la fourchette du marché' }, // [FR self-authored]
  comp_market_review_citation: {
    en: 'Internal compensation band framework',
    fr: 'Cadre interne d’échelons salariales',
  },
  comp_open_comp_tab: { en: 'Open compensation tab', fr: 'Ouvrir l’onglet Rémunération' },
  comp_context_topic: { en: 'Compensation review', fr: 'Examen de la rémunération' }, // [FR self-authored]

  /* A11y labels. */
  comp_open_aria: { en: 'Open compensation for', fr: 'Ouvrir la rémunération de' }, // [FR self-authored]
  comp_ask_aria: {
    en: 'Ask Advisor about pay',
    fr: 'Demander au Conseiller à propos de la rémunération', // [FR self-authored]
  },
  /* ── Production mode (real persistence, migration 0039) ──────────────────
     The demo's "vs market" column has no production equivalent: Dutiva has
     no salary-survey source, so the comparison here is against the band
     midpoint the employer enters themselves. [FR self-authored throughout.] */
  comp_prod_loading: { en: 'Loading compensation…', fr: 'Chargement de la rémunération…' },
  comp_prod_count_one: { en: 'record', fr: 'dossier' },
  comp_prod_count_many: { en: 'records', fr: 'dossiers' },
  comp_prod_add: { en: 'Add record', fr: 'Ajouter un dossier' },
  comp_prod_save: { en: 'Save', fr: 'Enregistrer' },
  comp_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  comp_prod_employee: { en: 'Employee', fr: 'Employé(e)' },
  comp_prod_base_salary: { en: 'Base salary', fr: 'Salaire de base' },
  comp_prod_band: { en: 'Pay band', fr: 'Échelle salariale' },
  comp_prod_band_midpoint: {
    en: 'Band midpoint (optional)',
    fr: 'Point milieu de l’échelle (facultatif)',
  },
  comp_prod_effective_date: { en: 'Effective date', fr: 'Date d’entrée en vigueur' },
  comp_prod_note: { en: 'Note', fr: 'Note' },
  comp_prod_vs_midpoint: { en: 'vs band midpoint', fr: 'par rapport au point milieu' },
  comp_prod_no_midpoint: { en: 'No midpoint set', fr: 'Aucun point milieu défini' },
  comp_prod_total_payroll: { en: 'Recorded base payroll', fr: 'Masse salariale de base consignée' },
  comp_prod_below_midpoint: {
    en: 'Below their band midpoint',
    fr: 'Sous le point milieu de leur échelle',
  },
  comp_prod_records: { en: 'Records', fr: 'Dossiers' },
  comp_prod_remove: { en: 'Remove', fr: 'Retirer' },
  comp_prod_added: { en: 'Compensation record added', fr: 'Dossier de rémunération ajouté' },
  comp_prod_add_failed: {
    en: 'Couldn’t add the record. Try again.',
    fr: 'Impossible d’ajouter le dossier. Réessayez.',
  },
  comp_prod_removed: { en: 'Record removed', fr: 'Dossier retiré' },
  comp_prod_remove_failed: {
    en: 'Couldn’t remove the record.',
    fr: 'Impossible de retirer le dossier.',
  },
  comp_prod_error: {
    en: 'Couldn’t load compensation records.',
    fr: 'Impossible de charger les dossiers de rémunération.',
  },
  comp_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  comp_prod_empty_title: { en: 'No compensation records yet', fr: 'Aucun dossier de rémunération' },
  comp_prod_empty_body: {
    en: 'Add a record for an employee to track base pay against your own bands.',
    fr: 'Ajoutez un dossier pour un(e) employé(e) afin de suivre le salaire de base par rapport à vos propres échelles.',
  },
  comp_prod_no_employees: {
    en: 'Add someone to your employee roster first — a compensation record belongs to a person.',
    fr: 'Ajoutez d’abord une personne à votre effectif — un dossier de rémunération appartient à une personne.',
  },
  /* The banner replaces the demo's audit-log claim, which the product does
     not yet make good on for this module. This one states only what the
     migration's RLS actually enforces. */
  comp_prod_banner: {
    en: 'Restricted module — only workspace owners and admins can read or change compensation records.',
    fr: 'Module restreint — seuls les propriétaires et administrateurs de l’espace de travail peuvent consulter ou modifier les dossiers de rémunération.',
  },
  comp_prod_market_note: {
    en: 'Comparisons use the band midpoint you enter. Dutiva does not supply market salary data.',
    fr: 'Les comparaisons utilisent le point milieu que vous saisissez. Dutiva ne fournit pas de données salariales de marché.',
  },
  comp_prod_edit: { en: 'Edit', fr: 'Modifier' },
  comp_prod_updated: { en: 'Record updated', fr: 'Dossier mis à jour' },
  comp_prod_update_failed: {
    en: 'Couldn’t update the record.',
    fr: 'Impossible de mettre à jour le dossier.',
  },
  comp_prod_delete_confirm: {
    en: 'Remove this compensation record?',
    fr: 'Retirer ce dossier de rémunération?',
  },
  comp_prod_delete_cancel: { en: 'Cancel', fr: 'Annuler' },
  comp_prod_confirm_delete: { en: 'Remove', fr: 'Retirer' },
  comp_prod_market_column: { en: 'Market comparison', fr: 'Comparaison au marché' },
  comp_prod_market_unavailable: {
    en: 'Dutiva does not supply market salary data.',
    fr: 'Dutiva ne fournit pas de données salariales de marché.',
  },
})
