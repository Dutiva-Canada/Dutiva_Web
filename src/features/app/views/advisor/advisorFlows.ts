import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { ChatFlowKey } from '@/data'
import type { MemoryUsedRead } from '@/features/app/advisor/contract'
import type { ScenarioBanner } from './advisorScenarios'

/**
 * Advisor conversation-engine content that lives in the view (not entity
 * fixtures): flow routing, generated-thread titles, the termination quick
 * form, the fallback topic chips, the beta-estimator error turn, and the
 * per-flow jurisdiction context line. Ported from the prototype's
 * `routeFlowKeyFromText` / `titleForFlow` / `startFlow` / `handleFollowup`
 * and `docMetaFor` (jurisdiction strings).
 *
 * EN verbatim from `App v2.dc.html`; FR from its `frDict()` where present.
 * FR strings with no prototype source are marked [FR self-authored].
 */

export type FlowKeyOrFallback = ChatFlowKey | 'fallback'

/* -------------------------------------------------------------- flow router */

/** Prototype `routeFlowKeyFromText` — keyword routing for the home composer. */
export function routeFlowKeyFromText(text: string): FlowKeyOrFallback {
  const t = text.toLowerCase()
  if (
    t.includes('terminat') ||
    t.includes('dismiss') ||
    t.includes('layoff') ||
    t.includes('let go') ||
    t.includes('fire ')
  ) {
    return 'termination'
  }
  if (t.includes('offer') || t.includes('hire') || t.includes('hiring')) return 'hiring'
  if (t.includes('onboard')) return 'onboarding'
  if (
    t.includes('pip') ||
    t.includes('performance') ||
    t.includes('attendance') ||
    t.includes('warning')
  ) {
    return 'performance'
  }
  if (
    t.includes('accommodat') ||
    t.includes('disab') ||
    t.includes('illness') ||
    t.includes('medical')
  ) {
    return 'accommodation'
  }
  if (t.includes('polic') || t.includes('remote work')) return 'policy'
  return 'fallback'
}

/* --------------------------------------------------------- generated titles */

/** Prototype `titleForFlow` map. FR self-authored except 'New conversation'. */
export const flowTitles: Record<FlowKeyOrFallback, Bi> = {
  termination: bi('Termination — new case', 'Cessation d’emploi — nouveau dossier'),
  hiring: bi('Offer letter draft', 'Ébauche de lettre d’offre'),
  onboarding: bi('Onboarding setup', 'Configuration de l’intégration'),
  performance: bi('Performance concern', 'Préoccupation de rendement'),
  accommodation: bi('Accommodation request', 'Demande d’accommodement'),
  policy: bi('Policy question', 'Question de politique'),
  fallback: bi('New conversation', 'Nouvelle conversation'),
}

/* ------------------------------------------------------- jurisdiction line */

/**
 * Jurisdiction context line, always visible on an active conversation
 * (README: 'Jurisdiction context (e.g., "Ontario — ESA, 2000") is always
 * visible.'). Statute pairs from the prototype's `docMetaFor()` jurisdiction
 * rows; the fallback line is its base-meta jurisdiction row.
 */
export const flowJurisdictions: Record<FlowKeyOrFallback, Bi> = {
  termination: bi('Ontario — ESA, 2000', 'Ontario — LNE, 2000'),
  hiring: bi('Ontario — ESA, 2000', 'Ontario — LNE, 2000'),
  onboarding: bi(
    'Quebec — Charter of the French Language',
    'Québec — Charte de la langue française',
  ),
  performance: bi(
    'Ontario — ESA, 2000 + Human Rights Code',
    'Ontario — LNE, 2000 + Code des droits de la personne',
  ),
  accommodation: bi('Ontario — Human Rights Code', 'Ontario — Code des droits de la personne'),
  policy: bi('Multi-province', 'Multiprovincial'),
  fallback: bi('Confirm jurisdiction before use', 'Confirmer la compétence avant utilisation'),
}

/* ---------------------------------------------------------- fallback flow */

/** Prototype `startFlow('fallback')` intro. [FR self-authored] */
export const fallbackIntro: Bi = bi(
  'I want to make sure I point you in the right direction — could you tell me a bit more? For example:',
  'Je veux m’assurer de bien vous orienter — pouvez-vous m’en dire un peu plus? Par exemple :',
)

