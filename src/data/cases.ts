import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type {
  CaseFile,
  CaseNote,
  CaseRisk,
  CaseRiskAxis,
  CaseType,
  FixtureToneCard,
  RiskLevel,
} from './types'

/**
 * Case files + per-type Advisor risk data, transcribed from the prototype's
 * `buildCases()`, `caseRiskFor()`, `caseRiskAxes()`, `caseRecommendation()`
 * and the seeded `caseNotes` state.
 */

export const cases: CaseFile[] = [
  {
    id: 'case1',
    title: bi('Termination — Jordan Mensah', 'Licenciement — Jordan Mensah'),
    type: 'Termination',
    typeLabel: bi('Termination', 'Licenciement'),
    empId: 'e1',
    empName: 'Jordan Mensah',
    province: bi('Ontario', 'Ontario'),
    status: bi('Legal review recommended', 'Révision juridique recommandée'),
    tone: 'risk',
    opened: 'Jul 2, 2026',
    openedISO: '2026-07-02',
    owner: 'Riley Summers',
    due: 'Jul 10, 2026',
    retention: bi(
      '7 years after employment ends (ESA/CRA records)',
      '7 ans après la fin de l’emploi (registres LNE/ARC)',
    ),
    legalScope: bi(
      'Notice exposure and release enforceability',
      'Exposition au préavis et force exécutoire de la quittance',
    ),
    chatId: 'c1',
    summary: bi(
      'Without-cause termination during a restructuring. No termination clause on file — preliminary common-law estimate: 9–12 months. Legal review requested.',
      'Licenciement sans motif lors d’une restructuration. Aucune clause de licenciement au dossier — estimation préliminaire en common law : 9 à 12 mois. Examen juridique demandé.',
    ),
    steps: [
      { label: bi('Case opened', 'Dossier ouvert'), done: true },
      { label: bi('Risk assessed by Advisor', 'Risque évalué par le Conseiller'), done: true },
      { label: bi('Documents drafted', 'Documents rédigés'), done: true },
      { label: bi('Legal review requested', 'Examen juridique demandé'), done: true },
      { label: bi('Counsel response', 'Réponse du conseiller'), done: false },
      { label: bi('Offer finalized', 'Offre finalisée'), done: false },
    ],
  },
  {
    id: 'case2',
    title: bi('Performance — Devon Clarke', 'Rendement — Devon Clarke'),
    type: 'Performance',
    typeLabel: bi('Performance', 'Rendement'),
    empId: 'e5',
    empName: 'Devon Clarke',
    province: bi('Ontario', 'Ontario'),
    status: bi('In progress', 'En cours'),
    tone: 'warning',
    opened: 'Jun 20, 2026',
    openedISO: '2026-06-20',
    owner: 'Riley Summers',
    due: 'Jul 22, 2026',
    retention: bi('3 years after the case closes', '3 ans après la fermeture du dossier'),
    chatId: 'c4',
    summary: bi(
      'Attendance-related PIP. Advisor flagged the need to rule out a medical/accommodation cause before treating as misconduct.',
      'PAR lié à l’assiduité. Le Conseiller a signalé la nécessité d’écarter une cause médicale ou d’accommodement avant de traiter la situation comme une inconduite.',
    ),
    steps: [
      { label: bi('Concern documented', 'Préoccupation documentée'), done: true },
      { label: bi('Accommodation ruled out', 'Accommodement écarté'), done: true },
      { label: bi('PIP started', 'PAR démarré'), done: true },
      { label: bi('30-day check-in', 'Suivi à 30 jours'), done: false },
      { label: bi('Outcome decision', 'Décision sur l’issue'), done: false },
    ],
  },
  {
    id: 'case3',
    title: bi('Accommodation — Amara Okafor', 'Accommodement — Amara Okafor'),
    type: 'Accommodation',
    typeLabel: bi('Accommodation', 'Accommodement'),
    empId: 'e6',
    empName: 'Amara Okafor',
    province: bi('British Columbia', 'Colombie-Britannique'),
    status: bi('In progress', 'En cours'),
    tone: 'warning',
    opened: 'Feb 2026',
    /* The prototype dates this one to the month only; the review cycle implies
       early February (90-day reviews landing Apr 14 / Jul 14). */
    openedISO: '2026-02-10',
    owner: 'Fatima Haddad',
    due: 'Jul 14, 2026',
    retention: bi(
      'Duration of employment + 3 years (accommodation records)',
      'Durée de l’emploi + 3 ans (dossiers d’accommodement)',
    ),
    chatId: 'c5',
    summary: bi(
      'Modified-duties accommodation for a documented medical condition. Functional limitations on file only — no diagnosis. Reviewed every 90 days.',
      'Accommodement en tâches modifiées pour une condition médicale documentée. Seules les limitations fonctionnelles au dossier — aucun diagnostic. Révisé tous les 90 jours.',
    ),
    steps: [
      { label: bi('Request received', 'Demande reçue'), done: true },
      {
        label: bi('Functional info requested', 'Renseignements fonctionnels demandés'),
        done: true,
      },
      { label: bi('Plan implemented', 'Plan mis en œuvre'), done: true },
      { label: bi('90-day review (Jul 14)', 'Examen à 90 jours (14 juillet)'), done: false },
    ],
  },
  {
    id: 'case4',
    title: bi('Onboarding — Marc-Étienne Roy', 'Intégration — Marc-Étienne Roy'),
    type: 'Onboarding',
    typeLabel: bi('Onboarding', 'Intégration'),
    empId: 'e3',
    empName: 'Marc-Étienne Roy',
    province: bi('Quebec', 'Québec'),
    status: bi('Resolved', 'Résolu'),
    tone: 'success',
    opened: 'Jul 1, 2026',
    openedISO: '2026-07-01',
    owner: 'Fatima Haddad',
    due: '—',
    retention: bi('3 years after onboarding completes', '3 ans après la fin de l’intégration'),
    chatId: 'c6',
    summary: bi(
      'Quebec onboarding completed with French-language documents by default, consistent with the Charter of the French Language.',
      'Intégration au Québec réalisée avec des documents en français par défaut, conformément à la Charte de la langue française.',
    ),
    steps: [
      { label: bi('Offer accepted', 'Offre acceptée'), done: true },
      { label: bi('French docs generated', 'Documents français générés'), done: true },
      { label: bi('Equipment provisioned', 'Équipement fourni'), done: true },
      { label: bi('First week complete', 'Première semaine complétée'), done: true },
    ],
  },
]

