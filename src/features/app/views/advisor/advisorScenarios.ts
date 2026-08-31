import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { advisorWorkspaceMessages } from '@/i18n/messages/advisorWorkspace'
import type { AdvisorResponse } from '@/features/app/advisor/contract'

/**
 * The six demonstrated response modes from the Advisor chat handoff
 * (`docs/design-handoff-advisor-chat/` — `Advisor Response Experience.dc.html`
 * `scenarios()`; `AGENT.md` is the normative spec these turns follow): HR
 * compliance (termination), high-risk escalation, HR accommodation,
 * jurisdiction-unknown, supportive triage, and current-info with live web
 * sources.
 *
 * These are the signed-out / engine-unavailable preview conversations and the
 * reference fixtures for the response contract — the live engine returns the
 * same `AdvisorResponse` shape (see `advisor/contract.ts`). EN verbatim from
 * the prototype; FR [self-authored] (the prototype's FR toggle is decorative).
 */

export type ScenarioId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6'

export type ScenarioBannerTone = 'risk' | 'info' | 'support'

export interface ScenarioBanner {
  tone: ScenarioBannerTone
  title: Bi
  text: Bi
}

/** One advisor reply plus the structured payload the engine returned for it. */
export interface ScenarioTurn {
  reply: Bi
  banner?: ScenarioBanner
  /** Suggested-document chips — keys into `documentTemplatesByKey`. */
  docs?: string[]
  /** Follow-up chip labels — EN strings keyed into `followupReplies`. */
  followups?: string[]
  /** Ask-for-province chips render under this turn (jurisdiction unknown). */
  provincePrompt?: boolean
  /** Jurisdiction context pill above the transcript. */
  jurisdictionLine: Bi
  response: AdvisorResponse
}

export interface AdvisorScenario {
  id: ScenarioId
  title: Bi
  pinned: boolean
  user: Bi
  turn: ScenarioTurn
  /** s4 only — the turn after the user confirms a province. */
  resolved?: ScenarioTurn
  /** s6 only — the bounded, safe turn when web search is toggled off. */
  webOff?: ScenarioTurn
}

/* ------------------------------------------------------------ shared bits */

const HYBRID_GATES = {
  workspaceAllowed: true,
  retrievalAllowed: true,
  legalBasisAllowed: true,
  documentsAllowed: true,
  webSearchAllowed: false,
}

const DISCLAIMER = bi(
  'This is compliance-oriented HR guidance, not legal advice.',
  'Il s’agit de conseils RH axés sur la conformité, et non d’un avis juridique.',
)

const joinDisclaimer = (en: string, fr: string): Bi =>
  bi(`${en}\n\n${DISCLAIMER.en}`, `${fr}\n\n${DISCLAIMER.fr}`)

/* -------------------------------------------------------------- scenarios */