export interface SuggestChipSpec {
  label: Bi
  flowKey: FlowKeyOrFallback
}

/** Prototype fallback `suggestChips`. FR from frDict where present. */
export const fallbackChips: SuggestChipSpec[] = [
  { label: bi('Hiring & offers', 'Embauche et offres'), flowKey: 'hiring' }, // [FR self-authored]
  { label: bi('Onboarding', 'Intégration'), flowKey: 'onboarding' },
  { label: bi('Performance & PIPs', 'Rendement et PAR'), flowKey: 'performance' }, // [FR self-authored]
  { label: bi('Leave & accommodation', 'Congés et accommodement'), flowKey: 'accommodation' },
  { label: bi('Termination', 'Cessation d’emploi'), flowKey: 'termination' },
  { label: bi('Policies', 'Politiques'), flowKey: 'policy' },
]

/* ------------------------------------------------------- termination flow */

export interface QuickFormFieldSpec {
  key: string
  label: Bi
  /** Selected option, tracked by its EN string (the stable key). */
  value: string
  options: Bi[]
}

export interface QuickFormState {
  submitLabel: Bi
  fields: QuickFormFieldSpec[]
  submitted: boolean
}

export const terminationIntro = {
  text: bi(
    'Understood. To calculate this correctly and flag any risk, I need a few details.',
    'Compris. Pour bien calculer et signaler tout risque, j’ai besoin de quelques détails.',
  ),
  reasoning: [
    bi(
      'Jurisdiction: Ontario → ESA applies as the statutory floor.',
      'Compétence : Ontario → la LNE s’applique comme plancher légal.',
    ),
    bi(
      'Missing: employment type, tenure, reason, contract terms, union status.',
      'Manquant : type d’emploi, ancienneté, motif, clauses du contrat, statut syndical.',
    ),
  ],
}

/**
 * Termination intake quick form (prototype `startFlow('termination')`).
 * Field labels/options have no FR in the prototype except 'Full-time' and
 * 'Performance' — the rest is [FR self-authored].
 */
export function freshQuickForm(): QuickFormState {
  return {
    submitLabel: bi('Continue', 'Continuer'),
    submitted: false,
    fields: [
      {
        key: 'type',
        label: bi('Employment type', 'Type d’emploi'),
        value: 'Full-time',
        options: [
          bi('Full-time', 'Temps plein'),
          bi('Part-time', 'Temps partiel'),
          bi('Fixed-term', 'Durée déterminée'),
          bi('Independent contractor', 'Entrepreneur indépendant'),
        ],
      },
      {
        key: 'tenure',
        label: bi('Length of service', 'Ancienneté'),
        value: '5–10 years',
        options: [
          bi('Under 3 months', 'Moins de 3 mois'),
          bi('3 months–1 year', '3 mois à 1 an'),
          bi('1–3 years', '1 à 3 ans'),
          bi('3–5 years', '3 à 5 ans'),
          bi('5–10 years', '5 à 10 ans'),
          bi('10+ years', '10 ans et plus'),
        ],
      },
      {
        key: 'reason',
        label: bi('Reason for termination', 'Motif de la cessation d’emploi'),
        value: 'Restructuring / redundancy',
        options: [
          bi('Restructuring / redundancy', 'Restructuration / abolition de poste'),
          bi('Performance', 'Rendement'),
          bi('Misconduct (cause)', 'Inconduite (motif sérieux)'),
          bi('Attendance', 'Assiduité'),
          bi('Other', 'Autre'),
        ],
      },
      {
        key: 'contract',
        label: bi('Employment contract', 'Contrat de travail'),
        value: 'Written, no termination clause',
        options: [
          bi('Written, enforceable termination clause', 'Écrit, clause de cessation exécutoire'),
          bi('Written, no termination clause', 'Écrit, sans clause de cessation'),
          bi('No written contract', 'Aucun contrat écrit'),
          bi('Not sure', 'Incertain'),
        ],
      },
      {
        key: 'union',
        label: bi('Unionized role?', 'Poste syndiqué?'),
        value: 'No',
        options: [bi('No', 'Non'), bi('Yes', 'Oui')],
      },
    ],
  }
}