/* ------------------------------------------------------------ risk levels */

export const riskLevelLabels: Record<RiskLevel, Bi> = {
  High: bi('High', 'Élevé'),
  Medium: bi('Medium', 'Moyen'),
  Low: bi('Low', 'Faible'),
  Pending: bi('Pending', 'En attente'),
}

/** Per-case-type risk assessment (prototype `caseRiskFor()`). */
export const caseRiskByType: Record<CaseType, CaseRisk> = {
  Termination: {
    level: 'High',
    levelLabel: riskLevelLabels.High,
    tone: 'risk',
    factors: [
      bi('No termination clause on file', 'Aucune clause de licenciement au dossier'),
      bi(
        'Common-law exposure ~9–12 months vs 8-week ESA termination notice/pay minimum',
        'Exposition en common law d’environ 9 à 12 mois c. minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement',
      ),
      bi(
        'ESA severance payroll threshold → confirm calculation before finalizing',
        'Seuil de masse salariale de la LNE → confirmez le calcul avant de finaliser',
      ),
    ],
  },
  Performance: {
    level: 'Medium',
    levelLabel: riskLevelLabels.Medium,
    tone: 'warning',
    factors: [
      bi(
        'Must rule out a medical/accommodation cause before discipline',
        'Doit écarter une cause médicale ou d’accommodement avant toute mesure disciplinaire',
      ),
      bi(
        'Requires a documented, measurable improvement plan',
        'Exige un plan d’amélioration documenté et mesurable',
      ),
    ],
  },
  Accommodation: {
    level: 'Medium',
    levelLabel: riskLevelLabels.Medium,
    tone: 'warning',
    factors: [
      bi(
        'Duty to accommodate to the point of undue hardship',
        'Obligation d’accommodement jusqu’à la contrainte excessive',
      ),
      bi(
        'Functional limitations only — diagnosis must stay off file',
        'Limitations fonctionnelles seulement — le diagnostic doit rester hors dossier',
      ),
    ],
  },
  Onboarding: {
    level: 'Low',
    levelLabel: riskLevelLabels.Low,
    tone: 'success',
    factors: [
      bi(
        'Confirm whether French versions were required and whether any language exception applies',
        'Confirmez si des versions françaises étaient requises et si une exception linguistique s’applique',
      ),
      bi('No outstanding obligations', 'Aucune obligation en suspens'),
    ],
  },
}