const s1: AdvisorScenario = {
  id: 's1',
  title: bi('Termination — Ontario, no clause', 'Licenciement — Ontario, sans clause'),
  pinned: true,
  user: bi(
    "I need to terminate a full-time employee in Ontario — 8 years' service, no termination clause in their contract. What's our exposure?",
    'Je dois licencier un salarié à temps plein en Ontario — 8 ans de service, aucune clause de licenciement dans son contrat. Quelle est notre exposition?',
  ),
  turn: {
    reply: joinDisclaimer(
      "Here's how this looks. In Ontario the ESA sets the statutory floor — for 8 years' service that's 8 weeks' termination notice/pay; statutory severance may also apply if eligibility requirements are met. With no termination clause on file, common-law reasonable notice likely governs, and for a mid-level 8-year role that's roughly 9–12 months of pay in lieu. I'd get employment counsel to review before any offer goes out.",
      'Voici le portrait. En Ontario, la LNE fixe le plancher légal — pour 8 ans de service, c’est 8 semaines de préavis ou d’indemnité de licenciement; une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies. Sans clause de licenciement au dossier, le préavis raisonnable de common law s’applique probablement, et pour un poste intermédiaire de 8 ans, cela représente environ 9 à 12 mois d’indemnité. Je ferais réviser le dossier par un conseiller juridique en droit du travail avant toute offre.',
    ),
    docs: ['Termination Letter', 'Full & Final Release', 'Offboarding Checklist'],
    followups: [
      'Estimate notice exposure',
      'Compare to PIP alternative',
      'Loop in employment counsel',
    ],
    jurisdictionLine: bi('Ontario — ESA, 2000', 'Ontario — LNE, 2000'),
    response: {
      route: { responseMode: 'hr', ...HYBRID_GATES },
      jurisdiction: {
        status: 'known',
        value: bi('Ontario · Provincially regulated', 'Ontario · Réglementation provinciale'),
        note: bi(
          'ESA, 2000 applies as the statutory floor.',
          'La LNE de 2000 s’applique comme plancher légal.',
        ),
      },
      risk: { compliance: 'high', safety: 'none' },
      professionalReview: {
        type: 'legal',
        label: bi(
          'Recommended: employment counsel',
          'Recommandé : conseiller juridique en droit du travail',
        ),
        reason: bi(
          'No termination clause on file — common-law exposure well beyond ESA minimums.',
          'Aucune clause de licenciement au dossier — exposition en common law bien au-delà des minimums LNE.',
        ),
      },
      supportNotice: false,
      legalBasis: {
        items: [
          {
            label: bi(
              'ESA s.57 — Notice of termination',
              'LNE art. 57 — Préavis de cessation d’emploi',
            ),
            valid: true,
          },
          {
            label: bi('ESA s.64 — Severance pay', 'LNE art. 64 — Indemnité de licenciement'),
            valid: true,
          },
          {
            label: bi(
              'Common-law reasonable notice — Bardal factors',
              'Préavis raisonnable de common law — facteurs Bardal',
            ),
            valid: false,
          },
        ],
      },
      retrieval: {
        items: [
          bi('Termination · ON', 'Licenciement · ON'),
          bi('Severance · ESA threshold', 'Indemnité · seuil LNE'),
        ],
      },
      memory: {
        items: [
          {
            factId: 'demo-tenure',
            label: bi("8 years' service", '8 ans de service'),
          },
          {
            factId: 'demo-clause',
            label: bi('no termination clause on file', 'aucune clause de licenciement au dossier'),
          },
          {
            factId: 'demo-notice',
            label: bi('9–12 months', '9 à 12 mois'),
          },
        ],
        note: bi(
          'Demo memory — not a statutory source. Confirm or correct in Settings → Memory.',
          'Mémoire démo — pas une source législative. Confirmez ou corrigez dans Réglages → Mémoire.',
        ),
      },
      webSearch: null,
      confidence: {
        label: bi('Moderate', 'Modérée'),
        pct: 62,
        note: bi(
          'Assumes a standard mid-level role; confirm payroll size for severance eligibility.',
          'Suppose un poste intermédiaire standard; confirmez la masse salariale pour l’admissibilité à l’indemnité.',
        ),
      },
      warnings: [
        bi(
          '1 raw citation was unvetted and withheld from legal basis (surfaced as “needs review”).',
          '1 citation brute non vérifiée a été retenue hors du fondement juridique (affichée comme « à réviser »).',
        ),
      ],
      isCrisis: false,
    },
  },
}

