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
  flows_step_of: { en: 'Step', fr: 'Étape' },
  flows_progress_aria: { en: 'Progress through this process', fr: 'Progression dans ce processus' },
  flows_watch_for: { en: 'Watch for', fr: 'À surveiller' },
  flows_your_path: { en: 'The path you took', fr: 'Le chemin parcouru' },
  flows_next_documents: {
    en: 'Document this in Document Studio',
    fr: 'Documentez-le dans le Studio de documents',
  },
  flows_open_template: { en: 'Open', fr: 'Ouvrir' },
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