/**
 * Per-message extras the shared advisor `ChatMessage` doesn't carry:
 * document generate chips, follow-up chips, topic suggest chips, the
 * termination quick form (prototype message fields `docs` / `followups` /
 * `suggestChips` / `quickForm`), and the response-experience additions —
 * inline tone banner and the collect-jurisdiction province prompt
 * (`Advisor Response Experience.dc.html` turn fields `banner` /
 * `provincePrompt`).
 */
export interface MessageExtras {
  docs?: string[]
  /** Follow-up chip labels — EN strings keyed into `followupReplies`. */
  followups?: string[]
  suggestChips?: SuggestChipSpec[]
  /** Navigate-out chips when Advisor can’t do operational work in-chat. */
  navChips?: { label: Bi; to: string }[]
  quickForm?: QuickFormState
  banner?: ScenarioBanner
  /** Render the ask-for-province chips under this turn. */
  provincePrompt?: boolean
  /** Org memory used this turn — gold in-answer highlights in StreamedText. */
  memory?: MemoryUsedRead | null
  /** Commercial 429: offer prepaid reply packs under this turn. */
  advisorPackOffer?: boolean
}

/**
 * Assessment turn after the quick form submits (prototype `submitQuickForm`).
 * All FR from frDict.
 */
export const terminationAssessment = {
  text: bi("Here's the assessment for this case.", 'Voici l’évaluation pour ce dossier.'),
  reasoning: [
    bi(
      'Jurisdiction detected: Ontario (provincially regulated) — ESA, 2000 is the statutory floor.',
      'Compétence détectée : Ontario (réglementation provinciale) — la LNE de 2000 est le plancher légal.',
    ),
    bi(
      'No termination clause on file → common-law reasonable notice may apply beyond ESA minimums.',
      'Aucune clause de licenciement au dossier → le préavis raisonnable de common law peut s’appliquer au-delà des minimums LNE.',
    ),
    bi(
      "ESA minimum: 8 weeks' termination notice/pay; statutory severance may also apply if eligibility requirements are met.",
      'Minimum LNE : 8 semaines de préavis ou d’indemnité de licenciement; une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies.',
    ),
    bi(
      'Common law estimate for an 8-year, mid-level role: roughly 9–12 months.',
      'Estimation en common law pour un poste intermédiaire de 8 ans : environ 9 à 12 mois.',
    ),
  ],
  cards: [
    {
      tone: 'risk' as const,
      title: bi('Notice exposure risk', 'Risque d’exposition au préavis'),
      body: bi(
        'No termination clause on file. Preliminary entitlement is likely 9–12 months of pay in lieu of notice under common law — well beyond the 8-week ESA termination notice/pay minimum. Recommend legal review before an offer is made. This is compliance-oriented HR guidance, not legal advice.',
        'Aucune clause de licenciement au dossier. Le droit préliminaire est probablement de 9 à 12 mois d’indemnité en tenant lieu de préavis en common law — bien au-delà du minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. Un examen juridique est recommandé avant de faire une offre. Il s’agit de conseils RH axés sur la conformité, et non d’un avis juridique.',
      ),
      confidence: bi(
        'Moderate — assumes a standard mid-level role; confirm payroll size for severance eligibility.',
        'Modérée — suppose un poste intermédiaire standard; confirmez la masse salariale pour l’admissibilité à l’indemnité.',
      ),
      citations: [
        {
          label: bi(
            'ESA s.57 — Notice of termination',
            'LNE art. 57 — Préavis de cessation d’emploi',
          ),
        },
        { label: bi('ESA s.64 — Severance pay', 'LNE art. 64 — Indemnité de licenciement') },
      ],
    },
    {
      tone: 'warning' as const,
      title: bi(
        'Missing facts — confirm before acting',
        'Faits manquants — à confirmer avant d’agir',
      ),
      body: bi(
        'Signed employment agreement version; the ESA severance payroll calculation; treatment of bonus, commission, and benefits over the notice period; accrued vacation balance.',
        'Version signée du contrat d’emploi; calcul de la masse salariale pour l’indemnité LNE; traitement des primes, commissions et avantages pendant le préavis; solde de vacances accumulées.',
      ),
    },
  ],
  docs: ['Termination Letter', 'Full & Final Release', 'Offboarding Checklist'],
  followups: [
    'Estimate severance range',
    'Compare to PIP alternative',
    'Loop in employment counsel',
    'Run severance estimator (beta)',
  ],
}

