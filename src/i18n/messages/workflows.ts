import { defineMessages } from '../core'

/**
 * Workflows view chrome — transcribed from the prototype's
 * `buildWorkflowsView()` (App v2.dc.html 4888–4903) and
 * `buildTerminationMap()` (4857–4886). EN/FR verbatim from the prototype.
 */
export const workflowsMessages = defineMessages({
  workflows_title: { en: 'Workflows', fr: 'Processus' },
  workflows_sub: {
    en: 'End-to-end HR outcomes — Advisor coordinates the steps, documents, records, and compliance impact.',
    fr: 'Des résultats RH de bout en bout — le Conseiller coordonne les étapes, les documents, les dossiers et l’impact sur la conformité.',
  },
  workflows_prod_intro: {
    en: 'The in-flight list, termination map, and start-a-workflow catalogue are Northgate demo fixtures — switch to Demo in Settings to explore them. Guided processes above are the live workflows in your production workspace.',
    fr: 'La liste en cours, la carte de cessation et le catalogue de démarrage sont des données d’exemple Northgate — passez en mode Démo dans les paramètres pour les explorer. Les processus guidés ci-dessus sont les flux actifs dans votre espace de production.', // [FR self-authored]
  },
  workflows_inflight_title: { en: 'In flight', fr: 'En cours' },
  workflows_start_title: { en: 'Start a workflow', fr: 'Démarrer un processus' },
  workflows_next: { en: 'Next', fr: 'Prochaine étape' },
  workflows_continue: { en: 'Continue', fr: 'Continuer' },
  workflows_flagship_eyebrow: { en: 'Flagship workflow', fr: 'Processus phare' },
  workflows_flagship_title: {
    en: 'Termination — Jordan Mensah',
    fr: 'Cessation d’emploi — Jordan Mensah',
  },
  workflows_flagship_sub: {
    en: 'Ontario · step 4 of 9 · Advisor coordinates every stage, document, and approval',
    fr: 'Ontario · étape 4 sur 9 · le Conseiller coordonne chaque étape, document et approbation',
  },
  workflows_flagship_collapse: { en: 'Collapse', fr: 'Réduire' },
  workflows_flagship_expand: { en: 'View all 9 stages', fr: 'Voir les 9 étapes' },
  workflows_flagship_note: {
    en: 'Compliance-oriented guidance — legal review recommended at the flagged stages. Dutiva does not provide legal advice.',
    fr: 'Guidance axée sur la conformité — examen juridique recommandé aux étapes signalées. Dutiva ne fournit pas d’avis juridiques.',
  },
  workflows_flagship_cta: { en: 'Continue this workflow', fr: 'Continuer ce processus' },
  workflows_chip_done: { en: 'Done', fr: 'Fait' },
  workflows_chip_in_progress: { en: 'In progress', fr: 'En cours' },
  workflows_chip_partial: { en: '2 of 4 drafted', fr: '2 doc. sur 4' },
  workflows_chip_waiting: { en: 'Waiting', fr: 'En attente' },
  workflows_chip_upcoming: { en: 'Upcoming', fr: 'À venir' },
  workflows_chip_continuous: { en: 'Continuous', fr: 'Continu' },
})
