import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type {
  CompChange,
  Employee,
  EmployeeDetail,
  LeaveStatus,
  OrgBranch,
  SupportSignal,
  Tone,
} from './types'

/**
 * Dutiva employee demo fixtures, adapted from the design-handoff prototype.
 * Employee, detail, organization, compensation, and support-signal data have
 * been normalized for cross-fixture consistency, bilingual accuracy, and
 * compliance-safe demo behavior.
 */

export const employees: Employee[] = [
  {
    id: 'e1',
    name: 'Jordan Mensah',
    initials: 'JM',
    role: bi('Senior Operations Manager', 'Directeur principal des opérations'),
    dept: bi('Operations', 'Opérations'),
    jurisdiction: bi('Ontario', 'Ontario'),
    status: bi('Offboarding', 'Départ'),
    tone: 'risk',
    tenure: bi('8 yrs', '8 ans'),
    insight: bi(
      "Jordan's termination is in progress. No termination clause is on file, so the preliminary notice estimate runs well above the ESA minimum — legal review is in progress.",
      'Le licenciement de Jordan est en cours. Aucune clause de licenciement au dossier, donc l’estimation préliminaire dépasse largement le minimum LNE — l’examen juridique est en cours.',
    ),
    risk: {
      tone: 'risk',
      title: bi('Notice exposure risk', 'Risque d’exposition au préavis'),
      body: bi(
        'No termination clause on file — preliminary estimate: 9–12 months common-law exposure.',
        'Aucune clause de licenciement au dossier — estimation préliminaire : 9 à 12 mois d’exposition en common law.',
      ),
      chatId: 'c1',
    },
  },
  {
    id: 'e2',
    name: 'Priya Nair',
    initials: 'PN',
    role: bi('Senior Analyst', 'Analyste principale'),
    dept: bi('Strategy', 'Stratégie'),
    jurisdiction: bi('Ontario', 'Ontario'),
    status: bi('Offer accepted', 'Offre acceptée'),
    tone: 'info',
    tenure: bi('Starts in 2 weeks', 'Débute dans 2 semaines'),
    insight: bi(
      'Priya accepted her offer. Her 3-month service milestone is coming up after she starts — I’ll flag relevant onboarding and employment-standards considerations before then.',
      'Priya a accepté son offre. Son jalon de trois mois de service suivra son entrée en fonction — je signalerai d’ici là les considérations pertinentes en matière de normes d’emploi et d’intégration.',
    ),
    risk: null,
  },
  {
    id: 'e3',
    name: 'Marc-Étienne Roy',
    initials: 'MR',
    role: bi('Field Technician', 'Technicien de terrain'),
    dept: bi('Operations', 'Opérations'),
    jurisdiction: bi('Quebec', 'Québec'),
    status: bi('Onboarding', 'Intégration'),
    tone: 'info',
    tenure: bi('2 days', '2 jours'),
    insight: bi(
      'Onboarding package was sent in French by default, consistent with Quebec’s language requirements.',
      'La trousse d’intégration a été envoyée en français par défaut, conformément aux exigences linguistiques du Québec.',
    ),
    risk: null,
  },
  {
    id: 'e4',
    name: 'Sarah Whitcombe',
    initials: 'SW',
    role: bi('Customer Success Lead', 'Responsable de la réussite client'),
    dept: bi('Revenue', 'Revenus'),
    jurisdiction: bi('Alberta', 'Alberta'),
    status: bi('Active', 'Actif'),
    tone: 'success',
    tenure: bi('3.4 yrs', '3,4 ans'),
    insight: bi(
      'No open items on Sarah’s file — record is in good shape.',
      'Aucun élément en suspens au dossier de Sarah — tout est en ordre.',
    ),
    risk: null,
  },
  {
    id: 'e5',
    name: 'Devon Clarke',
    initials: 'DC',
    role: bi('Warehouse Associate', 'Préposé d’entrepôt'),
    dept: bi('Operations', 'Opérations'),
    jurisdiction: bi('Ontario', 'Ontario'),
    status: bi('On PIP', 'Sous PAR'),
    tone: 'warning',
    tenure: bi('1.8 yrs', '1,8 ans'),
    insight: bi(
      'Devon is on a performance improvement plan for attendance. The 30-day check-in is coming up in 11 days.',
      'Devon fait l’objet d’un plan d’amélioration du rendement lié à l’assiduité. Le suivi à 30 jours a lieu dans 11 jours.',
    ),
    risk: {
      tone: 'warning',
      title: bi('PIP check-in due in 11 days', 'Suivi du PAR dû dans 11 jours'),
      body: bi(
        'Review progress against the attendance expectations before the check-in.',
        'Examinez les progrès par rapport aux attentes d’assiduité avant le suivi.',
      ),
      chatId: 'c4',
    },
  },
  {
    id: 'e6',
    name: 'Amara Okafor',
    initials: 'AO',
    role: bi('Software Engineer', 'Ingénieure logicielle'),
    dept: bi('Engineering', 'Ingénierie'),
    jurisdiction: bi('Ontario', 'Ontario'),
    status: bi('Active', 'Actif'),
    tone: 'warning',
    tenure: bi('2.6 yrs', '2,6 ans'),
    insight: bi(
      'Amara is on modified duties for a documented medical accommodation. Next review is July 14.',
      'Amara est en tâches modifiées pour un accommodement médical documenté. Le prochain examen est le 14 juillet.',
    ),
    risk: {
      tone: 'warning',
      title: bi('Accommodation review due July 14', 'Examen d’accommodement dû le 14 juillet'),
      body: bi(
        'Confirm the modified duties are still appropriate before the review date.',
        'Confirmez que les tâches modifiées sont toujours appropriées avant la date d’examen.',
      ),
      chatId: 'c5',
    },
  },
  {
    id: 'e7',
    name: 'Liam Fraser',
    initials: 'LF',
    role: bi('Regional Sales Manager', 'Directeur régional des ventes'),
    dept: bi('Revenue', 'Revenus'),
    jurisdiction: bi('Federal', 'Fédéral'),
    status: bi('Active', 'Actif'),
    tone: 'success',
    tenure: bi('5.0 yrs', '5,0 ans'),
    insight: bi('No open items on Liam’s file.', 'Aucun élément en suspens au dossier de Liam.'),
    risk: null,
  },
  {
    id: 'e8',
    name: 'Chen Wei',
    initials: 'CW',
    role: bi('Marketing Coordinator', 'Coordonnateur marketing'),
    dept: bi('Marketing', 'Marketing'),
    jurisdiction: bi('Ontario', 'Ontario'),
    status: bi('Active', 'Actif'),
    tone: 'success',
    tenure: bi('0.9 yrs', '0,9 ans'),
    insight: bi('No open items on Chen’s file.', 'Aucun élément en suspens au dossier de Chen.'),
    risk: null,
  },
  {
    id: 'e9',
    name: 'Fatima Haddad',
    initials: 'FH',
    role: bi('People Operations Manager', 'Gestionnaire des opérations RH'),
    dept: bi('People', 'Personnel'),
    jurisdiction: bi('Ontario', 'Ontario'),
    status: bi('Active', 'Actif'),
    tone: 'success',
    tenure: bi('4.1 yrs', '4,1 ans'),
    insight: bi(
      'No open items on Fatima’s file. She co-manages this workspace.',
      'Aucun élément en suspens au dossier de Fatima. Elle cogère cet espace de travail.',
    ),
    risk: null,
  },
  {
    id: 'e10',
    name: 'Théo Lavoie',
    initials: 'TL',
    role: bi('Logistics Coordinator', 'Coordonnateur logistique'),
    dept: bi('Operations', 'Opérations'),
    jurisdiction: bi('Quebec', 'Québec'),
    status: bi('Active', 'Actif'),
    tone: 'info',
    tenure: bi('2.9 yrs', '2,9 ans'),
    insight: bi(
      'Théo’s compensation is sitting below the market midpoint for Quebec logistics roles — worth reviewing at the next cycle.',
      'La rémunération de Théo se situe sous le point milieu du marché pour les postes en logistique au Québec — à revoir au prochain cycle.',
    ),
    risk: null,
  },
  {
    id: 'e11',
    name: 'Grace Osei',
    initials: 'GO',
    role: bi('Financial Analyst', 'Analyste financière'),
    dept: bi('Revenue', 'Revenus'),
    jurisdiction: bi('Alberta', 'Alberta'),
    status: bi('Active', 'Actif'),
    tone: 'warning',
    tenure: bi('1.2 yrs', '1,2 ans'),
    insight: bi(
      'Grace flagged elevated workload in her last two wellbeing check-ins — sentiment is trending down.',
      'Grace a signalé une charge de travail élevée lors de ses deux derniers suivis de bien-être — le sentiment est en baisse.',
    ),
    risk: {
      tone: 'warning',
      title: bi('Wellbeing: workload strain', 'Bien-être : charge de travail'),
      body: bi(
        'Two consecutive check-ins mention sustained overtime. Consider a workload conversation.',
        'Deux suivis consécutifs mentionnent des heures supplémentaires soutenues. Envisagez une conversation sur la charge de travail.',
      ),
      chatId: null,
    },
  },
  {
    id: 'e12',
    name: 'Noah Bergeron',
    initials: 'NB',
    role: bi('Warehouse Lead', 'Chef d’entrepôt'),
    dept: bi('Operations', 'Opérations'),
    jurisdiction: bi('Manitoba', 'Manitoba'),
    status: bi('Active', 'Actif'),
    tone: 'success',
    tenure: bi('6.3 yrs', '6,3 ans'),
    insight: bi(
      'No open items on Noah’s file. Long-tenured and steady.',
      'Aucun élément en suspens au dossier de Noah. Ancien et stable.',
    ),
    risk: null,
  },
]

