import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type {
  ComplianceCategory,
  ComplianceItem,
  Obligation,
  ObligationStatus,
  Tone,
  WatchlistItem,
} from './types'

/**
 * Compliance data, transcribed from the prototype's `buildComplianceItems()`,
 * `complianceCategories()` and `buildComplianceView()` (recommended actions,
 * obligation register, regulatory watchlist).
 */

export const complianceItems: ComplianceItem[] = [
  {
    id: 'ci1',
    severity: 'High',
    severityLabel: bi('High', 'Élevé'),
    tone: 'risk',
    title: bi(
      'Jordan Mensah — notice exposure; no termination clause on file',
      'Jordan Mensah — exposition au préavis; aucune clause de licenciement au dossier',
    ),
    detail: bi(
      'No termination clause on file limits notice. Preliminary risk estimate: 9–12 months of pay in lieu of notice under common law, against the 8-week ESA termination notice/pay minimum. Statutory severance may also apply if eligibility requirements are met. Legal review recommended before finalizing.',
      'Aucune clause de licenciement au dossier. L’exposition en common law est estimée à 9-12 mois d’indemnité en tenant lieu de préavis, bien au-dessus du minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. Une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies. Un examen juridique est recommandé avant de finaliser.',
    ),
    province: bi('Ontario', 'Ontario'),
    chatId: 'c1',
    citations: [
      {
        label: bi(
          'ESA s.57 — Notice of termination',
          'LNE art. 57 — Délai de préavis de l’employeur',
        ),
      },
    ],
    action: bi(
      'Request counsel review before any offer; for internal contingency planning, model the upper end of the preliminary range pending that review.',
      'Demandez un examen juridique avant toute offre; pour la planification interne, modélisez la limite supérieure de la fourchette préliminaire en attendant cet examen.',
    ),
  },
  {
    id: 'ci2',
    severity: 'Medium',
    severityLabel: bi('Medium', 'Moyen'),
    tone: 'warning',
    title: bi(
      'Amara Okafor — accommodation review due in 3 days',
      'Amara Okafor — examen d’accommodement dû dans 3 jours',
    ),
    detail: bi(
      'Modified-duties accommodation is due for its scheduled 90-day review on July 14. Confirm functional limitations haven’t changed.',
      'L’accommodement en tâches modifiées doit faire l’objet de son examen prévu à 90 jours le 14 juillet. Confirmez que les limitations fonctionnelles n’ont pas changé.',
    ),
    province: bi('Ontario', 'Ontario'),
    chatId: 'c5',
    citations: [],
    action: bi(
      'Confirm functional limitations are unchanged at the July 14 review; keep diagnosis off file.',
      'Confirmez que les limitations fonctionnelles sont inchangées à l’examen du 14 juillet; gardez le diagnostic hors dossier.',
    ),
  },
  {
    id: 'ci3',
    severity: 'High',
    severityLabel: bi('High', 'Élevé'),
    tone: 'risk',
    title: bi(
      'Remote Work Policy not reviewed in 14 months',
      'Politique de télétravail non révisée depuis 14 mois',
    ),
    detail: bi(
      'You’ve added employees in 3 new employment jurisdictions since the last review — occupational health & safety and expense sections likely need updates.',
      'Vous avez ajouté des employés dans 3 nouvelles compétences depuis le dernier examen — les sections sur la SST et les dépenses doivent probablement être mises à jour.',
    ),
    province: bi('Multi-jurisdiction', 'Multijuridictionnel'),
    /* The calendar fixture schedules this review for Jul 17 (cal-remote-policy). */
    dueISO: '2026-07-17',
    chatId: 'c3',
    citations: [],
    action: bi(
      'Regenerate the Remote Work Policy with jurisdiction-specific OHS and expense sections this month.',
      'Régénérez la politique de télétravail avec des sections SST et dépenses propres à chaque compétence ce mois-ci.',
    ),
  },
  {
    id: 'ci4',
    severity: 'Medium',
    severityLabel: bi('Medium', 'Moyen'),
    tone: 'warning',
    title: bi(
      'Devon Clarke — PIP check-in due in 11 days',
      'Devon Clarke — suivi du PAR dû dans 11 jours',
    ),
    detail: bi(
      'The 30-day check-in for the attendance improvement plan falls on July 22.',
      'Le suivi à 30 jours du plan d’amélioration de l’assiduité tombe le 22 juillet.',
    ),
    province: bi('Ontario', 'Ontario'),
    chatId: 'c4',
    citations: [],
    action: bi(
      'Hold the documented 30-day PIP check-in on July 22 against measurable expectations.',
      'Tenez le suivi documenté du PAR à 30 jours le 22 juillet selon des attentes mesurables.',
    ),
  },
  {
    id: 'ci5',
    severity: 'Resolved',
    severityLabel: bi('Resolved', 'Résolu'),
    tone: 'success',
    title: bi(
      'Onboarding — Quebec French-language requirement',
      'Intégration — exigence linguistique française du Québec',
    ),
    detail: bi(
      'Onboarding documents for the Quebec office were generated in French by default, consistent with the Charter of the French Language.',
      'Les documents d’intégration du bureau du Québec ont été générés en français par défaut, conformément à la Charte de la langue française.',
    ),
    province: bi('Quebec', 'Québec'),
    chatId: 'c6',
    citations: [
      {
        label: bi(
          'Charter of the French Language (Québec)',
          'Charte de la langue française (Québec)',
        ),
      },
    ],
    action: bi(
      'No action — French-first onboarding satisfies the requirement. Keep as reference.',
      'Aucune action — l’intégration en français d’abord satisfait l’exigence. À conserver comme référence.',
    ),
  },
]