const s2: AdvisorScenario = {
  id: 's2',
  title: bi('Harassment complaint — next steps', 'Plainte de harcèlement — prochaines étapes'),
  pinned: false,
  user: bi(
    'An employee just filed a harassment complaint against their manager. What do we do first?',
    'Un employé vient de déposer une plainte de harcèlement contre son gestionnaire. Que faisons-nous en premier?',
  ),
  turn: {
    reply: joinDisclaimer(
      "This is a high-risk situation that needs a careful, documented process. First, make sure the complainant is safe and separate the parties if there's any risk of ongoing contact. In Ontario the OHSA requires you to investigate workplace-harassment complaints and protects the complainant from reprisal. Keep it confidential, appoint an impartial investigator, and document every step. Given the legal exposure, involve employment counsel early.",
      'Il s’agit d’une situation à risque élevé qui exige un processus rigoureux et documenté. D’abord, assurez la sécurité de la personne plaignante et séparez les parties s’il existe un risque de contact continu. En Ontario, la LSST vous oblige à enquêter sur les plaintes de harcèlement au travail et protège la personne plaignante contre les représailles. Préservez la confidentialité, nommez un enquêteur impartial et documentez chaque étape. Vu l’exposition juridique, impliquez un conseiller juridique tôt dans le processus.',
    ),
    banner: {
      tone: 'risk',
      title: bi('High-risk escalation. ', 'Escalade à risque élevé. '),
      text: bi(
        'Reprisal and investigation duties apply — bring in counsel before acting.',
        'Des obligations d’enquête et de protection contre les représailles s’appliquent — consultez un conseiller juridique avant d’agir.',
      ),
    },
    followups: [
      'Draft an investigation plan',
      'Assign an impartial investigator',
      'Open a case file',
    ],
    jurisdictionLine: bi(
      'Ontario — OHSA + Human Rights Code',
      'Ontario — LSST + Code des droits de la personne',
    ),
    response: {
      route: { responseMode: 'escalation', ...HYBRID_GATES },
      jurisdiction: {
        status: 'known',
        value: bi('Ontario · Provincially regulated', 'Ontario · Réglementation provinciale'),
        note: bi(
          'OHSA harassment-investigation duty engaged.',
          'Obligation d’enquête sur le harcèlement de la LSST enclenchée.',
        ),
      },
      risk: { compliance: 'high', safety: 'watch' },
      professionalReview: {
        type: 'legal',
        label: bi(
          'Recommended: employment counsel',
          'Recommandé : conseiller juridique en droit du travail',
        ),
        reason: bi(
          'Harassment complaint with investigation and anti-reprisal obligations.',
          'Plainte de harcèlement avec obligations d’enquête et de protection contre les représailles.',
        ),
      },
      supportNotice: false,
      legalBasis: {
        items: [
          {
            label: bi(
              'OHSA s.32.0.7 — Duty to investigate',
              'LSST art. 32.0.7 — Obligation d’enquêter',
            ),
            valid: true,
          },
          {
            label: bi(
              'OHSA s.50 — Anti-reprisal protection',
              'LSST art. 50 — Protection contre les représailles',
            ),
            valid: true,
          },
          {
            label: bi(
              'Human Rights Code s.5 — Harassment',
              'Code des droits de la personne art. 5 — Harcèlement',
            ),
            valid: true,
          },
        ],
      },
      retrieval: {
        items: [
          bi('Harassment · ON', 'Harcèlement · ON'),
          bi('Investigation · OHSA', 'Enquête · LSST'),
        ],
      },
      webSearch: null,
      confidence: { label: bi('High', 'Élevée'), pct: 84 },
      warnings: [],
      isCrisis: false,
    },
  },
}

const s3: AdvisorScenario = {
  id: 's3',
  title: bi('Medical accommodation request', 'Demande d’accommodement médical'),
  pinned: false,
  user: bi(
    "An employee gave us a doctor's note and asked for modified duties. What can we ask for, and what are our obligations?",
    'Un employé nous a remis un billet médical et demande des tâches modifiées. Que pouvons-nous demander, et quelles sont nos obligations?',
  ),
  turn: {
    reply: joinDisclaimer(
      "Treat this as an accommodation matter, not a performance one. You're entitled to functional information — what the employee can and can't do, and any restrictions — but not their diagnosis or underlying medical details. Keep it confidential and separate from the personnel file. You have a duty to accommodate to the point of undue hardship, which usually means exploring modified duties or a graduated return. Document the functional limitations and a review date, and don't take any adverse action tied to the disclosure.",
      'Traitez ce dossier comme un accommodement, pas comme un enjeu de rendement. Vous avez droit à l’information fonctionnelle — ce que l’employé peut et ne peut pas faire, et les restrictions — mais pas au diagnostic ni aux détails médicaux. Gardez le tout confidentiel et séparé du dossier du personnel. Vous avez une obligation d’accommodement jusqu’à la contrainte excessive, ce qui signifie habituellement des tâches modifiées ou un retour progressif. Documentez les limitations fonctionnelles et une date de révision, et ne prenez aucune mesure défavorable liée à la divulgation.',
    ),
    followups: [
      'Draft accommodation inquiry first',
      'What counts as undue hardship?',
      'Set a functional-review date',
    ],
    jurisdictionLine: bi('Ontario — Human Rights Code', 'Ontario — Code des droits de la personne'),
    response: {
      route: { responseMode: 'hr', ...HYBRID_GATES },
      jurisdiction: {
        status: 'known',
        value: bi('Ontario · Human Rights Code', 'Ontario · Code des droits de la personne'),
        note: bi(
          'Duty to accommodate to undue hardship.',
          'Obligation d’accommodement jusqu’à la contrainte excessive.',
        ),
      },
      risk: { compliance: 'medium', safety: 'none' },
      professionalReview: {
        type: 'medical',
        label: bi('Suggested: occupational-health input', 'Suggéré : avis en santé au travail'),
        reason: bi(
          'Functional-information limits and modified-duty design; not a legal escalation.',
          'Limites de l’information fonctionnelle et conception des tâches modifiées; pas une escalade juridique.',
        ),
      },
      supportNotice: false,
      legalBasis: {
        items: [
          {
            label: bi(
              'BC Human Rights Code s.13 — Employment',
              'Human Rights Code (C.-B.) art. 13 — Emploi',
            ),
            valid: true,
          },
          {
            label: bi(
              'Duty to accommodate — Meiorin test',
              'Obligation d’accommodement — critère Meiorin',
            ),
            valid: false,
          },
        ],
      },
      retrieval: {
        items: [
          bi('Accommodation', 'Accommodement'),
          bi('Medical disclosure', 'Divulgation médicale'),
        ],
        note: bi(
          'Termination, leave and severance items were withheld by the topic-alignment filter.',
          'Les éléments sur la cessation, les congés et l’indemnité ont été retenus par le filtre d’alignement thématique.',
        ),
      },
      webSearch: null,
      confidence: { label: bi('Moderate–high', 'Modérée à élevée'), pct: 72 },
      warnings: [
        bi(
          'Retrieved guidance for unrelated topics was withheld (topic-alignment filter).',
          'Les conseils récupérés sur des sujets non liés ont été retenus (filtre d’alignement thématique).',
        ),
      ],
      isCrisis: false,
    },
  },
}