/** Advisor recommendation card per case type (prototype `caseRecommendation()`). */
export const caseRecommendationByType: Record<CaseType, FixtureToneCard> = {
  Termination: {
    tone: 'risk',
    title: bi('Advisor recommendation', 'Recommandation du Conseiller'),
    body: bi(
      'Do not send an offer until counsel confirms the notice range. Budget toward the high end (12 months) and keep the release contingent on independent legal advice.',
      'N’envoyez pas d’offre tant que le conseiller juridique n’a pas confirmé la fourchette de préavis. Prévoyez le budget vers la limite supérieure (12 mois) et conditionnez la quittance à un avis juridique indépendant.',
    ),
  },
  Performance: {
    tone: 'warning',
    title: bi('Advisor recommendation', 'Recommandation du Conseiller'),
    body: bi(
      'Confirm the 30-day check-in is documented against measurable attendance expectations. Keep the accommodation door open in writing.',
      'Confirmez que le suivi à 30 jours est documenté par rapport à des attentes d’assiduité mesurables. Gardez la porte de l’accommodement ouverte par écrit.',
    ),
  },
  Accommodation: {
    tone: 'warning',
    title: bi('Advisor recommendation', 'Recommandation du Conseiller'),
    body: bi(
      'Hold functional-limitations info only — never a diagnosis. Confirm modified duties are still appropriate at the July 14 review.',
      'Ne conservez que les limitations fonctionnelles — jamais un diagnostic. Confirmez que les tâches modifiées sont toujours appropriées à l’examen du 14 juillet.',
    ),
  },
  Onboarding: {
    tone: 'success',
    title: bi('Advisor recommendation', 'Recommandation du Conseiller'),
    body: bi(
      'Onboarding documentation is complete. Confirm whether French versions were required and whether any employee-requested language exception applies before closing.',
      'La documentation d’intégration est complète. Confirmez si des versions françaises étaient requises et si une exception linguistique demandée par l’employé s’applique avant de fermer le dossier.',
    ),
  },
}

/* -------------------------------------------------------------- risk axes */

const axis = (axisLabel: Bi, level: RiskLevel, reason: Bi, mitigation: Bi): CaseRiskAxis => ({
  axis: axisLabel,
  level,
  levelLabel: riskLevelLabels[level],
  reason,
  mitigation,
})

const axLegal = bi('Legal / compliance', 'Juridique / conformité')
const axRelations = bi('Employee relations', 'Relations avec les employés')
const axDocumentation = bi('Documentation', 'Documentation')
const axTiming = bi('Timing / deadline', 'Échéances')
const axPrivacy = bi('Privacy / sensitivity', 'Confidentialité')
const axReputation = bi('Reputation', 'Réputation')

