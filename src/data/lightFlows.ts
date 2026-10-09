import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { LightFlow } from './types'

/* ------------------------------------------------------------ light flows */

/**
 * Canned single-turn Advisor replies per topic (prototype `buildLightFlows()`).
 */
export const lightFlows: Record<string, LightFlow> = {
  hiring: {
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
  performance: {
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
  accommodation: {
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
  policy: {
    text: bi(
      'A solid remote work policy for a multi-jurisdiction team needs to cover eligibility, equipment & expenses, health & safety, and data security.',
      'Une bonne politique de télétravail pour une équipe multijuridictionnelle doit couvrir l’admissibilité, l’équipement et les dépenses, la santé et la sécurité, et la sécurité des données.',
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
          "Your current Remote Work Policy hasn’t been reviewed in 14 months, and you’ve added employees in 3 new employment jurisdictions since. Recommend a refresh this month.",
          'Votre politique de télétravail actuelle n’a pas été révisée depuis 14 mois, et vous avez ajouté des employés dans 3 nouvelles compétences d’emploi depuis. Une mise à jour ce mois-ci est recommandée.',
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
  "Tell me a bit more about the situation and I’ll point you in the right direction.",
  'Dites-m’en un peu plus sur la situation et je vous orienterai dans la bonne direction.',
)