const s4: AdvisorScenario = {
  id: 's4',
  title: bi('Notice period — jurisdiction?', 'Préavis — quelle compétence?'),
  pinned: false,
  user: bi(
    "What's the notice period for terminating an employee?",
    'Quel est le préavis pour mettre fin à l’emploi d’un salarié?',
  ),
  turn: {
    reply: bi(
      "Before I give you specific notice figures, I need to know the jurisdiction — the rules differ a lot across Canada. Which province is the employee in, or is the employer federally regulated (banking, telecom, interprovincial transport)? I won't cite statutory minimums until that's confirmed.",
      'Avant de vous donner des chiffres de préavis précis, je dois connaître la compétence — les règles varient beaucoup au Canada. Dans quelle province l’employé travaille-t-il, ou l’employeur est-il de compétence fédérale (banques, télécommunications, transport interprovincial)? Je ne citerai aucun minimum légal avant que ce soit confirmé.',
    ),
    provincePrompt: true,
    jurisdictionLine: bi(
      'Confirm jurisdiction before use',
      'Confirmer la compétence avant utilisation',
    ),
    response: {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: true,
        legalBasisAllowed: false,
        documentsAllowed: false,
        webSearchAllowed: false,
      },
      jurisdiction: {
        status: 'unknown',
        value: bi('Not established', 'Non établie'),
        note: bi(
          'Province defaults to null — the engine never assumes Ontario. No province-specific citations are returned as authoritative.',
          'La province est nulle par défaut — le moteur ne présume jamais de l’Ontario. Aucune citation propre à une province n’est présentée comme faisant autorité.',
        ),
      },
      risk: { compliance: 'medium', safety: 'none' },
      professionalReview: null,
      supportNotice: false,
      legalBasis: {
        items: [],
        withheldReason: bi(
          'Legal basis withheld — jurisdiction is not confirmed.',
          'Fondement juridique retenu — la compétence n’est pas confirmée.',
        ),
      },
      retrieval: {
        items: [bi('Notice · jurisdiction-neutral', 'Préavis · neutre quant à la compétence')],
        note: bi(
          'Only jurisdiction-neutral items are shown until a province is confirmed.',
          'Seuls les éléments neutres quant à la compétence sont affichés jusqu’à confirmation d’une province.',
        ),
      },
      webSearch: null,
      confidence: null,
      warnings: [
        bi(
          'Jurisdiction-specific guidance was withheld until jurisdiction is confirmed.',
          'Les conseils propres à une compétence ont été retenus jusqu’à confirmation de celle-ci.',
        ),
      ],
      isCrisis: false,
    },
  },
  resolved: {
    reply: joinDisclaimer(
      'Thanks — Ontario it is. Under the ESA the statutory notice floor scales with service: one week per completed year of employment, up to eight weeks, plus severance if eligibility requirements are met. If the contract has no termination clause on file, common-law reasonable notice can run well beyond that. Want me to work it out for a specific tenure?',
      'Merci — c’est bien l’Ontario. En vertu de la LNE, le plancher de préavis augmente avec l’ancienneté : une semaine par année complétée, jusqu’à huit semaines, plus une indemnité de cessation d’emploi si les conditions d’admissibilité sont remplies. S’il n’y a aucune clause de licenciement au dossier, le préavis raisonnable de common law peut être nettement plus élevé. Voulez-vous que je le calcule pour une ancienneté précise?',
    ),
    followups: ['Estimate notice exposure', 'Loop in employment counsel'],
    jurisdictionLine: bi('Ontario — ESA, 2000', 'Ontario — LNE, 2000'),
    response: {
      route: { responseMode: 'hr', ...HYBRID_GATES },
      jurisdiction: {
        status: 'assumed',
        value: bi('Ontario · Provincially regulated', 'Ontario · Réglementation provinciale'),
        note: bi(
          'Confirmed from your reply — ESA, 2000 now applies.',
          'Confirmée d’après votre réponse — la LNE de 2000 s’applique désormais.',
        ),
      },
      risk: { compliance: 'medium', safety: 'none' },
      professionalReview: {
        type: 'hr',
        label: bi('No formal review needed yet', 'Aucune révision formelle requise pour l’instant'),
        reason: bi(
          'Routine notice-period guidance; escalate if a contract dispute emerges.',
          'Conseils courants sur le préavis; escaladez si un différend contractuel survient.',
        ),
      },
      supportNotice: false,
      legalBasis: {
        items: [
          {
            label: bi(
              'ESA s.57 — Notice of termination',
              'LNE art. 57 — Préavis de cessation d’emploi',
            ),
            valid: true,
          },
          {
            label: bi('ESA s.64 — Severance pay', 'LNE art. 64 — Indemnité de licenciement'),
            valid: true,
          },
        ],
      },
      retrieval: {
        items: [
          bi('Termination · ON', 'Licenciement · ON'),
          bi('Notice periods', 'Périodes de préavis'),
        ],
      },
      webSearch: null,
      confidence: { label: bi('Moderate', 'Modérée'), pct: 60 },
      warnings: [],
      isCrisis: false,
    },
  },
}