/** Six-axis risk review per case type (prototype `caseRiskAxes()`). */
export const caseRiskAxesByType: Record<CaseType, CaseRiskAxis[]> = {
  Termination: [
    axis(
      axLegal,
      'High',
      bi(
        'No termination clause on file — preliminary common-law exposure of roughly 9–12 months.',
        'Aucune clause de licenciement au dossier — exposition préliminaire en common law d’environ 9 à 12 mois.',
      ),
      bi(
        'Hold the offer until counsel confirms the notice range.',
        'Retenez l’offre jusqu’à confirmation de la fourchette par le conseiller.',
      ),
    ),
    axis(
      axRelations,
      'Medium',
      bi(
        'Restructuring exit of an 8-year employee — the departure narrative matters.',
        'Licenciement d’un employé de 8 ans lors d’une restructuration — le récit du départ compte.',
      ),
      bi(
        'Prepare a respectful meeting script and transition support.',
        'Préparez un scénario de rencontre respectueux et un soutien de transition.',
      ),
    ),
    axis(
      axDocumentation,
      'Medium',
      bi(
        'Signed agreement version and severance payroll calculation not yet on file.',
        'Version signée du contrat et calcul de la masse salariale non versés au dossier.',
      ),
      bi(
        'Attach the signed agreement and Finance’s threshold confirmation.',
        'Joignez le contrat signé et la confirmation du seuil par les Finances.',
      ),
    ),
    axis(
      axTiming,
      'High',
      bi(
        'Counsel response outstanding; offer target is Jul 10.',
        'Réponse du conseiller en attente; offre visée le 10 juillet.',
      ),
      bi(
        'Nudge counsel today; do not schedule the meeting until review closes.',
        'Relancez le conseiller aujourd’hui; ne planifiez pas la rencontre avant la fin de l’examen.',
      ),
    ),
    axis(
      axPrivacy,
      'Medium',
      bi(
        'Restricted case — access limited to the HR lead and counsel.',
        'Dossier restreint — accès limité au responsable RH et au conseiller.',
      ),
      bi(
        'Keep documents in the case file; avoid email attachments.',
        'Conservez les documents dans le dossier; évitez les pièces jointes par courriel.',
      ),
    ),
    axis(
      axReputation,
      'Low',
      bi(
        'Single-role restructuring with low external visibility.',
        'Restructuration d’un seul poste, faible visibilité externe.',
      ),
      bi(
        'Align internal messaging with the manager before the meeting.',
        'Alignez le message interne avec le gestionnaire avant la rencontre.',
      ),
    ),
  ],
  Performance: [
    axis(
      axLegal,
      'Medium',
      bi(
        'Discipline before ruling out accommodation creates human-rights exposure.',
        'Discipliner avant d’écarter l’accommodement crée une exposition en droits de la personne.',
      ),
      bi(
        'Keep the accommodation door open in writing at each step.',
        'Gardez la porte de l’accommodement ouverte par écrit à chaque étape.',
      ),
    ),
    axis(
      axRelations,
      'Medium',
      bi(
        'PIP fairness perception affects the whole team.',
        'La perception d’équité du PAR touche toute l’équipe.',
      ),
      bi(
        'Hold check-ins on schedule with specific, measurable feedback.',
        'Tenez les suivis à temps avec une rétroaction précise et mesurable.',
      ),
    ),
    axis(
      axDocumentation,
      'High',
      bi(
        'Outcome is only defensible if every check-in is documented.',
        'Le résultat n’est défendable que si chaque suivi est documenté.',
      ),
      bi(
        'Log each check-in against the written attendance expectations.',
        'Consignez chaque suivi par rapport aux attentes écrites d’assiduité.',
      ),
    ),
    axis(
      axTiming,
      'Medium',
      bi('30-day check-in due Jul 22.', 'Suivi à 30 jours dû le 22 juillet.'),
      bi(
        'Book the meeting now and prepare the attendance record.',
        'Fixez la rencontre dès maintenant et préparez le registre d’assiduité.',
      ),
    ),
    axis(
      axPrivacy,
      'Medium',
      bi(
        'Attendance records may touch on medical information.',
        'Les registres d’assiduité peuvent toucher à des renseignements médicaux.',
      ),
      bi(
        'Hold functional information only — no diagnosis on file.',
        'Ne conservez que l’information fonctionnelle — aucun diagnostic au dossier.',
      ),
    ),
    axis(
      axReputation,
      'Low',
      bi('Internal process with limited visibility.', 'Processus interne à visibilité limitée.'),
      bi(
        'No action needed beyond consistent treatment.',
        'Aucune action requise au-delà d’un traitement uniforme.',
      ),
    ),
  ],
  Accommodation: [
    axis(
      axLegal,
      'Medium',
      bi(
        'Duty to accommodate applies to the point of undue hardship.',
        'L’obligation d’accommodement s’applique jusqu’à la contrainte excessive.',
      ),
      bi(
        'Document each option considered and why it was or was not feasible.',
        'Documentez chaque option envisagée et sa faisabilité.',
      ),
    ),
    axis(
      axRelations,
      'Low',
      bi('Plan is in place and working.', 'Le plan est en place et fonctionne.'),
      bi(
        'Keep the check-in supportive, not evaluative.',
        'Gardez le suivi axé sur le soutien, pas sur l’évaluation.',
      ),
    ),
    axis(
      axDocumentation,
      'Medium',
      bi(
        '90-day review must be documented to keep the plan current.',
        'L’examen à 90 jours doit être documenté pour garder le plan à jour.',
      ),
      bi(
        'Record the Jul 14 review outcome in the case file.',
        'Consignez le résultat de l’examen du 14 juillet au dossier.',
      ),
    ),
    axis(
      axTiming,
      'Medium',
      bi(
        '90-day modified-duties review due Jul 14.',
        'Examen des tâches modifiées à 90 jours dû le 14 juillet.',
      ),
      bi(
        'Confirm functional limitations are unchanged before the date.',
        'Confirmez que les limitations fonctionnelles sont inchangées avant la date.',
      ),
    ),
    axis(
      axPrivacy,
      'High',
      bi(
        'Medical-adjacent records — functional limitations only.',
        'Dossiers à caractère médical — limitations fonctionnelles seulement.',
      ),
      bi(
        'Restrict access; never request or store a diagnosis.',
        'Restreignez l’accès; ne demandez ni ne conservez jamais de diagnostic.',
      ),
    ),
    axis(
      axReputation,
      'Low',
      bi('Handled well, this builds trust.', 'Bien géré, ce dossier renforce la confiance.'),
      bi('No action needed.', 'Aucune action requise.'),
    ),
  ],
  Onboarding: [
    axis(
      axLegal,
      'Low',
      bi(
        'French-language documentation prepared; confirm whether French versions were required.',
        'Documentation en français préparée; confirmez si des versions françaises étaient requises.',
      ),
      bi(
        'Record the language-requirement confirmation before archiving.',
        'Consignez la confirmation de l’exigence linguistique avant l’archivage.',
      ),
    ),
    axis(
      axRelations,
      'Low',
      bi('Onboarding completed on schedule.', 'Intégration terminée à temps.'),
      bi(
        'Schedule the 30-day new-hire check-in.',
        'Planifiez le suivi des 30 jours du nouvel employé.',
      ),
    ),
    axis(
      axDocumentation,
      'Low',
      bi(
        'All acknowledgments signed and filed.',
        'Tous les accusés de réception signés et classés.',
      ),
      bi('No action needed.', 'Aucune action requise.'),
    ),
    axis(
      axTiming,
      'Low',
      bi('No open deadlines.', 'Aucune échéance ouverte.'),
      bi('No action needed.', 'Aucune action requise.'),
    ),
    axis(
      axPrivacy,
      'Low',
      bi('Standard employment records.', 'Dossiers d’emploi standards.'),
      bi(
        'Apply the normal retention schedule.',
        'Appliquez le calendrier de conservation habituel.',
      ),
    ),
    axis(
      axReputation,
      'Low',
      bi('No exposure identified.', 'Aucune exposition identifiée.'),
      bi('No action needed.', 'Aucune action requise.'),
    ),
  ],
}

/* ------------------------------------------------------------- case notes */

/**
 * Seeded case notes (prototype initial `caseNotes` state). The note text has
 * no FR in the prototype — FR self-authored.
 */
export const caseNotes: Record<string, CaseNote[]> = {
  case1: [
    {
      text: bi(
        'Confirmed with Finance that the ESA severance payroll threshold is met — statutory severance applies.',
        'Confirmé avec les Finances que le seuil de masse salariale de la LNE est atteint — l’indemnité de licenciement légale s’applique.',
      ),
      author: 'Riley Summers',
      time: 'Jul 5, 3:12 PM',
    },
  ],
}