/* --------------------------------------------------- beta estimator (error) */

/**
 * The 'Run severance estimator (beta)' follow-up — the designed error + retry
 * turn (prototype `handleFollowup`). [FR self-authored]
 */
export const estimatorFollowup = {
  labelEn: 'Run severance estimator (beta)',
  label: bi('Run severance estimator (beta)', 'Lancer l’estimateur d’indemnité (bêta)'),
  errorText: bi(
    'The severance estimator (beta) timed out before it could finish.',
    'L’estimateur d’indemnité (bêta) a expiré avant de pouvoir terminer.',
  ),
  retryText: bi(
    'Rough range: 9–12 months of pay in lieu of notice — consistent with the common-law estimate above. (Beta calculator recovered.)',
    'Fourchette approximative : 9 à 12 mois d’indemnité en tenant lieu de préavis — conforme à l’estimation en common law ci-dessus. (Le calculateur bêta s’est rétabli.)',
  ),
}

/* ----------------------------------------------------------- generic reply */

/** In-thread ack for free-form sends (prototype `sendComposer`). [FR self-authored] */
export const genericAck: Bi = bi(
  "Noted — I've added that to this case. I can generate a document, calculate an estimate, or loop in counsel whenever you're ready.",
  'Noté — je l’ai ajouté à ce dossier. Je peux générer un document, calculer une estimation ou impliquer un conseiller juridique dès que vous êtes prêt.',
)

/* ------------------------------------------------------ home topic starters */

export interface HomeSuggestionChip {
  label: Bi
  sub: Bi
  flowKey: FlowKeyOrFallback
  /** Seed user message the chip sends (prototype `suggestionChips`). */
  seed: Bi
}

/** Advisor home suggestion grid (prototype `renderVals` suggestionChips). */
export const homeSuggestionChips: HomeSuggestionChip[] = [
  {
    label: bi('Terminate an employee', 'Mettre fin à un emploi'),
    sub: bi('Ontario, BC, federal & more', 'Ontario, C.-B., fédéral et plus'),
    flowKey: 'termination',
    seed: bi(
      'I need to terminate an employee in Ontario.',
      'Je dois mettre fin à l’emploi d’un salarié en Ontario.',
    ),
  },
  {
    label: bi('Draft an offer letter', 'Rédiger une lettre d’offre'),
    sub: bi('Hiring & onboarding', 'Embauche et intégration'),
    flowKey: 'hiring',
    seed: bi(
      'Draft an offer letter for a Senior Analyst role in Ontario.',
      'Rédigez une lettre d’offre pour un poste d’analyste principal en Ontario.',
    ),
  },
  {
    label: bi('Set up onboarding', 'Configurer l’intégration'),
    sub: bi('New hire checklist', 'Liste pour nouvel employé'),
    flowKey: 'onboarding',
    seed: bi(
      'Set up onboarding for a new hire starting in Quebec.',
      'Configurez l’intégration d’un nouvel employé qui débute au Québec.',
    ),
  },
  {
    label: bi('Handle a performance issue', 'Gérer un problème de rendement'),
    sub: bi('PIP or warning', 'PAR ou avertissement'),
    flowKey: 'performance',
    seed: bi(
      "One of my employees has ongoing attendance issues — what's the right way to handle this?",
      'Un de mes employés a des problèmes d’assiduité persistants — quelle est la bonne façon de gérer cela?',
    ),
  },
  {
    label: bi('Manage an accommodation', 'Gérer un accommodement'),
    sub: bi('Leave & disability', 'Congé et invalidité'),
    flowKey: 'accommodation',
    seed: bi(
      'An employee disclosed a chronic illness and needs modified duties.',
      'Un employé a divulgué une maladie chronique et a besoin de tâches modifiées.',
    ),
  },
  {
    label: bi('Build a policy', 'Créer une politique'),
    sub: bi('Remote work, expenses…', 'Télétravail, dépenses…'),
    flowKey: 'policy',
    seed: bi(
      'We need a remote work policy — what should it cover?',
      'Nous avons besoin d’une politique de télétravail — que devrait-elle couvrir?',
    ),
  },
]