const s5: AdvisorScenario = {
  id: 's5',
  title: bi('Feeling overwhelmed', 'Sentiment de débordement'),
  pinned: false,
  user: bi(
    "Honestly I've been really overwhelmed and burnt out lately and I don't know how to keep up.",
    'Honnêtement, je me sens vraiment débordé et épuisé ces derniers temps et je ne sais plus comment suivre le rythme.',
  ),
  turn: {
    /* Supportive mode: human reply, crisis resource verbatim, no disclaimer
       (AGENT.md §7–8 — the disclaimer does not appear in wellbeing mode). */
    reply: bi(
      "I'm sorry you're carrying so much right now — that sounds genuinely exhausting, and it's okay to feel this way. A few things that can help in the moment: give yourself permission to step back and take a real break, and talk to someone you trust. If this has been building for a while, reaching out to your doctor or your EAP is a solid next step. And if you ever feel you might be in crisis, please contact 9-8-8 — the Suicide Crisis Helpline, available 24/7 by call or text. I'm here whenever you want to talk anything through.",
      'Je suis désolé que vous portiez autant en ce moment — cela semble réellement épuisant, et c’est normal de se sentir ainsi. Quelques gestes qui peuvent aider : donnez-vous la permission de prendre un vrai recul, et parlez-en à une personne de confiance. Si cela dure depuis un moment, contacter votre médecin ou votre PAE est une bonne prochaine étape. Et si jamais vous sentez que vous pourriez être en crise, veuillez contacter le 9-8-8 — la Ligne d’aide en cas de crise de suicide, offerte 24 h sur 24, 7 jours sur 7, par appel ou texto. Je suis là quand vous voulez en parler.',
    ),
    banner: {
      tone: 'support',
      title: bi('Support resource', 'Ressource de soutien'),
      text: bi(
        '9-8-8 Suicide Crisis Helpline — call or text, 24/7. Maintained from public sources, never generated.',
        '9-8-8 Ligne d’aide en cas de crise de suicide — appel ou texto, 24/7. Tenue à jour à partir de sources publiques, jamais générée.',
      ),
    },
    jurisdictionLine: bi(
      'Supportive — not a compliance matter',
      'Soutien — pas une question de conformité',
    ),
    response: {
      route: {
        responseMode: 'supportive',
        workspaceAllowed: false,
        retrievalAllowed: false,
        legalBasisAllowed: false,
        documentsAllowed: false,
        webSearchAllowed: false,
      },
      jurisdiction: {
        status: 'not_applicable',
        value: bi('Not applicable', 'Sans objet'),
        note: bi(
          'Personal wellbeing — no workplace or company context is assumed.',
          'Bien-être personnel — aucun contexte d’entreprise ou de milieu de travail n’est présumé.',
        ),
      },
      risk: { compliance: 'low', safety: 'watch' },
      professionalReview: {
        type: 'medical',
        label: bi(
          'Consider: employee assistance (EAP)',
          'À considérer : programme d’aide aux employés (PAE)',
        ),
        reason: bi(
          'Persistent personal-wellbeing signal — supportive follow-up, not HR action.',
          'Signal persistant de bien-être personnel — suivi de soutien, pas une mesure RH.',
        ),
      },
      supportNotice: true,
      legalBasis: {
        items: [],
        withheldReason: bi(
          'No legal basis in support mode.',
          'Aucun fondement juridique en mode soutien.',
        ),
      },
      retrieval: {
        items: [],
        withheldReason: bi(
          'No HR retrieval in support mode.',
          'Aucune récupération RH en mode soutien.',
        ),
      },
      webSearch: null,
      confidence: null,
      warnings: [],
      isCrisis: false,
    },
  },
}