/** Overall workspace compliance score (prototype `buildComplianceView().score`). */
export const complianceScore = 82

export const complianceCategories: ComplianceCategory[] = [
  {
    key: 'termination',
    label: bi('Termination & notice', 'Cessation et préavis'),
    score: 61,
    tone: 'risk',
    open: 1,
  },
  {
    key: 'accommodation',
    label: bi('Leave & accommodation', 'Congés et accommodement'),
    score: 84,
    tone: 'warning',
    open: 1,
  },
  {
    key: 'policy',
    label: bi('Policies & documentation', 'Politiques et documentation'),
    score: 72,
    tone: 'warning',
    open: 2,
  },
  {
    key: 'language',
    label: bi('Language & jurisdiction', 'Langue et compétence'),
    score: 96,
    tone: 'success',
    open: 0,
  },
  {
    key: 'privacy',
    label: bi('Data & privacy (Law 25)', 'Données et confidentialité (Loi 25)'),
    score: 90,
    tone: 'success',
    open: 0,
  },
]

/* --------------------------------------------------- obligation register */

export const obligationStatusMeta: Record<ObligationStatus, { label: Bi; tone: Tone }> = {
  ok: { label: bi('Evidence on file', 'Preuve au dossier'), tone: 'success' },
  progress: { label: bi('In progress', 'En cours'), tone: 'info' },
  needs: { label: bi('Needs evidence', 'Preuve requise'), tone: 'warning' },
  overdue: { label: bi('Overdue', 'En retard'), tone: 'risk' },
}

