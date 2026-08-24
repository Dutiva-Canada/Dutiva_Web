import { defineMessages } from '../core'

/**
 * Guided flows — the runner chrome. No prototype counterpart: this surface
 * did not exist in the App v2 handoff (docs/FOUR_RING_FRAMEWORK.md), so every
 * string here is authored, and all FR is [FR self-authored] Québec French.
 *
 * Flow *content* — steps, options, outcomes — lives with the flow in
 * `src/features/app/flows/data/`, not here. Only the frame is shared.
 */
export const flowsMessages = defineMessages({
  flows_section_label: { en: 'Guided processes', fr: 'Processus guidés' },
  flows_section_intro: {
    en: 'Step-by-step processes and entitlement gates that end in a document — not just advice. Calculator-style tools stay inside the workspace; they are not public marketing pages.',
    fr: 'Des processus étape par étape et des filtres d’admissibilité qui aboutissent à un document — pas de simples conseils. Les outils de type calculateur restent dans l’espace de travail; ce ne sont pas des pages marketing publiques.',
  },
  flows_section_calculators: { en: 'Calculators', fr: 'Calculateurs' }, // [FR self-authored]
  flows_section_calculators_intro: {
    en: 'Entitlement gates and amount estimates for notice and severance. Figures stay inside the workspace — never on public marketing pages.',
    fr: 'Filtres d’admissibilité et estimations pour le préavis et l’indemnité. Les chiffres restent dans l’espace de travail — jamais sur les pages marketing publiques.', // [FR self-authored]
  },
  flows_section_guides: { en: 'Process guides', fr: 'Guides de processus' }, // [FR self-authored]
  flows_section_guides_intro: {
    en: 'Checklists and decision trees that walk a situation and hand off to a document in Studio.',
    fr: 'Listes de contrôle et arbres de décision qui balisent une situation et renvoient vers un document dans le Studio.', // [FR self-authored]
  },
  flows_minutes: { en: 'min', fr: 'min' },
  flows_start: { en: 'Start', fr: 'Commencer' },
  flows_continue: { en: 'Continue', fr: 'Continuer' },
  flows_input_submit: { en: 'Look up', fr: 'Repérer' },
  flows_input_placeholder: { en: 'e.g. 36', fr: 'ex. 36' },
  flows_input_invalid: {
    en: 'Enter a valid non-negative number.',
    fr: 'Entrez un nombre valide non négatif.',
  },
  flows_back: { en: 'Back', fr: 'Retour' },
  flows_restart: { en: 'Start over', fr: 'Recommencer' },
  flows_restart_confirm: {
    en: 'Start this process over? Your answers so far will be cleared.',
    fr: 'Recommencer ce processus? Vos réponses jusqu’ici seront effacées.', // [FR self-authored]
  },
  flows_step_of: { en: 'Step', fr: 'Étape' },
  flows_step_of_sep: { en: 'of', fr: 'sur' }, // [FR self-authored]
  flows_progress_aria: { en: 'Progress through this process', fr: 'Progression dans ce processus' },
  flows_watch_for: { en: 'Watch for', fr: 'À surveiller' },
  flows_your_path: { en: 'The path you took', fr: 'Le chemin parcouru' },
  flows_next_documents: {
    en: 'Document this in Document Studio',
    fr: 'Documentez-le dans le Studio de documents',
  },
  flows_open_template: { en: 'Generate', fr: 'Générer' }, // [FR self-authored]
  flows_pin_notice_on: {
    en: 'Ontario statutory notice',
    fr: 'Préavis légal de l’Ontario', // [FR self-authored]
  },
  flows_pin_severance: {
    en: 'Ontario severance eligibility',
    fr: 'Admissibilité à l’indemnité (Ontario)', // [FR self-authored]
  },
  flows_pin_accommodate: {
    en: 'Duty to accommodate',
    fr: 'Obligation d’adaptation', // [FR self-authored]
  },
  flows_no_document: {
    en: 'No document to open',
    fr: 'Aucun document à ouvrir',
  },
  flows_not_found: {
    en: 'That process does not exist.',
    fr: 'Ce processus n’existe pas.',
  },
  flows_back_to_workflows: { en: 'Back to workflows', fr: 'Retour aux processus' },
  flows_score_label: { en: 'Your score', fr: 'Votre score' },
  flows_score_of: { en: 'of', fr: 'sur' },
  flows_by_factor: { en: 'By factor', fr: 'Par facteur' },
  flows_by_factor_intro: {
    en: 'Lowest first — a strong average can still hide a factor people are living with.',
    fr: 'Du plus faible au plus élevé — une bonne moyenne peut masquer un facteur que les gens subissent.',
  },
  flows_record_note: {
    en: 'This is a record of how the decision was reached, not the decision itself. The documents below are what goes on the file.',
    fr: 'Ceci consigne la façon dont la décision a été prise, non la décision elle-même. Les documents ci-dessous sont ce qui est versé au dossier.',
  },
})