const s6: AdvisorScenario = {
  id: 's6',
  title: bi('What changed in ON law?', 'Quoi de neuf en droit ontarien?'),
  pinned: false,
  user: bi(
    'What changed in Ontario employment law this year?',
    'Qu’est-ce qui a changé dans le droit du travail ontarien cette année?',
  ),
  turn: {
    reply: joinDisclaimer(
      "Here's what current sources indicate for Ontario this year — treat it as a starting point and confirm against the statute before acting. The Working for Workers series continued to add obligations (job-posting transparency, expanded leaves), and the general minimum wage was adjusted on the usual October cycle. I've pulled the underlying official and legislative pages on the right.",
      'Voici ce que les sources actuelles indiquent pour l’Ontario cette année — considérez-le comme un point de départ et vérifiez la loi avant d’agir. La série « Working for Workers » a continué d’ajouter des obligations (transparence des offres d’emploi, congés élargis), et le salaire minimum général a été ajusté selon le cycle habituel d’octobre. J’ai rassemblé les pages officielles et législatives sous-jacentes à droite.',
    ),
    banner: {
      tone: 'info',
      title: bi('Uses live web sources. ', 'Utilise des sources Web en direct. '),
      text: bi(
        'Answer draws on real-time discovery — verify against official sources before acting.',
        'La réponse s’appuie sur une recherche en temps réel — vérifiez les sources officielles avant d’agir.',
      ),
    },
    followups: [
      'Summarize the minimum-wage change',
      'What are the new leave rules?',
      'Cite the exact section',
    ],
    jurisdictionLine: bi(
      'Ontario — current-source check',
      'Ontario — vérification des sources actuelles',
    ),
    response: {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: true,
        legalBasisAllowed: false,
        documentsAllowed: false,
        webSearchAllowed: true,
      },
      jurisdiction: {
        status: 'known',
        value: bi('Ontario · Provincially regulated', 'Ontario · Réglementation provinciale'),
        note: bi(
          'Current-change query — internal legal basis is held back in favour of live sources.',
          'Requête sur les changements récents — le fondement juridique interne est retenu au profit des sources en direct.',
        ),
      },
      risk: { compliance: 'low', safety: 'none' },
      professionalReview: null,
      supportNotice: false,
      legalBasis: {
        items: [],
        withheldReason: bi(
          'Internal legal basis withheld for a “what changed” query — web sources are the current-info path, and they are not citations.',
          'Fondement juridique interne retenu pour une requête « quoi de neuf » — les sources Web sont la voie d’information actuelle, et elles ne sont pas des citations.',
        ),
      },
      retrieval: {
        items: [bi('Employment standards · ON', 'Normes d’emploi · ON')],
      },
      webSearch: {
        sources: [
          {
            domain: 'ontario.ca/laws',
            authority: 'legislation',
            title: bi(
              'Employment Standards Act, 2000 — current consolidation',
              'Loi de 2000 sur les normes d’emploi — codification à jour',
            ),
          },
          {
            domain: 'ontario.ca',
            authority: 'official',
            title: bi(
              'Working for Workers — what employers need to know',
              'Working for Workers — ce que les employeurs doivent savoir',
            ),
          },
          {
            domain: 'canada.ca',
            authority: 'official',
            title: bi(
              'Federal labour standards — recent updates',
              'Normes du travail fédérales — mises à jour récentes',
            ),
          },
          {
            domain: 'canlii.org',
            authority: 'legislation',
            title: bi(
              'Recent ESA interpretation decisions',
              'Décisions récentes d’interprétation de la LNE',
            ),
          },
          {
            domain: 'hrreporter.com',
            authority: 'secondary',
            title: bi(
              '2026 Ontario employment-law changes — summary',
              'Changements 2026 au droit du travail ontarien — résumé',
            ),
          },
        ],
      },
      confidence: {
        label: bi('Low', 'Faible'),
        pct: 38,
        note: bi(
          'Current-info answers carry lower confidence — confirm against the official source.',
          'Les réponses d’information actuelle portent une confiance plus faible — confirmez auprès de la source officielle.',
        ),
      },
      warnings: [],
      isCrisis: false,
    },
  },
  webOff: {
    reply: joinDisclaimer(
      "I can't verify current changes right now because live web search isn't enabled for this request. For the latest, check ontario.ca and the Employment Standards Act directly. I can still walk you through the stable ESA rules that haven't changed — want that?",
      'Je ne peux pas vérifier les changements récents pour le moment, car la recherche Web en direct n’est pas activée pour cette requête. Pour les dernières nouvelles, consultez ontario.ca et la Loi sur les normes d’emploi directement. Je peux tout de même vous présenter les règles stables de la LNE qui n’ont pas changé — souhaitez-vous cela?',
    ),
    jurisdictionLine: bi(
      'Ontario — current source unavailable',
      'Ontario — source actuelle non disponible',
    ),
    response: {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: false,
        legalBasisAllowed: false,
        documentsAllowed: false,
        webSearchAllowed: false,
      },
      jurisdiction: {
        status: 'known',
        value: bi('Ontario · Provincially regulated', 'Ontario · Réglementation provinciale'),
        note: bi(
          'Current-change query — internal legal basis is held back in favour of live sources.',
          'Requête sur les changements récents — le fondement juridique interne est retenu au profit des sources en direct.',
        ),
      },
      risk: { compliance: 'low', safety: 'none' },
      professionalReview: null,
      supportNotice: false,
      legalBasis: {
        items: [],
        withheldReason: bi(
          'Internal legal basis withheld for a current-change query.',
          'Fondement juridique interne retenu pour une requête sur les changements récents.',
        ),
      },
      retrieval: {
        items: [],
        withheldReason: bi(
          'Current-source verification unavailable — internal guidance is not served as a “what changed” answer.',
          'Vérification des sources actuelles non disponible — les conseils internes ne sont pas servis comme réponse « quoi de neuf ».',
        ),
      },
      webSearch: {
        sources: [],
        unavailableReason: bi(
          'Live web search is disabled for this request — the engine returns a bounded, safe response.',
          'La recherche Web en direct est désactivée pour cette requête — le moteur retourne une réponse limitée et sûre.',
        ),
      },
      confidence: {
        label: bi('Bounded', 'Limitée'),
        pct: 22,
        note: bi(
          'Web search disabled — the engine returns a bounded, safe response.',
          'Recherche Web désactivée — le moteur retourne une réponse limitée et sûre.',
        ),
      },
      warnings: [
        bi(
          'Current-source verification was requested but web search is disabled (WEB_SEARCH_ENABLED=false).',
          'Une vérification des sources actuelles a été demandée, mais la recherche Web est désactivée (WEB_SEARCH_ENABLED=false).',
        ),
      ],
      isCrisis: false,
    },
  },
}