/* ----------------------------------------------------------- leave labels */

export const leaveStatusLabels: Record<LeaveStatus, Bi> = {
  Taken: bi('Taken', 'Pris'),
  Active: bi('Active', 'En cours'),
  Completed: bi('Completed', 'Terminé'),
}

export const leaveStatusTones: Record<LeaveStatus, Tone> = {
  Taken: 'info',
  Active: 'warning',
  Completed: 'success',
}

/* --------------------------------------------------------- per-emp detail */

const detailDefaults = {
  salary: null,
  band: '—',
  market: null,
  equity: '—',
  startDate: '—',
  sentiment: null,
  timeline: [],
  docs: [],
  cases: [],
  leave: [],
} satisfies Omit<EmployeeDetail, 'employeeId'>

const detail = (
  employeeId: string,
  overrides: Partial<Omit<EmployeeDetail, 'employeeId'>> = {},
): EmployeeDetail => ({
  employeeId,
  ...detailDefaults,
  ...overrides,
})

/**
 * Per-employee demo detail map, adapted from the prototype's
 * `empDetailMap()`. Unspecified factual fields remain explicitly unknown
 * rather than inheriting plausible employee facts. Timeline FR is
 * self-authored where the prototype provided English only.
 */
export const employeeDetails: Record<string, EmployeeDetail> = {
  e1: detail('e1', {
    salary: 118000,
    band: 'M3',
    market: 121000,
    equity: '0.00%',
    startDate: 'Mar 2018',
    sentiment: 62,
    timeline: [
      {
        date: 'Jul 6, 2026',
        kind: 'comms',
        text: bi(
          'Manager transition note shared with the Operations team',
          'Note de transition de gestionnaire partagée avec l’équipe des opérations',
        ),
      },
      {
        date: 'Jul 5, 2026',
        kind: 'doc',
        text: bi('Termination Letter generated', 'Lettre de licenciement générée'),
        docKey: 'T03',
      },
      {
        date: 'Jul 5, 2026',
        kind: 'doc',
        text: bi('Full & Final Release generated', 'Quittance complète et finale générée'),
        docKey: 'T17',
      },
      {
        date: 'Jul 2, 2026',
        kind: 'case',
        text: bi(
          'Termination case opened — restructuring, without cause',
          'Dossier de licenciement ouvert — restructuration, sans motif',
        ),
        tone: 'risk',
        caseId: 'case1',
      },
      {
        date: 'Jul 5, 2026',
        kind: 'compliance',
        text: bi(
          'Notice-exposure risk flagged — no termination clause on file',
          'Risque d’exposition au préavis signalé — aucune clause de licenciement au dossier',
        ),
      },
      {
        date: 'Mar 2026',
        kind: 'review',
        text: bi(
          'Performance review — Meets expectations',
          'Évaluation du rendement — Répond aux attentes',
        ),
      },
      {
        date: 'Jan 2025',
        kind: 'comp',
        text: bi(
          'Merit increase to $118,000 (+3.5%)',
          'Augmentation au mérite à 118 000 $ (+3,5 %)',
        ),
      },
      {
        date: 'Sep 2023',
        kind: 'ack',
        text: bi(
          'Acknowledged the updated Code of Conduct',
          'Accusé de réception du Code de conduite mis à jour',
        ),
      },
      {
        date: 'Mar 2018',
        kind: 'hire',
        text: bi('Hired as Operations Manager', 'Embauché comme directeur des opérations'),
      },
    ],
    docs: ['T03', 'T17', 'T18'],
    cases: ['case1'],
    leave: [
      {
        type: bi('Vacation', 'Vacances'),
        period: bi('Aug 4–8, 2025', '4–8 août 2025'),
        status: 'Taken',
        note: bi('5 days', '5 jours'),
      },
    ],
  }),
  e2: detail('e2'),
  e3: detail('e3'),
  e4: detail('e4'),
  e5: detail('e5', {
    salary: 54000,
    band: 'IC2',
    market: 56000,
    equity: '—',
    startDate: 'Oct 2024',
    sentiment: 58,
    timeline: [
      {
        date: 'Jul 2026',
        kind: 'doc',
        text: bi(
          'Performance Improvement Plan generated',
          'Plan d’amélioration du rendement généré',
        ),
        docKey: 'T16',
      },
      {
        date: 'Jun 2026',
        kind: 'case',
        text: bi(
          'Performance improvement plan started — attendance',
          'Plan d’amélioration du rendement démarré — assiduité',
        ),
        tone: 'warning',
        caseId: 'case2',
      },
      {
        date: 'May 2026',
        kind: 'comms',
        text: bi(
          'Attendance expectations shared in writing',
          'Attentes d’assiduité communiquées par écrit',
        ),
      },
      {
        date: 'Jan 2025',
        kind: 'ack',
        text: bi(
          'Acknowledged the Attendance Policy',
          'Accusé de réception de la politique d’assiduité',
        ),
      },
      {
        date: 'Oct 2024',
        kind: 'hire',
        text: bi('Hired as Warehouse Associate', 'Embauché comme préposé d’entrepôt'),
      },
    ],
    docs: ['T16', 'T06'],
    cases: ['case2'],
    leave: [
      {
        type: bi('Sick leave', 'Congé de maladie'),
        period: bi('May 12–14, 2026', '12–14 mai 2026'),
        status: 'Taken',
        note: bi(
          '3 days — ESA job-protected sick leave',
          '3 jours — congé de maladie protégé (LNE)',
        ),
      },
    ],
  }),
  e6: detail('e6', {
    salary: 102000,
    band: 'IC4',
    market: 104000,
    equity: '0.00%',
    startDate: 'Jan 2024',
    sentiment: 71,
    timeline: [
      {
        date: 'Jul 2026',
        kind: 'doc',
        text: bi('Accommodation Documentation generated', 'Documentation d’accommodement générée'),
        docKey: 'T19',
      },
      {
        date: 'Jul 2026',
        kind: 'case',
        text: bi(
          'Accommodation — modified duties, 90-day review',
          'Accommodement — tâches modifiées, examen à 90 jours',
        ),
        tone: 'warning',
        caseId: 'case3',
      },
      {
        date: 'Feb 2026',
        kind: 'comms',
        text: bi(
          'Medical Information Request Letter sent',
          'Lettre de demande de renseignements médicaux envoyée',
        ),
        docKey: 'T20',
      },
      {
        date: 'Jan 2024',
        kind: 'hire',
        text: bi('Hired as Software Engineer', 'Embauchée comme ingénieure logicielle'),
      },
    ],
    docs: ['T19', 'T20'],
    cases: ['case3'],
    leave: [
      {
        type: bi('Modified duties (accommodation)', 'Tâches modifiées (accommodement)'),
        period: bi('Apr 2026 – present', 'Avril 2026 – aujourd’hui'),
        status: 'Active',
        note: bi('90-day review due Jul 14, 2026', 'Examen à 90 jours dû le 14 juillet 2026'),
      },
      {
        type: bi('Medical leave', 'Congé médical'),
        period: bi('Jan 6 – Apr 4, 2026', '6 janvier – 4 avril 2026'),
        status: 'Completed',
        note: bi(
          'Return-to-work completed with modified duties',
          'Retour au travail terminé avec tâches modifiées',
        ),
      },
    ],
  }),
  e7: detail('e7'),
  e8: detail('e8'),
  e9: detail('e9'),
  e10: detail('e10', {
    salary: 61000,
    band: 'IC3',
    market: 68000,
    equity: '—',
    startDate: 'Aug 2023',
    sentiment: 74,
    timeline: [
      {
        date: 'Aug 2023',
        kind: 'hire',
        text: bi('Hired as Logistics Coordinator', 'Embauché comme coordonnateur logistique'),
        tone: 'info',
      },
    ],
  }),
  e11: detail('e11', {
    salary: 76000,
    band: 'IC3',
    market: 79000,
    equity: '—',
    startDate: 'Apr 2025',
    sentiment: 44,
    timeline: [
      {
        date: 'Jul 2026',
        kind: 'wellbeing',
        text: bi(
          'Check-in flagged sustained overtime',
          'Un suivi a signalé des heures supplémentaires soutenues',
        ),
        tone: 'warning',
      },
      {
        date: 'Apr 2025',
        kind: 'hire',
        text: bi('Hired as Financial Analyst', 'Embauchée comme analyste financière'),
        tone: 'info',
      },
    ],
  }),
  e12: detail('e12'),
}

