import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { ChatThread, FollowupReply, LightFlow } from './types'

/**
 * Advisor chat fixtures, transcribed from the prototype's `buildSeedChats()`,
 * `buildLightFlows()` and `buildFollowupReplies()` (chat titles from
 * `trChatTitle()`). Follow-up reply bodies have no FR in the prototype —
 * their FR is self-authored Québec French; chip labels come from frDict.
 */

/* ------------------------------------------------------------ seed chats */

export const chats: ChatThread[] = [
  {
    id: 'c1',
    title: bi('Terminating Jordan Mensah — Ontario', 'Licenciement de Jordan Mensah — Ontario'),
    folder: bi('Terminations & Offboarding', 'Cessations et départs'),
    pinned: true,
    time: bi('2m ago', 'Il y a 2 min'),
    bucket: 'today',
    flowKey: 'termination',
    messages: [
      {
        id: 'm1',
        role: 'user',
        text: bi(
          'I need to terminate an employee in Ontario.',
          'Je dois mettre fin à l’emploi d’un salarié en Ontario.',
        ),
      },
      {
        id: 'm2',
        role: 'advisor',
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
      },
      {
        id: 'm3',
        role: 'user',
        userChips: [
          bi('Full-time', 'Temps plein'),
          bi('8 years', '8 ans'),
          bi('Restructuring (without cause)', 'Restructuration (sans motif)'),
          bi(
            'Written contract, no termination clause',
            'Contrat écrit, sans clause de licenciement',
          ),
          bi('Non-union', 'Non syndiqué'),
        ],
      },
      {
        id: 'm4',
        role: 'advisor',
        text: bi(
          "Here's the assessment for Jordan Mensah.",
          'Voici l’évaluation pour Jordan Mensah.',
        ),
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
            tone: 'risk',
            title: bi('Notice exposure risk', 'Risque d’exposition au préavis'),
            body: bi(
              "Jordan's contract has no termination clause on file. The preliminary estimate is 9–12 months of pay in lieu of notice under common law — well beyond the 8-week ESA termination notice/pay minimum. Legal review recommended before an offer is made. This is compliance-oriented HR guidance, not legal advice.",
              'Le contrat de Jordan ne comporte aucune clause de licenciement au dossier. L’estimation préliminaire est de 9 à 12 mois d’indemnité en tenant lieu de préavis en common law — bien au-delà du minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. Un examen juridique est recommandé avant de faire une offre. Il s’agit de conseils RH axés sur la conformité, et non d’un avis juridique.',
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
            tone: 'warning',
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
        docs: ['T03', 'T17', 'T18'],
        followups: [
          'Estimate severance range',
          'Compare to PIP alternative',
          'Loop in employment counsel',
        ],
      },
      {
        id: 'm5',
        role: 'advisor',
        text: bi(
          'An employment counsel review has been requested for this case.',
          'Un examen par un conseiller juridique a été demandé pour ce dossier.',
        ),
        cards: [
          {
            tone: 'success',
            title: bi('Escalation logged', 'Escalade consignée'),
            body: bi(
              "Jordan Mensah's case file was shared securely with Dutiva's partner employment counsel. Expect a response within 1 business day. A task was added to track this.",
              'Le dossier de Jordan Mensah a été partagé de façon sécurisée avec le conseiller juridique partenaire de Dutiva. Réponse attendue dans un jour ouvrable. Une tâche a été ajoutée pour en faire le suivi.',
            ),
            citations: [],
          },
        ],
      },
    ],
  },
  {
    id: 'c2',
    title: bi(
      'Offer letter — Senior Analyst, Ontario',
      'Lettre d’offre — Analyste principal, Ontario',
    ),
    folder: bi('Hiring 2026', 'Embauche 2026'),
    pinned: false,
    time: bi('Yesterday', 'Hier'),
    bucket: 'week',
    flowKey: 'hiring',
    messages: [
      {
        id: 'm6',
        role: 'user',
        text: bi(
          'Draft an offer letter for a Senior Analyst role in Ontario.',
          'Rédigez une lettre d’offre pour un poste d’analyste principal en Ontario.',
        ),
      },
      {
        id: 'm7',
        role: 'advisor',
        text: bi(
          "I've got enough to draft a baseline offer — salary and start date can stay as placeholders until you confirm.",
          'J’ai assez d’information pour rédiger une offre de base — le salaire et la date de début peuvent rester des espaces réservés jusqu’à votre confirmation.',
        ),
        reasoning: [
          bi(
            'Jurisdiction: Ontario → Employment Standards Act, 2000 governs minimum terms.',
            'Compétence : Ontario → la Loi de 2000 sur les normes d’emploi régit les conditions minimales.',
          ),
          bi(
            'Employers with 25 or more employees in Ontario must provide specified new-hire information in writing before the first day of work, or as soon as reasonably possible afterward.',
            'Les employeurs comptant 25 employés ou plus en Ontario doivent fournir certains renseignements sur l’emploi par écrit avant la première journée de travail ou, le cas échéant, dès que raisonnablement possible par la suite.',
          ),
        ],
        cards: [
          {
            tone: 'info',
            title: bi('Ontario-specific note', 'Note propre à l’Ontario'),
            body: bi(
              'Non-compete clauses are generally unenforceable for most Ontario employees — I left it out. A reasonable non-solicit clause is included instead.',
              'Les clauses de non-concurrence sont généralement inapplicables pour la plupart des employés ontariens — je l’ai omise. Une clause de non-sollicitation raisonnable est incluse à la place.',
            ),
            citations: [
              {
                label: bi(
                  'Employment Standards Act, 2000 (Ontario)',
                  'Loi de 2000 sur les normes d’emploi (Ontario)',
                ),
              },
            ],
          },
        ],
        docs: ['T01', 'T02'],
        followups: ['Set probation terms', 'Draft rejection letter for other candidates'],
      },
    ],
  },
  {
    id: 'c3',
    title: bi('Remote work policy refresh', 'Mise à jour de la politique de télétravail'),
    folder: bi('Policy Reviews', 'Révisions de politiques'),
    pinned: false,
    time: bi('Yesterday', 'Hier'),
    bucket: 'week',
    flowKey: 'policy',
    messages: [
      {
        id: 'm8',
        role: 'user',
        text: bi(
          'We need a remote work policy — what should it cover?',
          'Nous avons besoin d’une politique de télétravail — que devrait-elle couvrir?',
        ),
      },
      {
        id: 'm9',
        role: 'advisor',
        text: bi(
          'A solid remote work policy for a multi-province team needs to cover eligibility, equipment & expenses, health & safety, and data security.',
          'Une bonne politique de télétravail pour une équipe multiprovinciale doit couvrir l’admissibilité, l’équipement et les dépenses, la santé et la sécurité, et la sécurité des données.',
        ),
        reasoning: [
          bi(
            'Occupational health & safety considerations for home offices vary by jurisdiction across Canada.',
            'Les considérations de SST pour le travail à domicile varient selon la compétence au Canada.',
          ),
          bi(
            'Expense reimbursement rules vary by jurisdiction — Ontario and Quebec differ on what employers must cover.',
            'Les règles de remboursement des dépenses varient selon la compétence — l’Ontario et le Québec diffèrent sur ce que les employeurs doivent couvrir.',
          ),
        ],
        cards: [
          {
            tone: 'warning',
            title: bi('Policy is overdue', 'Politique en retard'),
            body: bi(
              "Your current Remote Work Policy hasn't been reviewed in 14 months, and you've added employees in 3 new provinces since. Recommend a refresh this month.",
              'Votre politique de télétravail actuelle n’a pas été révisée depuis 14 mois, et vous avez ajouté des employés dans 3 nouvelles provinces depuis. Une mise à jour ce mois-ci est recommandée.',
            ),
            citations: [],
          },
        ],
        docs: ['T10', 'T48'],
        followups: ['Compare to current in-office policy', 'Add security & equipment clause'],
      },
    ],
  },
  {
    id: 'c4',
    title: bi('PIP — attendance concerns', 'PAR — problèmes d’assiduité'),
    folder: null,
    pinned: false,
    time: bi('3 days ago', 'Il y a 3 jours'),
    bucket: 'week',
    flowKey: 'performance',
    messages: [
      {
        id: 'm10',
        role: 'user',
        text: bi(
          "One of my employees has ongoing attendance issues — what's the right way to handle this?",
          'Un de mes employés a des problèmes d’assiduité persistants — quelle est la bonne façon de gérer cela?',
        ),
      },
      {
        id: 'm11',
        role: 'advisor',
        text: bi(
          'It depends on whether the absences are culpable (within their control) or innocent (medical/disability-related) — the process is very different for each.',
          'Cela dépend si les absences sont fautives (sous son contrôle) ou non fautives (liées à une condition médicale ou un handicap) — le processus est très différent pour chacune.',
        ),
        reasoning: [
          bi(
            'Innocent absenteeism cannot be disciplined directly — it may trigger a duty to inquire about accommodation.',
            'L’absentéisme non fautif ne peut être sanctionné directement — il peut déclencher une obligation de s’enquérir d’un accommodement.',
          ),
          bi(
            'Disciplining before ruling out a medical cause risks a discrimination claim.',
            'Sanctionner avant d’écarter une cause médicale risque une plainte pour discrimination.',
          ),
        ],
        cards: [
          {
            tone: 'risk',
            title: bi(
              'Discrimination risk if handled as misconduct',
              'Risque de discrimination si traité comme une inconduite',
            ),
            body: bi(
              'If these absences may relate to a medical condition, disciplining without first asking about accommodation needs could violate the Human Rights Code.',
              'Si ces absences peuvent être liées à une condition médicale, sanctionner sans d’abord s’enquérir des besoins d’accommodement pourrait enfreindre le Code des droits de la personne.',
            ),
            confidence: bi('High', 'Élevé'),
            citations: [
              {
                label: bi(
                  'Ontario Human Rights Code, s.5',
                  'Code des droits de la personne de l’Ontario, art. 5',
                ),
              },
            ],
          },
        ],
        docs: ['T16', 'T19'],
        followups: ['Draft accommodation inquiry first', 'Show attendance policy template'],
      },
    ],
  },
  {
    id: 'c5',
    title: bi('Accommodation — chronic illness', 'Accommodement — maladie chronique'),
    folder: null,
    pinned: false,
    time: bi('Last week', 'La semaine dernière'),
    bucket: 'older',
    flowKey: 'accommodation',
    messages: [
      {
        id: 'm12',
        role: 'user',
        text: bi(
          'An employee disclosed a chronic illness and needs modified duties.',
          'Un employé a divulgué une maladie chronique et a besoin de tâches modifiées.',
        ),
      },
      {
        id: 'm13',
        role: 'advisor',
        text: bi(
          "Good instinct to loop me in early. Let's keep the request to functional limitations only — you don't need (or want) a diagnosis on file.",
          'Bon réflexe de m’impliquer tôt. Limitons la demande aux seules limitations fonctionnelles — vous n’avez pas besoin (ni envie) d’un diagnostic au dossier.',
        ),
        reasoning: [
          bi(
            'Duty to accommodate applies up to undue hardship.',
            'L’obligation d’accommodement s’applique jusqu’à la contrainte excessive.',
          ),
          bi(
            'Employers may request medical documentation of functional limitations, not diagnosis.',
            'Les employeurs peuvent demander une documentation médicale des limitations fonctionnelles, pas le diagnostic.',
          ),
        ],
        docs: ['T19', 'T20'],
        followups: ['Draft medical info request', 'Log accommodation in compliance tracker'],
      },
    ],
  },
  {
    id: 'c6',
    title: bi(
      'Onboarding — new hire, Quebec office',
      'Intégration — nouvel employé, bureau du Québec',
    ),
    folder: bi('Hiring 2026', 'Embauche 2026'),
    pinned: false,
    time: bi('Last week', 'La semaine dernière'),
    bucket: 'older',
    flowKey: 'onboarding',
    messages: [
      {
        id: 'm14',
        role: 'user',
        text: bi(
          'Set up onboarding for a new hire starting in Quebec.',
          'Configurez l’intégration d’un nouvel employé qui débute au Québec.',
        ),
      },
      {
        id: 'm15',
        role: 'advisor',
        text: bi(
          'One thing before we move fast on this: Quebec has language requirements most employers miss.',
          'Une chose avant d’aller vite : le Québec a des exigences linguistiques que la plupart des employeurs manquent.',
        ),
        reasoning: [
          bi(
            'Quebec’s Charter of the French Language governs the language of many employment documents — French is generally required, with limited document-specific exceptions.',
            'La Charte de la langue française du Québec régit la langue de nombreux documents d’emploi — le français est généralement requis, avec des exceptions limitées selon le type de document.',
          ),
        ],
        cards: [
          {
            tone: 'warning',
            title: bi('French-language documents required', 'Documents en français requis'),
            body: bi(
              'Offer letters, contracts, and policies for Quebec employees must be provided in French by default.',
              'Les lettres d’offre, contrats et politiques pour les employés québécois doivent être fournis en français par défaut.',
            ),
            citations: [
              {
                label: bi(
                  'Charter of the French Language (Québec)',
                  'Charte de la langue française (Québec)',
                ),
              },
            ],
          },
        ],
        docs: ['T49'],
        followups: ['Generate French version', "Add Quebec's statutory holiday calendar"],
      },
    ],
  },
]

/* ------------------------------------------------------------ light flows */

/**
 * Canned single-turn Advisor replies per topic (prototype `buildLightFlows()`).
 */
export const lightFlows: Record<string, LightFlow> = {
  hiring: {
    text: bi(
      "I've got enough to draft a baseline offer — salary and start date can stay as placeholders until you confirm.",
      'J’ai assez d’information pour rédiger une offre de base — le salaire et la date de début peuvent rester des espaces réservés jusqu’à votre confirmation.',
    ),
    reasoning: [
      bi(
        'Jurisdiction: Ontario → Employment Standards Act, 2000 governs minimum terms.',
        'Compétence : Ontario → la Loi de 2000 sur les normes d’emploi régit les conditions minimales.',
      ),
      bi(
        'Employers with 25 or more employees in Ontario must provide specified new-hire information in writing before the first day of work, or as soon as reasonably possible afterward.',
        'Les employeurs comptant 25 employés ou plus en Ontario doivent fournir certains renseignements sur l’emploi par écrit avant la première journée de travail ou, le cas échéant, dès que raisonnablement possible par la suite.',
      ),
    ],
    cards: [
      {
        tone: 'info',
        title: bi('Ontario-specific note', 'Note propre à l’Ontario'),
        body: bi(
          'Non-compete clauses are generally unenforceable for most Ontario employees — I left it out. A reasonable non-solicit clause is included instead.',
          'Les clauses de non-concurrence sont généralement inapplicables pour la plupart des employés ontariens — je l’ai omise. Une clause de non-sollicitation raisonnable est incluse à la place.',
        ),
        citations: [
          {
            label: bi(
              'Employment Standards Act, 2000 (Ontario)',
              'Loi de 2000 sur les normes d’emploi (Ontario)',
            ),
          },
        ],
      },
    ],
    docs: ['T01', 'T02'],
    followups: ['Set probation terms', 'Draft rejection letter for other candidates'],
  },
  onboarding: {
    text: bi(
      'One thing before we move fast on this: Quebec has language requirements most employers miss.',
      'Une chose avant d’aller vite : le Québec a des exigences linguistiques que la plupart des employeurs manquent.',
    ),
    reasoning: [
      bi(
        'Quebec’s Charter of the French Language governs the language of many employment documents — French is generally required, with limited document-specific exceptions.',
        'La Charte de la langue française du Québec régit la langue de nombreux documents d’emploi — le français est généralement requis, avec des exceptions limitées selon le type de document.',
      ),
    ],
    cards: [
      {
        tone: 'warning',
        title: bi('French-language documents required', 'Documents en français requis'),
        body: bi(
          'Offer letters, contracts, and policies for Quebec employees must be provided in French by default.',
          'Les lettres d’offre, contrats et politiques pour les employés québécois doivent être fournis en français par défaut.',
        ),
        citations: [
          {
            label: bi(
              'Charter of the French Language (Québec)',
              'Charte de la langue française (Québec)',
            ),
          },
        ],
      },
    ],
    docs: ['T49'],
    followups: ['Generate French version', "Add Quebec's statutory holiday calendar"],
  },
  performance: {
    text: bi(
      'It depends on whether the absences are culpable (within their control) or innocent (medical/disability-related) — the process is very different for each.',
      'Cela dépend si les absences sont fautives (sous son contrôle) ou non fautives (liées à une condition médicale ou un handicap) — le processus est très différent pour chacune.',
    ),
    reasoning: [
      bi(
        'Innocent absenteeism cannot be disciplined directly — it may trigger a duty to inquire about accommodation.',
        'L’absentéisme non fautif ne peut être sanctionné directement — il peut déclencher une obligation de s’enquérir d’un accommodement.',
      ),
      bi(
        'Disciplining before ruling out a medical cause risks a discrimination claim.',
        'Sanctionner avant d’écarter une cause médicale risque une plainte pour discrimination.',
      ),
    ],
    cards: [
      {
        tone: 'risk',
        title: bi(
          'Discrimination risk if handled as misconduct',
          'Risque de discrimination si traité comme une inconduite',
        ),
        body: bi(
          'If these absences may relate to a medical condition, disciplining without first asking about accommodation needs could violate the Human Rights Code.',
          'Si ces absences peuvent être liées à une condition médicale, sanctionner sans d’abord s’enquérir des besoins d’accommodement pourrait enfreindre le Code des droits de la personne.',
        ),
        confidence: bi('High', 'Élevé'),
        citations: [
          {
            label: bi(
              'Ontario Human Rights Code, s.5',
              'Code des droits de la personne de l’Ontario, art. 5',
            ),
          },
        ],
      },
    ],
    docs: ['T16', 'T19'],
    followups: ['Draft accommodation inquiry first', 'Show attendance policy template'],
  },
  accommodation: {
    text: bi(
      "Good instinct to loop me in early. Let's keep the request to functional limitations only — you don't need, or want, a diagnosis on file.",
      'Bon réflexe de m’impliquer tôt. Limitons la demande aux seules limitations fonctionnelles — vous n’avez pas besoin, ni envie, d’un diagnostic au dossier.',
    ),
    reasoning: [
      bi(
        'Duty to accommodate applies up to undue hardship.',
        'L’obligation d’accommodement s’applique jusqu’à la contrainte excessive.',
      ),
      bi(
        'Employers may request medical documentation of functional limitations, not diagnosis.',
        'Les employeurs peuvent demander une documentation médicale des limitations fonctionnelles, pas le diagnostic.',
      ),
    ],
    docs: ['T19', 'T20'],
    followups: ['Draft medical info request', 'Log accommodation in compliance tracker'],
  },
  policy: {
    text: bi(
      'A solid remote work policy for a multi-province team needs to cover eligibility, equipment & expenses, health & safety, and data security.',
      'Une bonne politique de télétravail pour une équipe multiprovinciale doit couvrir l’admissibilité, l’équipement et les dépenses, la santé et la sécurité, et la sécurité des données.',
    ),
    reasoning: [
      bi(
        'Remote and home-office OHS considerations differ among Ontario, Quebec, federally regulated workplaces, and other applicable regimes.',
        'Les considérations de SST pour le travail à domicile diffèrent en Ontario, au Québec, dans les milieux sous réglementation fédérale et selon les autres régimes applicables.',
      ),
      bi(
        'Expense reimbursement rules vary by jurisdiction — Ontario and Quebec differ on what employers must cover.',
        'Les règles de remboursement des dépenses varient selon la compétence — l’Ontario et le Québec diffèrent sur ce que les employeurs doivent couvrir.',
      ),
    ],
    cards: [
      {
        tone: 'warning',
        title: bi('Policy is overdue', 'Politique en retard'),
        body: bi(
          "Your current Remote Work Policy hasn't been reviewed in 14 months, and you've added employees in 3 new provinces since. Recommend a refresh this month.",
          'Votre politique de télétravail actuelle n’a pas été révisée depuis 14 mois, et vous avez ajouté des employés dans 3 nouvelles provinces depuis. Une mise à jour ce mois-ci est recommandée.',
        ),
        citations: [],
      },
    ],
    docs: ['T10', 'T48'],
    followups: ['Compare to current in-office policy', 'Add security & equipment clause'],
  },
}

/** Advisor fallback when a light flow has no canned content (FR self-authored). */
export const lightFlowFallbackText: Bi = bi(
  "Tell me a bit more about the situation and I'll point you in the right direction.",
  'Dites-m’en un peu plus sur la situation et je vous orienterai dans la bonne direction.',
)

/* -------------------------------------------------------- followup replies */

/**
 * Canned replies to follow-up chips, keyed by the prototype's EN label
 * (prototype `buildFollowupReplies()`). Reply bodies have no FR in the
 * prototype — FR self-authored; chip labels come from the prototype's frDict.
 */
export const followupReplies: Record<string, FollowupReply> = {
  'Estimate severance range': {
    label: bi('Estimate severance range', 'Estimer la fourchette d’indemnité'),
    text: bi(
      'Based on 8 years of service and a mid-level role with no termination clause on file, expect a preliminary common-law range of roughly 9–12 months of pay in lieu of notice — well above the 8-week ESA termination notice/pay minimum. Statutory severance may also apply if eligibility requirements are met. I’d budget toward the higher end until counsel weighs in.',
      'Avec 8 ans de service et un poste intermédiaire sans clause de licenciement au dossier, prévoyez une fourchette préliminaire en common law d’environ 9 à 12 mois d’indemnité en tenant lieu de préavis — bien au-dessus du minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. Une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies. Je prévoirais le budget vers la limite supérieure jusqu’à l’avis du conseiller juridique.',
    ),
    reasoning: [
      bi(
        'Common-law "rule of thumb" scales with age, role seniority, tenure, and availability of similar work — not just years of service.',
        'La « règle générale » en common law varie selon l’âge, le niveau du poste, l’ancienneté et la disponibilité d’un emploi comparable — pas seulement les années de service.',
      ),
    ],
  },
  'Compare to PIP alternative': {
    label: bi('Compare to PIP alternative', 'Comparer à l’option PAR'),
    text: bi(
      'A PIP only makes sense if this is a performance issue you intend to give Jordan a genuine chance to fix. Since this is a restructuring — the role itself is ending, not Jordan’s performance — a PIP doesn’t apply here.',
      'Un PAR n’a de sens que s’il s’agit d’un problème de rendement que vous voulez véritablement donner à Jordan la chance de corriger. Comme il s’agit d’une restructuration — c’est le poste qui prend fin, pas le rendement de Jordan — le PAR ne s’applique pas ici.',
    ),
  },
  'Loop in employment counsel': {
    label: bi('Loop in employment counsel', 'Impliquer un conseiller juridique'),
    text: bi(
      'Good call given the notice exposure. I’ve prepared a summary for legal review and shared it securely.',
      'Bonne décision vu l’exposition au préavis. J’ai préparé un résumé pour examen juridique et je l’ai partagé de façon sécurisée.',
    ),
    cards: [
      {
        tone: 'success',
        title: bi('Escalation logged', 'Escalade consignée'),
        body: bi(
          'Jordan Mensah’s case file was shared with Dutiva’s partner employment counsel. Expect a response within 1 business day. A task has been added to track it.',
          'Le dossier de Jordan Mensah a été partagé avec le conseiller juridique partenaire de Dutiva. Réponse attendue dans un jour ouvrable. Une tâche a été ajoutée pour en faire le suivi.',
        ),
        citations: [],
      },
    ],
    isEscalation: true,
  },
  'Set probation terms': {
    label: bi('Set probation terms', 'Définir les modalités de probation'),
    text: bi(
      'Ontario does not set a statutory probation period, but a contractual probation clause can interact with ESA notice minima. I’ve added a probation clause to the offer letter draft above.',
      'L’Ontario ne prévoit pas de période de probation légale, mais une clause contractuelle peut interagir avec les minima de préavis de la LNE. J’ai ajouté une clause de probation à l’ébauche de lettre d’offre ci-dessus.',
    ),
  },
  'Draft rejection letter for other candidates': {
    label: bi(
      'Draft rejection letter for other candidates',
      'Rédiger une lettre de refus pour les autres candidats',
    ),
    text: bi(
      'Here’s a short, respectful rejection template you can send to the other candidates.',
      'Voici un modèle de refus court et respectueux à envoyer aux autres candidats.',
    ),
    docs: ['T47'],
  },
  'Show attendance policy template': {
    label: bi('Show attendance policy template', 'Afficher le modèle de politique d’assiduité'),
    text: bi(
      'Here’s your current attendance policy for reference before you proceed.',
      'Voici votre politique d’assiduité actuelle, à titre de référence avant de poursuivre.',
    ),
    docs: ['T50'],
  },
  'Draft accommodation inquiry first': {
    label: bi('Draft accommodation inquiry first', 'Rédiger d’abord une demande d’accommodement'),
    text: bi(
      'This is the safer path. Here’s a neutral inquiry that asks about functional limitations without requesting a diagnosis.',
      'C’est la voie la plus sûre. Voici une demande neutre qui porte sur les limitations fonctionnelles sans exiger de diagnostic.',
    ),
    docs: ['T20'],
  },
  'Draft medical info request': {
    label: bi('Draft medical info request', 'Rédiger une demande de renseignements médicaux'),
    text: bi(
      'Here’s a request limited to functional limitations, ready to send to the treating provider.',
      'Voici une demande limitée aux limitations fonctionnelles, prête à envoyer au professionnel traitant.',
    ),
    docs: ['T20'],
  },
  'Log accommodation in compliance tracker': {
    label: bi(
      'Log accommodation in compliance tracker',
      'Consigner l’accommodement dans le suivi de conformité',
    ),
    text: bi(
      'Logged — I’ll remind you when the 90-day review comes up.',
      'Consigné — je vous le rappellerai à l’approche de l’examen à 90 jours.',
    ),
    cards: [
      {
        tone: 'success',
        title: bi('Added to Compliance', 'Ajouté à la Conformité'),
        body: bi(
          'Accommodation review scheduled for July 14, 2026 — you’ll get a reminder 3 days before.',
          'Examen d’accommodement prévu le 14 juillet 2026 — vous recevrez un rappel 3 jours avant.',
        ),
        citations: [],
      },
    ],
  },
  'Generate French version': {
    label: bi('Generate French version', 'Générer la version française'),
    text: bi(
      'Here’s the French version of the onboarding package, matching the English draft clause for clause.',
      'Voici la version française de la trousse d’intégration, fidèle à l’ébauche anglaise clause par clause.',
    ),
    docs: ['T49'],
  },
  "Add Quebec's statutory holiday calendar": {
    label: bi(
      "Add Quebec's statutory holiday calendar",
      'Ajouter le calendrier des jours fériés du Québec',
    ),
    text: bi(
      'Added. Quebec observes 8 statutory holidays — I’ve included dates for the rest of 2026 in the package.',
      'Ajouté. Le Québec compte 8 jours fériés — j’ai inclus les dates pour le reste de 2026 dans la trousse.',
    ),
  },
  'Compare to current in-office policy': {
    label: bi(
      'Compare to current in-office policy',
      'Comparer à la politique en présentiel actuelle',
    ),
    text: bi(
      'Your in-office policy already covers equipment and conduct — the remote policy mainly needs to add home-office health & safety and expense rules that don’t apply on-site.',
      'Votre politique en présentiel couvre déjà l’équipement et la conduite — la politique de télétravail doit surtout ajouter la santé et sécurité du bureau à domicile et les règles de dépenses qui ne s’appliquent pas sur place.',
    ),
  },
  'Add security & equipment clause': {
    label: bi('Add security & equipment clause', 'Ajouter une clause de sécurité et d’équipement'),
    text: bi(
      'Added a data security clause requiring encrypted storage and company-approved devices for anyone working remotely.',
      'Une clause de sécurité des données a été ajoutée, exigeant un stockage chiffré et des appareils approuvés par l’entreprise pour toute personne en télétravail.',
    ),
  },
  'Assess compliance risk on this file': {
    label: bi(
      'Assess compliance risk on this file',
      'Évaluer le risque de conformité sur ce dossier',
    ),
    text: bi(
      'On this file, the material risk is procedural: acting before the paper trail is complete. Document every step, keep jurisdiction-specific language, and rule out any accommodation duty before treating an issue as misconduct.',
      'Sur ce dossier, le risque important est procédural : agir avant que la documentation soit complète. Documentez chaque étape, employez un langage propre à la compétence et écartez toute obligation d’accommodement avant de traiter un problème comme une inconduite.',
    ),
    reasoning: [
      bi(
        'Most defensible outcomes come from a clean, contemporaneous record.',
        'Les issues les plus défendables reposent sur un dossier propre et contemporain des faits.',
      ),
      bi(
        'Jurisdiction and human-rights obligations govern the sequence of steps.',
        'La compétence et les obligations en droits de la personne dictent l’ordre des étapes.',
      ),
    ],
    cards: [
      {
        tone: 'warning',
        title: bi('Procedural risk', 'Risque procédural'),
        body: bi(
          'The substance is manageable — the exposure is in how it’s handled. Keep decisions documented and reviewed before they’re communicated.',
          'Le fond est gérable — l’exposition tient à la façon de faire. Documentez et faites réviser les décisions avant de les communiquer.',
        ),
        confidence: bi(
          'Moderate — depends on facts still on file.',
          'Modérée — dépend des faits encore au dossier.',
        ),
        citations: [
          { label: bi('Applicable provincial standards', 'Normes provinciales applicables') },
        ],
      },
    ],
  },
  'Assess compliance risk': {
    label: bi('Assess compliance risk', 'Évaluer le risque de conformité'),
    text: bi(
      'Tell me the situation and jurisdiction and I’ll flag the specific exposure. In general: document decisions, apply the right provincial statute, and rule out accommodation duties before discipline.',
      'Décrivez-moi la situation et la compétence, et je signalerai l’exposition précise. En général : documentez les décisions, appliquez la bonne loi provinciale et écartez les obligations d’accommodement avant toute mesure disciplinaire.',
    ),
    cards: [
      {
        tone: 'info',
        title: bi('How I assess risk', 'Comment j’évalue le risque'),
        body: bi(
          'I weigh jurisdiction, the paper trail, and human-rights duties, then give you a Low/Medium/High read with the legislation behind it.',
          'Je pèse la compétence, la documentation et les obligations en droits de la personne, puis je vous donne une lecture Faible/Moyen/Élevé appuyée sur la législation.',
        ),
        citations: [],
      },
    ],
  },
  'Draft a document for this person': {
    label: bi('Draft a document for this person', 'Rédiger un document pour cette personne'),
    text: bi(
      'Here are documents I can generate, pre-filled with this person’s file details. Pick one and I’ll open it in Document Studio.',
      'Voici des documents que je peux générer, préremplis avec les détails du dossier de cette personne. Choisissez-en un et je l’ouvrirai dans le Studio de documents.',
    ),
    docs: ['T50', 'T06'],
  },
  'Draft a document': {
    label: bi('Draft a document', 'Rédiger un document'),
    text: bi(
      'Here’s a starting point — I can tailor any of these to the specifics once you choose one.',
      'Voici un point de départ — je peux adapter chacun de ces documents aux détails dès que vous en choisissez un.',
    ),
    docs: ['T50'],
  },
  'Recommend my next step': {
    label: bi('Recommend my next step', 'Recommander ma prochaine étape'),
    text: bi(
      'My recommended next step: confirm the outstanding facts, then let me draft the document or checklist so the action is captured properly. I’ll add a task so nothing slips.',
      'Ma prochaine étape recommandée : confirmez les faits en suspens, puis laissez-moi rédiger le document ou la liste de vérification pour bien consigner l’action. J’ajouterai une tâche pour que rien ne soit oublié.',
    ),
    cards: [
      {
        tone: 'suggestion',
        title: bi('Suggested next step', 'Prochaine étape suggérée'),
        body: bi(
          'Lock in the facts, generate the paperwork, and track it as a task — I’ll keep the timeline and compliance view in sync.',
          'Verrouillez les faits, générez les documents et suivez le tout comme une tâche — je garderai la chronologie et la vue Conformité synchronisées.',
        ),
        citations: [],
      },
    ],
  },
}

/** Advisor fallback when a follow-up chip has no canned reply (prototype `handleFollowup`). */
export const followupFallbackText: Bi = bi(
  'Got it — noted for this case.',
  'Compris — noté pour ce dossier.',
)