export const obligations: Obligation[] = [
  {
    id: 'ob1',
    area: bi('Employment standards', 'Normes du travail'),
    statute: bi('ESA, 2000 (Ontario)', 'LNE, 2000 (Ontario)'),
    title: bi(
      'Vacation time & pay reconciliation',
      'Rapprochement du congé annuel et de l’indemnité de vacances',
    ),
    jur: 'Ontario',
    jurLabel: bi('Ontario', 'Ontario'),
    due: bi('Sep 30, 2026', '30 sept. 2026'),
    dueISO: '2026-09-30',
    recurrence: bi('Quarterly', 'Trimestriel'),
    owner: 'Marcus Bell',
    status: 'ok',
    evidence: bi(
      'Q2 payroll reconciliation filed Jun 30.',
      'Rapprochement de paie T2 déposé le 30 juin.',
    ),
  },
  {
    id: 'ob2',
    area: bi('Occupational health & safety', 'Santé et sécurité au travail'),
    statute: bi('OHSA (Ontario)', 'LSST (Ontario)'),
    title: bi(
      'Workplace violence & harassment program — annual review and training refresh',
      'Programme contre la violence et le harcèlement — examen annuel et formation',
    ),
    jur: 'Ontario',
    jurLabel: bi('Ontario', 'Ontario'),
    due: bi('Aug 15, 2026', '15 août 2026'),
    dueISO: '2026-08-15',
    recurrence: bi('Annual', 'Annuel'),
    owner: 'Riley Summers',
    status: 'needs',
    dueSoon: true,
    evidence: bi(
      '2025 training roster on file; 2026 refresh not yet scheduled.',
      'Liste de formation 2025 au dossier; rafraîchissement 2026 non planifié.',
    ),
  },
  {
    id: 'ob3',
    area: bi('Privacy — PIPEDA', 'Vie privée — LPRPDE'),
    statute: bi('PIPEDA (Federal)', 'LPRPDE (fédéral)'),
    title: bi(
      'Privacy breach response plan — annual review',
      'Plan de réponse aux atteintes à la vie privée — examen annuel',
    ),
    jur: 'Federal',
    jurLabel: bi('Federal', 'Fédéral'),
    due: bi('Oct 31, 2026', '31 oct. 2026'),
    dueISO: '2026-10-31',
    recurrence: bi('Annual', 'Annuel'),
    owner: 'Fatima Haddad',
    status: 'ok',
    evidence: bi(
      'Reviewed Nov 2025 — no changes required.',
      'Révisé en nov. 2025 — aucun changement requis.',
    ),
  },
  {
    id: 'ob4',
    area: bi('Privacy — Quebec Law 25', 'Vie privée — Loi 25 (Québec)'),
    statute: bi('Law 25 (Quebec)', 'Loi 25 (Québec)'),
    title: bi(
      'Privacy impact assessment — HRIS vendor change',
      'Évaluation des facteurs relatifs à la vie privée — changement de fournisseur SIRH',
    ),
    jur: 'Quebec',
    jurLabel: bi('Quebec', 'Québec'),
    due: bi('Jul 31, 2026', '31 juill. 2026'),
    dueISO: '2026-07-31',
    recurrence: bi('One-time', 'Ponctuel'),
    owner: 'Fatima Haddad',
    status: 'progress',
    dueSoon: true,
    evidence: bi(
      'Draft PIA in review alongside the vendor’s data-processing agreement.',
      'ÉFVP provisoire en cours d’examen avec l’entente de traitement des données du fournisseur.',
    ),
  },
  {
    id: 'ob5',
    area: bi('CASL', 'LCAP'),
    statute: bi('CASL (Federal)', 'LCAP (fédéral)'),
    title: bi(
      'Marketing consent records — semi-annual audit',
      'Registres de consentement marketing — audit semestriel',
    ),
    jur: 'Federal',
    jurLabel: bi('Federal', 'Fédéral'),
    due: bi('Was due Jun 30, 2026', 'Échéance dépassée : 30 juin 2026'),
    dueISO: '2026-06-30',
    recurrence: bi('Semi-annual', 'Semestriel'),
    owner: 'Marcus Bell',
    status: 'overdue',
    dueSoon: true,
    evidence: bi(
      'Consent log export not yet filed.',
      'Export du registre de consentement non déposé.',
    ),
  },
  {
    id: 'ob6',
    area: bi('Payroll & records', 'Paie et registres'),
    statute: bi('ESA, 2000 (Ontario)', 'LNE, 2000 (Ontario)'),
    title: bi(
      'Employment records retention check',
      'Vérification de la conservation des registres d’emploi',
    ),
    jur: 'Ontario',
    jurLabel: bi('Ontario', 'Ontario'),
    due: bi('Dec 15, 2026', '15 déc. 2026'),
    dueISO: '2026-12-15',
    recurrence: bi('Annual', 'Annuel'),
    owner: 'Marcus Bell',
    status: 'ok',
    evidence: bi('2025 retention check complete.', 'Vérification de conservation 2025 terminée.'),
  },
  {
    id: 'ob7',
    area: bi('Language (Quebec)', 'Langue (Québec)'),
    statute: bi('Charter of the French Language', 'Charte de la langue française'),
    title: bi(
      'French-language workplace communications review',
      'Examen des communications en français en milieu de travail',
    ),
    jur: 'Quebec',
    jurLabel: bi('Quebec', 'Québec'),
    due: bi('Sep 1, 2026', '1er sept. 2026'),
    dueISO: '2026-09-01',
    recurrence: bi('Annual', 'Annuel'),
    owner: 'Fatima Haddad',
    status: 'progress',
    evidence: bi(
      'Francization touchpoints under review.',
      'Points de francisation en cours d’examen.',
    ),
  },
  {
    id: 'ob8',
    area: bi('Accessibility (AODA)', 'Accessibilité (LAPHO)'),
    statute: bi('AODA (Ontario)', 'LAPHO (Ontario)'),
    title: bi(
      'Accessibility training — new hires',
      'Formation en accessibilité — nouveaux employés',
    ),
    jur: 'Ontario',
    jurLabel: bi('Ontario', 'Ontario'),
    due: bi('Jul 25, 2026', '25 juill. 2026'),
    dueISO: '2026-07-25',
    recurrence: bi('Each new hire', 'À chaque embauche'),
    owner: 'Riley Summers',
    status: 'needs',
    dueSoon: true,
    affected: 3,
    evidence: bi(
      '3 hires since May missing certificates.',
      '3 embauches depuis mai sans attestation.',
    ),
  },
]