export const advisorScenarios: Record<ScenarioId, AdvisorScenario> = { s1, s2, s3, s4, s5, s6 }

export const advisorScenarioList: AdvisorScenario[] = [s1, s2, s3, s4, s5, s6]

/**
 * Demo trigger routing (prototype `routeHome` — reference triggers for the
 * engine's classifier, AGENT.md §2). No jurisdiction cue → jurisdiction-
 * unknown (s4): the Advisor never falls through to "assume Ontario".
 */
export function routeScenarioFromText(text: string): ScenarioId {
  const t = text.toLowerCase()
  if (/terminat|dismiss|fire|let go|congédi|licenci/.test(t)) return 's1'
  if (/harass|violence|complaint|harcèl|plainte/.test(t)) return 's2'
  if (/accommodat|medical|disab|doctor|leave|accommod|médical|congé/.test(t)) return 's3'
  if (/overwhelm|burnt|burn out|stress|depress|débord|épuis|déprim/.test(t)) return 's5'
  if (/chang|update|latest|current|this year|2026|nouveau|récent/.test(t)) return 's6'
  return 's4'
}

/** Collect-jurisdiction chips (prototype: Ontario / Quebec / Federal / Other). */
export const PROVINCE_CHIPS: Bi[] = [
  advisorWorkspaceMessages.advws_province_on,
  advisorWorkspaceMessages.advws_province_qc,
  advisorWorkspaceMessages.advws_province_fed,
  advisorWorkspaceMessages.advws_province_other,
]