/* -------------------------------------------------------------- org graph */

/** Workspace root (prototype `buildOrgGraph().root`). Not an Employee row — see orgRootReportIds. */
export const orgRoot = {
  name: 'Riley Summers',
  initials: 'RS',
  role: bi('Founder & Account Owner', 'Fondatrice et titulaire du compte'),
}

/**
 * Branch managers with a direct reporting line to orgRoot. Riley is the org-chart
 * root only; line-manager display uses orgRoot.name for these ids.
 */
export const orgRootReportIds: readonly string[] = ['e1', 'e7', 'e9']

/**
 * Direct-reporting branches under the workspace root. `dept` labels the
 * manager's organizational area on the org chart; each report's functional
 * `Employee.dept` may differ (e.g. Strategy under Revenue, Engineering under People).
 * Line-manager display is derived from this graph — see `directManagerFor` / `lineManagerLabel`.
 */
export const orgStructure: OrgBranch[] = [
  { managerId: 'e1', dept: bi('Operations', 'Opérations'), reportIds: ['e5', 'e10', 'e12', 'e3'] },
  { managerId: 'e9', dept: bi('People', 'Personnel'), reportIds: ['e8', 'e6'] },
  { managerId: 'e7', dept: bi('Revenue', 'Revenus'), reportIds: ['e4', 'e11', 'e2'] },
]

