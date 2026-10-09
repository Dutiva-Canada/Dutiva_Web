import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { FollowupReply } from './types'

/* -------------------------------------------------------- followup replies */

/**
 * Canned replies to follow-up chips, keyed by the prototype's EN label
 * (prototype `buildFollowupReplies()`). Reply bodies have no FR in the
 * prototype — FR self-authored; chip labels come from the prototype's frDict.
 */
export const followupReplies: Record<string, FollowupReply> = {
  'Estimate notice exposure': {
    label: bi('Estimate notice exposure', 'Estimer l’exposition au préavis'),
    text: bi(
      'Based on 8 years of service and a mid-level role with no termination clause on file, expect a preliminary common-law range of roughly 9–12 months of pay in lieu of notice — well above the 8-week ESA termination notice/pay minimum. Statutory severance may also apply if eligibility requirements are met. For internal contingency planning, model the upper end of the preliminary range pending counsel review.',
      'Avec 8 ans de service et un poste intermédiaire sans clause de licenciement au dossier, prévoyez une fourchette préliminaire en common law d’environ 9 à 12 mois d’indemnité en tenant lieu de préavis — bien au-dessus du minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. Une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies. Pour la planification interne, modélisez la limite supérieure de la fourchette préliminaire en attendant l’examen juridique.',
    ),
    reasoning: [
      bi(
        'A common-law reasonable-notice assessment considers factors such as age, character and seniority of the role, length of service, and availability of similar employment — not just years of service.',
        'L’évaluation du préavis raisonnable en common law tient notamment compte de l’âge, de la nature et du niveau du poste, de l’ancienneté et de la disponibilité d’un emploi comparable — pas seulement des années de service.',
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
  "Add Quebec’s statutory holiday calendar": {
    label: bi(
      "Add Quebec’s statutory holiday calendar",
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
          {
            label: bi(
              'Applicable employment standards and human-rights requirements',
              'Normes d’emploi et exigences en droits de la personne applicables',
            ),
          },
        ],
      },
    ],
  },
  'Assess compliance risk': {
    label: bi('Assess compliance risk', 'Évaluer le risque de conformité'),
    text: bi(
      'Tell me the situation and jurisdiction and I’ll flag the specific exposure. In general: document decisions, apply the employment and human-rights regime for the applicable jurisdiction, and rule out accommodation duties before discipline.',
      'Décrivez-moi la situation et la compétence, et je signalerai l’exposition précise. En général : documentez les décisions, appliquez le régime d’emploi et de droits de la personne pour la compétence applicable et écartez les obligations d’accommodement avant toute mesure disciplinaire.',
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