/** Follow-up chip labels for scenario chips with no canned reply fixture. */
export const scenarioFollowupLabels: Record<string, Bi> = {
  'Draft an investigation plan': bi('Draft an investigation plan', 'Rédiger un plan d’enquête'),
  'Assign an impartial investigator': bi(
    'Assign an impartial investigator',
    'Nommer un enquêteur impartial',
  ),
  'Open a case file': bi('Open a case file', 'Ouvrir un dossier'),
  'What counts as undue hardship?': bi(
    'What counts as undue hardship?',
    'Qu’est-ce qu’une contrainte excessive?',
  ),
  'Set a functional-review date': bi(
    'Set a functional-review date',
    'Fixer une date de révision fonctionnelle',
  ),
  'Summarize the minimum-wage change': bi(
    'Summarize the minimum-wage change',
    'Résumer le changement au salaire minimum',
  ),
  'What are the new leave rules?': bi(
    'What are the new leave rules?',
    'Quelles sont les nouvelles règles de congé?',
  ),
  'Cite the exact section': bi('Cite the exact section', 'Citer l’article exact'),
}

/** Advisor-home suggestion grid — the six demo starters (prototype `suggDefs`). */
export interface ScenarioSuggestion {
  scenarioId: ScenarioId
  label: Bi
  sub: Bi
}

export const scenarioSuggestions: ScenarioSuggestion[] = [
  {
    scenarioId: 's1',
    label: bi('Terminate an employee', 'Mettre fin à un emploi'),
    sub: bi('Ontario · no clause', 'Ontario · sans clause'),
  },
  {
    scenarioId: 's2',
    label: bi('Respond to a harassment complaint', 'Répondre à une plainte de harcèlement'),
    sub: bi('High-risk escalation', 'Escalade à risque élevé'),
  },
  {
    scenarioId: 's3',
    label: bi('Manage a medical accommodation', 'Gérer un accommodement médical'),
    sub: bi('Duty to accommodate', 'Obligation d’accommodement'),
  },
  {
    scenarioId: 's4',
    label: bi('Notice period', 'Période de préavis'),
    sub: bi('Jurisdiction to confirm', 'Compétence à confirmer'),
  },
  {
    scenarioId: 's5',
    label: bi('Support an overwhelmed teammate', 'Soutenir un collègue débordé'),
    sub: bi('Wellbeing · sensitive', 'Bien-être · délicat'),
  },
  {
    scenarioId: 's6',
    label: bi('What changed this year?', 'Quoi de neuf cette année?'),
    sub: bi('Live web sources', 'Sources Web en direct'),
  },
]

/** In-thread ack when the user keeps typing in a demo scenario (prototype `sendChat`). */
export const scenarioAck: Bi = bi(
  "Noted — I've added that to this thread. I can generate a document, work out an estimate, or loop in counsel whenever you're ready.",
  'Noté — je l’ai ajouté à ce fil. Je peux générer un document, préparer une estimation ou impliquer un conseiller juridique dès que vous êtes prêt.',
)

/** Signed-out ack (workspace stays in preview mode). */
export const scenarioAckSignedOut: Bi = bi(
  "I've noted that. Sign in to run the live engine — it'll pull jurisdiction-aware guidance, risk and citations into your workspace.",
  'C’est noté. Connectez-vous pour lancer le moteur — il affichera dans votre espace les conseils selon la compétence, le risque et les citations.',
)