/** Profile placeholder when orgStructure has no direct-report edge for this person. */
export const UNKNOWN_LINE_MANAGER = '—'

const employeeById = new Map(employees.map((employee) => [employee.id, employee]))

/** Direct line manager Employee from orgStructure; null for orgRoot reports or unknown edges. */
export function directManagerFor(employeeId: string): Employee | null {
  const branch = orgStructure.find((b) => b.reportIds.includes(employeeId))
  if (!branch) return null
  return employeeById.get(branch.managerId) ?? null
}

export function reportsToOrgRoot(employeeId: string): boolean {
  return orgRootReportIds.includes(employeeId)
}

/** Display name for profile/case surfaces — orgRoot.name, Employee.name, or unknown. */
export function lineManagerLabel(employeeId: string): string {
  const manager = directManagerFor(employeeId)
  if (manager) return manager.name
  if (reportsToOrgRoot(employeeId)) return orgRoot.name
  return UNKNOWN_LINE_MANAGER
}

/* ------------------------------------------------- compensation sub-data */

/** Pending compensation changes (prototype `buildCompensationView()`). */
export const compChanges: CompChange[] = [
  {
    id: 'cc1',
    employeeId: 'e5',
    title: bi('Merit increase — Devon Clarke', 'Augmentation au mérite — Devon Clarke'),
    detail: bi(
      '$54,000 → $56,160 (+4%) · effective Sep 1, 2026',
      '54 000 $ → 56 160 $ (+4 %) · en vigueur le 1er sept. 2026',
    ),
    status: bi('Awaiting HR + Finance approval', 'En attente de l’approbation RH + Finances'),
    tone: 'warning',
    requestedBy: 'Marcus Bell',
    note: bi(
      'Requires HR/Finance approval before the Aug 25 payroll cut-off.',
      'Nécessite l’approbation RH/Finances avant la clôture de paie du 25 août.',
    ),
  },
  {
    id: 'cc2',
    employeeId: 'e10',
    title: bi('Market adjustment — Théo Lavoie', 'Ajustement au marché — Théo Lavoie'),
    detail: bi(
      '$61,000 → proposed $66,000 (+8.2%) · next comp cycle',
      '61 000 $ → 66 000 $ proposé (+8,2 %) · prochain cycle',
    ),
    status: bi(
      'Draft — additional comparator data required',
      'Ébauche — données comparatives supplémentaires requises',
    ),
    tone: 'info',
    requestedBy: 'Riley Summers',
    note: bi(
      'Two comparators on file; add at least one more before HR/Finance review.',
      'Deux comparateurs au dossier; ajoutez-en au moins un avant l’examen RH/Finances.',
    ),
  },
]