/* --------------------------------------------------- regulatory watchlist */

export const regulatoryWatchlist: WatchlistItem[] = [
  {
    title: bi(
      'Ontario — ESA sick leave and medical certificate rules',
      'Ontario — congés de maladie (LNE) et règles sur les certificats médicaux',
    ),
    status: bi(
      'In force — guidance updated Feb 2026',
      'En vigueur — guide mis à jour en févr. 2026',
    ),
    tone: 'info',
    note: bi(
      'Confirm policies reflect the three-day leave and medical-note restrictions in current Ontario guidance.',
      'Confirmez que les politiques reflètent le congé de trois jours et les restrictions sur les certificats médicaux selon l’orientation ontarienne actuelle.',
    ),
  },
  {
    title: bi(
      'Quebec Law 25 — data portability phase',
      'Loi 25 (Québec) — volet portabilité des données',
    ),
    status: bi('In force since Sep 22, 2024', 'En vigueur depuis le 22 sept. 2024'),
    tone: 'warning',
    note: bi(
      'Gap review scheduled with the privacy owner.',
      'Analyse des écarts planifiée avec le responsable de la vie privée.',
    ),
  },
  {
    title: bi(
      'Federal — workplace harassment and violence prevention framework review',
      'Fédéral — examen du cadre de prévention du harcèlement et de la violence au travail',
    ),
    status: bi('Monitoring', 'Surveillance'),
    tone: 'info',
    note: bi(
      'Relevant to existing federally regulated roles; monitor the 2026 framework review for changes affecting policy or training.',
      'Pertinent pour les postes déjà sous réglementation fédérale; surveillez l’examen du cadre en 2026 pour tout changement touchant les politiques ou la formation.',
    ),
  },
]
