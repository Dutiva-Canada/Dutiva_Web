import type { ChatThread } from './types'
import { bi } from '@/i18n/core'

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
          "Here’s the assessment for Jordan Mensah.",
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
            "ESA minimum: 8 weeks’ termination notice/pay; statutory severance may also apply if eligibility requirements are met.",
            'Minimum LNE : 8 semaines de préavis ou d’indemnité de licenciement ; une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies.',
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
              "Jordan’s contract has no termination clause on file. The preliminary estimate is 9–12 months of pay in lieu of notice under common law — well beyond the 8-week ESA termination notice/pay minimum. Legal review recommended before an offer is made. This is compliance-oriented HR guidance, not legal advice.",
              'Le contrat de Jordan ne comporte aucune clause de licenciement au dossier. L’estimation préliminaire est de 9 à 12 mois d’indemnité en tenant lieu de préavis en common law — bien au-delà du minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. Un examen juridique est recommandé avant de faire une offre. Il s’agit de conseils RH axés sur la conformité, et non d’un avis juridique.',
            ),
            confidence: bi(
              'Moderate — assumes a standard mid-level role; confirm ESA severance eligibility, including the applicable payroll or permanent-closure criteria.',
              'Modérée — suppose un poste intermédiaire standard ; confirmez l’admissibilité à l’indemnité de cessation d’emploi (LNE), y compris les critères applicables de masse salariale ou de fermeture permanente.',
            ),
            citations: [
              {
                label: bi(
                  'ESA s.57 — Notice of termination',
                  'LNE art. 57 — Délai de préavis de l’employeur',
                ),
              },
              {
                label: bi(
                  'ESA s.64 — Severance pay',
                  'LNE art. 64 — Indemnité de cessation d’emploi',
                ),
              },
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
              'Version signée du contrat d’emploi ; calcul de la masse salariale pour l’indemnité LNE ; traitement des primes, commissions et avantages pendant le préavis ; solde de vacances accumulées.',
            ),
          },
        ],
        docs: ['T03', 'T17', 'T18'],
        followups: [
          'Estimate notice exposure',
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
              "Jordan Mensah’s case file was shared securely with Dutiva’s partner employment counsel. Expect a response within 1 business day. A task was added to track this.",
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
      'Lettre d’offre — Analyste principale, Ontario',
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
          'Rédigez une lettre d’offre pour un poste d’analyste principale en Ontario.',
        ),
      },
      {
        id: 'm7',
        role: 'advisor',
        text: bi(
          "I’ve got enough to draft a baseline offer — salary and start date can stay as placeholders until you confirm.",
          'J’ai assez d’information pour rédiger une offre de base — le salaire et la date de début peuvent rester des espaces réservés jusqu’à votre confirmation.',
        ),
        reasoning: [
          bi(
            'Jurisdiction: Ontario → Employment Standards Act, 2000 governs minimum terms.',
            'Compétence : Ontario → la Loi de 2000 sur les normes d’emploi régit les conditions minimales.',
          ),
          bi(
            'Employers with 25 or more employees in Ontario on the new employee’s first day must provide the specified employment information in writing before that first day, or, if that is not practicable, as soon afterward as is reasonably possible.',
            'Les employeurs comptant 25 employés ou plus en Ontario à la première journée de travail du nouvel employé doivent fournir les renseignements sur l’emploi prescrits par écrit avant cette première journée, ou, si ce n’est pas possible, dès que raisonnablement possible par la suite.',
          ),
        ],
        cards: [
          {
            tone: 'info',
            title: bi('Ontario-specific note', 'Note propre à l’Ontario'),
            body: bi(
              'Ontario’s ESA prohibits most new non-compete agreements, subject to statutory exceptions, so I left one out. Any non-solicitation restriction should be reviewed separately for scope and enforceability.',
              'La LNE de l’Ontario interdit la plupart des nouvelles ententes de non-concurrence, sous réserve des exceptions prévues par la loi — j’en ai donc omis une. Toute restriction de non-sollicitation devrait être examinée séparément quant à sa portée et son exécutabilité.',
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
          'Nous avons besoin d’une politique de télétravail — que devrait-elle couvrir ?',
        ),
      },
      {
        id: 'm9',
        role: 'advisor',
        text: bi(
          'A solid remote work policy for a multi-jurisdiction team needs to cover eligibility, equipment & expenses, health & safety, and data security.',
          'Une bonne politique de télétravail pour une équipe multijuridictionnelle doit couvrir l’admissibilité, l’équipement et les dépenses, la santé et la sécurité, et la sécurité des données.',
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
              "Your current Remote Work Policy hasn’t been reviewed in 14 months, and you’ve added employees in 3 new employment jurisdictions since. Recommend a refresh this month.",
              'Votre politique de télétravail actuelle n’a pas été révisée depuis 14 mois, et vous avez ajouté des employés dans 3 nouvelles compétences d’emploi depuis. Une mise à jour ce mois-ci est recommandée.',
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
          "One of my employees has ongoing attendance issues — what’s the right way to handle this?",
          'Un de mes employés a des problèmes d’assiduité persistants — quelle est la bonne façon de gérer cela ?',
        ),
      },
      {
        id: 'm11',
        role: 'advisor',
        text: bi(
          'Start by distinguishing potentially culpable conduct from non-culpable or disability-related absence — then apply the employment and human-rights regime for the applicable jurisdiction. The process differs materially depending on which category applies.',
          'Commencez par distinguer une conduite potentiellement fautive d’une absence non fautive ou liée à un handicap — puis appliquez le régime d’emploi et de droits de la personne pour la compétence applicable. Le processus diffère nettement selon la catégorie.',
        ),
        reasoning: [
          bi(
            'Non-culpable or disability-related absence generally cannot be addressed through discipline alone — in Ontario, employers may have a duty to inquire before adverse action when they know or ought to know that disability may relate to job performance or behaviour.',
            'L’absentéisme non fautif ou lié à un handicap ne peut généralement être traité par la seule discipline — en Ontario, l’employeur peut avoir l’obligation de s’enquérir avant une mesure défavorable lorsqu’il sait ou devrait savoir qu’un handicap peut être lié au rendement ou au comportement au travail.',
          ),
          bi(
            'Taking disciplinary action before considering whether disability-related needs may be involved can create discrimination risk.',
            'Prendre une mesure disciplinaire avant d’examiner si des besoins liés à un handicap peuvent être en cause peut créer un risque de discrimination.',
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
          'Good instinct to loop me in early. Keep any medical-information request focused on the information reasonably necessary to assess functional limitations and accommodation needs; diagnosis is generally unnecessary unless the circumstances justify additional information.',
          'Bon réflexe de m’impliquer tôt. Limitez toute demande de renseignements médicaux à l’information raisonnablement nécessaire pour évaluer les limitations fonctionnelles et les besoins d’accommodement ; le diagnostic est généralement inutile, sauf si les circonstances justifient des renseignements additionnels.',
        ),
        reasoning: [
          bi(
            'Duty to accommodate applies up to undue hardship.',
            'L’obligation d’accommodement s’applique jusqu’à la contrainte excessive.',
          ),
          bi(
            'Employers should request only the medical information reasonably necessary to assess functional limitations and accommodation needs; diagnosis is generally unnecessary unless the circumstances justify additional information.',
            'Les employeurs ne devraient demander que les renseignements médicaux raisonnablement nécessaires pour évaluer les limitations fonctionnelles et les besoins d’accommodement ; le diagnostic est généralement inutile, sauf si les circonstances justifient des renseignements additionnels.',
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
              'Written employment contracts, workplace communications, and applicable employment documents for Quebec employees generally must be available in French, subject to the Charter’s specific rules and exceptions.',
              'Les contrats de travail écrits, les communications en milieu de travail et les documents d’emploi applicables pour les employés québécois doivent généralement être disponibles en français, sous réserve des règles et exceptions précises de la Charte.',
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
        followups: ['Generate French version', "Add Quebec’s statutory holiday calendar"],
      },
    ],
  },
]