/** Compensation-positioning advisory card shown on the Compensation view. */
export const compPositioningCard = {
  title: bi(
    'Potential compensation positioning issue — review recommended',
    'Enjeu potentiel de positionnement salarial — examen recommandé',
  ),
  body: bi(
    'Théo Lavoie’s base salary is about 10% below the market midpoint for a comparable role. Additional comparator data and HR/Finance review are recommended before making a compensation decision.',
    'Le salaire de base de Théo Lavoie se situe à environ 10 % sous le point milieu du marché pour un poste comparable. Des données comparatives supplémentaires et un examen par les RH et les Finances sont recommandés avant de prendre une décision de rémunération.',
  ),
}

/* ---------------------------------------------------- wellbeing sub-data */

/** Support signals (prototype `supportSignals()`). */
export const supportSignals: SupportSignal[] = [
  {
    id: 'ws1',
    employeeId: 'e11',
    who: bi('Grace Osei', 'Grace Osei'),
    type: bi('Repeated overtime pattern', 'Heures supplémentaires répétées'),
    tone: 'warning',
    source: bi('Scheduling & time data', 'Données d’horaires et de temps'),
    confidence: bi('Medium', 'Moyenne'),
    why: bi(
      'More than 10 extra hours logged in each of the last 4 weeks, alongside two check-ins mentioning workload.',
      'Plus de 10 heures supplémentaires consignées chacune des 4 dernières semaines, et deux suivis mentionnant la charge de travail.',
    ),
    action: bi(
      'Manager check-in on workload rebalancing this week.',
      'Suivi du gestionnaire sur le rééquilibrage de la charge cette semaine.',
    ),
    sensitivity: bi('Medium — workload data only', 'Moyenne — données de charge seulement'),
  },
  {
    id: 'ws2',
    employeeId: 'e6',
    who: bi('Amara Okafor', 'Amara Okafor'),
    type: bi('Return-to-work follow-up', 'Suivi du retour au travail'),
    tone: 'warning',
    source: bi('Leave & accommodation records', 'Dossiers de congés et d’accommodements'),
    confidence: bi('High — scheduled', 'Élevée — planifié'),
    why: bi(
      'The 90-day modified-duties review is due Jul 14; functional fit should be reconfirmed.',
      'L’examen des tâches modifiées à 90 jours est dû le 14 juillet; l’adéquation fonctionnelle doit être reconfirmée.',
    ),
    action: bi(
      'Confirm modified duties still fit at the Jul 14 review.',
      'Confirmez que les tâches modifiées conviennent toujours à l’examen du 14 juillet.',
    ),
    sensitivity: bi('High — medical-adjacent record', 'Élevée — dossier à caractère médical'),
  },
  {
    id: 'ws3',
    employeeId: 'e5',
    who: bi('Devon Clarke', 'Devon Clarke'),
    type: bi(
      'Support offer alongside a performance process',
      'Offre de soutien parallèle à un processus de rendement',
    ),
    tone: 'info',
    source: bi('Case link — kept separate from the PIP', 'Lien de dossier — tenu séparé du PAR'),
    confidence: bi('Medium', 'Moyenne'),
    why: bi(
      'Attendance conversations are underway; a support dimension may exist. Handle support resources separately from the performance process to avoid feeding sensitive support information into discipline.',
      'Des conversations sur l’assiduité sont en cours; une dimension de soutien peut exister. Traitez les ressources de soutien séparément du processus de rendement afin d’éviter que des renseignements sensibles liés au soutien alimentent la discipline.',
    ),
    action: bi(
      'Share support resources; do not feed this signal into the PIP.',
      'Partagez les ressources de soutien; n’intégrez pas ce signal au PAR.',
    ),
    sensitivity: bi('High — do not link to discipline', 'Élevée — ne pas lier à la discipline'),
  },
  {
    id: 'ws4',
    employeeId: 'e10',
    who: bi('Théo Lavoie', 'Théo Lavoie'),
    type: bi('Unresolved support request', 'Demande de soutien non résolue'),
    tone: 'info',
    source: bi('Support requests', 'Demandes de soutien'),
    confidence: bi('High', 'Élevée'),
    why: bi(
      'An ergonomic equipment request has been open for 12 days.',
      'Une demande d’équipement ergonomique est ouverte depuis 12 jours.',
    ),
    action: bi('Close the loop on the equipment order.', 'Finalisez la commande d’équipement.'),
    sensitivity: bi('Low', 'Faible'),
  },
  {
    id: 'ws5',
    employeeId: null,
    who: bi('Operations team', 'Équipe des opérations'),
    type: bi('Team workload imbalance', 'Déséquilibre de la charge d’équipe'),
    tone: 'info',
    source: bi('Task & scheduling data', 'Données de tâches et d’horaires'),
    confidence: bi('Low — early pattern', 'Faible — tendance précoce'),
    why: bi(
      'Open tasks are concentrating on two people while the termination case is active.',
      'Les tâches ouvertes se concentrent sur deux personnes pendant que le dossier de licenciement est actif.',
    ),
    action: bi(
      'Review allocation at the next team lead sync.',
      'Révisez la répartition à la prochaine rencontre des chefs d’équipe.',
    ),
    sensitivity: bi('Low — team-level only', 'Faible — niveau d’équipe seulement'),
  },
]
