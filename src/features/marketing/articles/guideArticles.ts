import { bi } from '@/i18n/core'

import type { Article } from './articleModel'

/**
 * `/guides/<slug>` (EN) and `/fr/guides/<frSlug>` (FR) — evergreen reference
 * guides for Canadian employers. See `articleModel.ts` for the editorial rules
 * these follow, in particular the deliberate absence of statutory figures.
 *
 * `/guides/template-usage` is a separate registry route (a product how-to
 * rather than an employment-law guide), so `template-usage` must never appear
 * as a slug here — the static route would shadow it.
 */
export const GUIDE_ARTICLES: readonly Article[] = [
  {
    slug: 'ontario-termination-notice',
    frSlug: 'preavis-de-cessation-d-emploi-ontario',
    collection: 'guide',
    topic: bi('Termination', 'Cessation d’emploi'),
    readingMinutes: 7,
    updated: '2026-08-01',
    title: bi(
      'Ontario termination notice requirements',
      'Exigences de préavis de cessation d’emploi en Ontario',
    ),
    summary: bi(
      'How statutory notice, pay in lieu, and severance fit together for Ontario employers — and why the Employment Standards Act is a floor rather than a ceiling.',
      'Comment s’articulent le préavis légal, l’indemnité en tenant lieu et l’indemnité de licenciement pour les employeurs ontariens — et pourquoi la Loi sur les normes d’emploi est un plancher et non un plafond.',
    ),
  },
  {
    slug: 'probation-clauses-ontario',
    frSlug: 'clauses-de-probation-ontario',
    collection: 'guide',
    topic: bi('Hiring', 'Embauche'),
    readingMinutes: 5,
    updated: '2026-08-01',
    title: bi('Probation clauses in Ontario', 'Clauses de probation en Ontario'),
    summary: bi(
      'What a probation clause actually does under Ontario law, the assumptions that make one unenforceable, and how to run a probationary period that holds up.',
      'Ce qu’une clause de probation accomplit réellement en droit ontarien, les hypothèses qui la rendent inapplicable, et comment mener une période de probation qui tient la route.',
    ),
  },
  {
    slug: 'employer-document-checklist',
    frSlug: 'liste-de-documents-employeur',
    collection: 'guide',
    topic: bi('Documentation', 'Documentation'),
    readingMinutes: 5,
    updated: '2026-08-01',
    title: bi(
      'Canadian employer document checklist',
      'Liste de documents pour les employeurs canadiens',
    ),
    summary: bi(
      'The core HR documents to have in place before a new employee’s first day, and why assembling them late is harder than assembling them early.',
      'Les documents RH essentiels à avoir en place avant la première journée d’un nouvel employé, et pourquoi les réunir tard est plus difficile que de les réunir tôt.',
    ),
  },
  {
    slug: 'employment-contract-clauses',
    frSlug: 'clauses-contractuelles-d-emploi',
    collection: 'guide',
    topic: bi('Contracts', 'Contrats'),
    readingMinutes: 5,
    updated: '2026-08-01',
    title: bi('Employment contract clauses in Canada', 'Clauses contractuelles d’emploi au Canada'),
    summary: bi(
      'The clauses that decide what an employment relationship costs to end, why Canadian courts read them strictly, and the drafting habits that get them struck down.',
      'Les clauses qui déterminent le coût de la fin d’une relation d’emploi, pourquoi les tribunaux canadiens les interprètent strictement, et les habitudes de rédaction qui les font invalider.',
    ),
  },
  {
    slug: 'duty-to-accommodate',
    frSlug: 'obligation-d-accommodement',
    collection: 'guide',
    topic: bi('Accommodation', 'Accommodement'),
    readingMinutes: 5,
    updated: '2026-08-01',
    title: bi('Duty to accommodate in Canada', 'Obligation d’accommodement au Canada'),
    summary: bi(
      'What the duty to accommodate requires of employers, how the undue-hardship limit actually works, and the process failures that cause most findings against employers.',
      'Ce que l’obligation d’accommodement exige des employeurs, comment fonctionne réellement la limite de la contrainte excessive, et les manquements de procédure à l’origine de la plupart des décisions défavorables aux employeurs.',
    ),
  },
  {
    slug: 'termination-documentation',
    frSlug: 'documentation-de-cessation-d-emploi',
    collection: 'guide',
    topic: bi('Termination', 'Cessation d’emploi'),
    readingMinutes: 5,
    updated: '2026-08-01',
    title: bi(
      'Termination documentation in Canada',
      'Documentation de cessation d’emploi au Canada',
    ),
    summary: bi(
      'What to prepare before a termination meeting, what to record during it, and the documentation habits that most often damage an employer’s position afterwards.',
      'Ce qu’il faut préparer avant une rencontre de cessation d’emploi, ce qu’il faut consigner pendant, et les habitudes de documentation qui nuisent le plus souvent à la position de l’employeur par la suite.',
    ),
  },
] as const
