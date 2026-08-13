import { bi } from '@/i18n/core'

import type { Article } from './articleModel'

/**
 * `/blog/<slug>` (EN) and `/fr/blogue/<frSlug>` (FR).
 *
 * These topics are deliberately distinct from `guideArticles.ts`: the guides
 * cover the employment-law fundamentals (notice, probation, contracts,
 * accommodation, documentation), while the blog covers jurisdiction scope,
 * policy and record-keeping obligations, leaves, and harassment prevention.
 * Keeping the two sets disjoint is an SEO requirement, not a preference —
 * before this split both indexes listed the same six topics, and giving each
 * a URL would have shipped duplicate pages competing with one another.
 *
 * Same editorial rules as the guides (see `articleModel.ts`): concepts and
 * decision points, no published statutory figures, never legal advice.
 */
export const BLOG_ARTICLES: readonly Article[] = [
  {
    slug: 'quebec-employment-standards',
    frSlug: 'normes-du-travail-quebec',
    collection: 'blog',
    topic: bi('Jurisdictions', 'Compétences'),
    readingMinutes: 4,
    updated: '2026-08-01',
    title: bi(
      'Quebec employment standards: what differs from Ontario',
      'Normes du travail au Québec : ce qui diffère de l’Ontario',
    ),
    summary: bi(
      'Quebec’s employment regime is not Ontario’s with a different vocabulary. The differences that most often catch employers expanding into Quebec, and where to look them up.',
      'Le régime d’emploi québécois n’est pas celui de l’Ontario avec un autre vocabulaire. Les différences qui surprennent le plus souvent les employeurs qui s’implantent au Québec, et où les vérifier.',
    ),
  },
  {
    slug: 'federally-regulated-workplaces',
    frSlug: 'entreprises-de-competence-federale',
    collection: 'blog',
    topic: bi('Jurisdictions', 'Compétences'),
    readingMinutes: 4,
    updated: '2026-08-01',
    title: bi(
      'Is your workplace federally regulated?',
      'Votre entreprise est-elle de compétence fédérale?',
    ),
    summary: bi(
      'A small share of Canadian employers fall under the Canada Labour Code instead of provincial standards — and applying the wrong regime affects nearly every HR obligation you have.',
      'Une petite proportion d’employeurs canadiens relèvent du Code canadien du travail plutôt que des normes provinciales — et appliquer le mauvais régime touche presque toutes vos obligations RH.',
    ),
  },
  {
    slug: 'workplace-policies-canada',
    frSlug: 'politiques-en-milieu-de-travail',
    collection: 'blog',
    topic: bi('Policies', 'Politiques'),
    readingMinutes: 4,
    updated: '2026-08-01',
    title: bi(
      'Workplace policies Canadian employers are expected to maintain',
      'Politiques que les employeurs canadiens doivent tenir à jour',
    ),
    summary: bi(
      'Which written policies are actually required rather than merely advisable, and why an unmaintained policy can be worse for an employer than none at all.',
      'Quelles politiques écrites sont réellement obligatoires plutôt que simplement souhaitables, et pourquoi une politique non tenue à jour peut nuire davantage à un employeur que l’absence de politique.',
    ),
  },
  {
    slug: 'employment-record-keeping',
    frSlug: 'conservation-des-dossiers-d-emploi',
    collection: 'blog',
    topic: bi('Records', 'Dossiers'),
    readingMinutes: 4,
    updated: '2026-08-01',
    title: bi(
      'Employment record-keeping and retention in Canada',
      'Tenue et conservation des dossiers d’emploi au Canada',
    ),
    summary: bi(
      'Employers are required to keep certain employment records — and separately required not to keep personal information longer than they need it. Reconciling the two.',
      'Les employeurs doivent conserver certains dossiers d’emploi — et doivent par ailleurs ne pas conserver de renseignements personnels plus longtemps que nécessaire. Comment concilier les deux.',
    ),
  },
  {
    slug: 'job-protected-leaves',
    frSlug: 'conges-proteges',
    collection: 'blog',
    topic: bi('Leaves', 'Congés'),
    readingMinutes: 4,
    updated: '2026-08-01',
    title: bi(
      'Job-protected leaves across Canadian jurisdictions',
      'Congés protégés dans les compétences canadiennes',
    ),
    summary: bi(
      'Job protection, income replacement, and benefit continuation are three separate questions. Employers get into trouble by answering only one of them.',
      'La protection de l’emploi, le remplacement du revenu et le maintien des avantages sociaux sont trois questions distinctes. Les employeurs s’exposent en n’en traitant qu’une seule.',
    ),
  },
  {
    slug: 'harassment-prevention-obligations',
    frSlug: 'prevention-du-harcelement',
    collection: 'blog',
    topic: bi('Workplace safety', 'Sécurité au travail'),
    readingMinutes: 4,
    updated: '2026-08-01',
    title: bi(
      'Workplace harassment and violence prevention obligations',
      'Obligations de prévention du harcèlement et de la violence au travail',
    ),
    summary: bi(
      'Prevention obligations are procedural: a written policy, an assessment, training, and an investigation process you actually run when a complaint arrives.',
      'Les obligations de prévention sont de nature procédurale : une politique écrite, une évaluation, de la formation et un processus d’enquête réellement appliqué lorsqu’une plainte survient.',
    ),
  },
] as const
