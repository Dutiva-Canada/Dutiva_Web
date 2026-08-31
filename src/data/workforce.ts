import { bi } from '@/i18n/core'
import type { ExpiryRecord, LeaveOverviewRecord, ServiceMilestoneRecord } from './types'

/**
 * Workforce records behind the Analytics Phase 2 cards: certifications &
 * training, dated employee documents, probation ends, and the leave
 * overview. All dates are read against the diorama's fixed today
 * (July 11, 2026 — see `demoTodayISO`).
 *
 * People with an `employeeId` are the modelled roster; the rest belong to
 * the wider 82-person company, like the prototype's task owners (Marcus
 * Bell, Morgan Chen) who exist by name only.
 */

/* ── Certifications & training (expiring within 90 days) ─────────────────
   Buckets vs Jul 11: expired 1 · ≤30 2 · 31–60 2 · 61–90 2. Devon (the
   attendance-PIP warehouse file) also holds the lapsed forklift ticket —
   expired items feed the Needs attention card. */
export const certifications: ExpiryRecord[] = [
  {
    id: 'cert-devon-forklift',
    employeeId: 'e5',
    employeeName: 'Devon Clarke',
    name: bi('Forklift operator certificate', 'Attestation de cariste'),
    jurisdiction: bi('Ontario', 'Ontario'),
    expiryISO: '2026-06-28',
  },
  {
    id: 'cert-noah-firstaid',
    employeeId: 'e12',
    employeeName: 'Noah Bergeron',
    name: bi('First Aid / CPR-C', 'Secourisme / RCR-C'),
    jurisdiction: bi('Manitoba', 'Manitoba'),
    expiryISO: '2026-07-18',
  },
  {
    id: 'cert-marc-whmis',
    employeeId: 'e3',
    employeeName: 'Marc-Étienne Roy',
    name: bi('WHMIS 2015 training', 'Formation SIMDUT 2015'),
    jurisdiction: bi('Quebec', 'Québec'),
    expiryISO: '2026-07-30',
  },
  {
    id: 'cert-theo-tdg',
    employeeId: 'e10',
    employeeName: 'Théo Lavoie',
    name: bi('TDG certificate (road)', 'Attestation TMD (routier)'),
    jurisdiction: bi('Quebec', 'Québec'),
    expiryISO: '2026-08-22',
  },
  {
    id: 'cert-fatou-firstaid',
    employeeId: null,
    employeeName: 'Fatou Diallo',
    name: bi('First Aid / CPR-C', 'Secourisme / RCR-C'),
    jurisdiction: bi('British Columbia', 'Colombie-Britannique'),
    expiryISO: '2026-08-30',
  },
  {
    id: 'cert-sarah-jhsc',
    employeeId: 'e4',
    employeeName: 'Sarah Whitcombe',
    name: bi('JHSC member certification', 'Attestation de membre du CMSST'),
    jurisdiction: bi('Alberta', 'Alberta'),
    expiryISO: '2026-09-08',
  },
  {
    id: 'cert-aiden-forklift',
    employeeId: null,
    employeeName: 'Aiden McNeil',
    name: bi('Forklift operator certificate', 'Attestation de cariste'),
    jurisdiction: bi('Ontario', 'Ontario'),
    expiryISO: '2026-09-26',
  },
]

/* ── Employee documents with an expiry ───────────────────────────────────
   An expiring work permit is a compliance event: expired and ≤30-day rows
   are always escalated into Needs attention. */
export const employeeDocuments: ExpiryRecord[] = [
  {
    id: 'doc-chen-permit',
    employeeId: 'e8',
    employeeName: 'Chen Wei',
    name: bi('Work permit', 'Permis de travail'),
    jurisdiction: bi('Ontario', 'Ontario'),
    expiryISO: '2026-07-28',
  },
  {
    id: 'doc-amara-pr',
    employeeId: 'e6',
    employeeName: 'Amara Okafor',
    name: bi('Permanent resident card', 'Carte de résidente permanente'),
    jurisdiction: bi('Ontario', 'Ontario'),
    expiryISO: '2026-08-25',
  },
  {
    id: 'doc-theo-medical',
    employeeId: 'e10',
    employeeName: 'Théo Lavoie',
    name: bi('Driver medical certificate', 'Certificat médical de conducteur'),
    jurisdiction: bi('Quebec', 'Québec'),
    expiryISO: '2026-09-15',
  },
]

/* ── Service milestones ending within 30 days ────────────────────────────
   Priya's Jul 25 milestone comes from the calendar fixture
   (cal-priya-probation); her review task exists — the reminder is on the
   calendar. Jasleen's doesn't yet, which is exactly what the card flags. */
export const serviceMilestones: ServiceMilestoneRecord[] = [
  {
    id: 'prob-priya',
    employeeId: 'e2',
    employeeName: 'Priya Nair',
    role: bi('Senior Analyst', 'Analyste principale'),
    jurisdiction: bi('Ontario', 'Ontario'),
    endISO: '2026-07-25',
    reviewTaskCreated: true,
  },
  {
    id: 'prob-jasleen',
    employeeId: null,
    employeeName: 'Jasleen Kaur',
    role: bi('Warehouse Associate', 'Préposée d’entrepôt'),
    jurisdiction: bi('Ontario', 'Ontario'),
    endISO: '2026-07-21',
    reviewTaskCreated: false,
  },
  {
    id: 'prob-owen',
    employeeId: null,
    employeeName: 'Owen Tremblay',
    role: bi('Dispatcher', 'Répartiteur'),
    jurisdiction: bi('Quebec', 'Québec'),
    endISO: '2026-07-29',
    reviewTaskCreated: true,
  },
]

/** @deprecated Use {@link serviceMilestones}. */
export const probationEnds = serviceMilestones

/* ── Leave overview (status only — no balances, no medical detail) ───────
   Amara is the roster's one active leave-adjacent arrangement (modified
   duties, ongoing — the 90-day review is the date that matters); the
   others are from the wider company. */
export const leaveOverview: LeaveOverviewRecord[] = [
  {
    id: 'leave-karan',
    employeeId: null,
    employeeName: 'Karan Dhillon',
    type: bi('Vacation', 'Vacances'),
    protected: false,
    returnISO: '2026-07-10',
  },
  {
    id: 'leave-rosa',
    employeeId: null,
    employeeName: 'Rosa Almeida',
    type: bi('Parental leave', 'Congé parental'),
    protected: true,
    returnISO: '2026-07-16',
  },
  {
    id: 'leave-ingrid',
    employeeId: null,
    employeeName: 'Ingrid Halvorsen',
    type: bi('Medical leave', 'Congé médical'),
    protected: true,
    returnISO: '2026-08-24',
  },
  {
    id: 'leave-amara',
    employeeId: 'e6',
    employeeName: 'Amara Okafor',
    type: bi('Modified duties (accommodation)', 'Tâches modifiées (accommodement)'),
    protected: true,
    returnISO: null,
    note: bi('90-day review Jul 14', 'Examen à 90 jours le 14 juill.'),
  },
]
