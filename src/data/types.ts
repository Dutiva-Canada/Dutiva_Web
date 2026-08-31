import type { Bi } from '@/i18n/core'
import type { CardTone } from '@/features/app/advisor/types'

/**
 * Entity types for the Dutiva sample fixtures, transcribed from the design
 * handoff prototype (`App v2.dc.html`, logic class seed builders).
 *
 * Display fields the prototype translates (via `frDict()` / `tr()` / inline
 * `L(en, fr)`) are typed `Bi`. Language-neutral fields (people names, ids,
 * raw dates like "Jul 5, 2026", numbers) stay `string` / `number`.
 */

/** Full tone ramp used by fixture data — the Advisor card ramp plus green success. */
export type Tone = CardTone | 'success'

/* ---------------------------------------------------------------- actions */

/**
 * Declarative action descriptor. Fixtures never carry `onClick` handlers —
 * views translate these into navigation (routes from CONVENTIONS.md) or
 * document-studio openings.
 */
export type FixtureAction =
  | { kind: 'open-case'; label: Bi; target: string; primary?: boolean }
  | { kind: 'open-employee'; label: Bi; target: string; primary?: boolean }
  | { kind: 'open-chat'; label: Bi; target: string; primary?: boolean }
  | { kind: 'open-compliance'; label: Bi; target?: string; primary?: boolean }
  | { kind: 'open-view'; label: Bi; target: string; primary?: boolean }
  | { kind: 'draft-doc'; label: Bi; target: string; primary?: boolean }

export interface FixtureCitation {
  label: Bi
}

/**
 * Tone card as stored in fixtures — mirrors the Advisor `ToneCardData` shape
 * (tone/title/body/citations) but declarative: no `onClick`, optional
 * `confidence` line, actions as `FixtureAction` descriptors.
 */
export interface FixtureToneCard {
  tone: Tone
  title: Bi
  body: Bi
  confidence?: Bi
  citations?: FixtureCitation[]
  actions?: FixtureAction[]
}

/* -------------------------------------------------------------- employees */

export interface EmployeeRiskFlag {
  tone: Tone
  title: Bi
  body: Bi
  /** Advisor chat thread backing this flag (prototype `risk.chatId`); null when none. */
  chatId: string | null
}

export interface Employee {
  /** Stable id, usable in /app/employees/:employeeId (e.g. 'e1'). */
  id: string
  name: string
  initials: string
  role: Bi
  /** Department derived by the prototype's `deptFor(role)`. */
  dept: Bi
  province: Bi
  status: Bi
  tone: Tone
  tenure: Bi
  insight: Bi
  risk: EmployeeRiskFlag | null
}

export type TimelineKind =
  'hire' | 'doc' | 'case' | 'comms' | 'compliance' | 'review' | 'comp' | 'ack' | 'wellbeing'

export interface TimelineEvent {
  date: string
  kind: TimelineKind
  text: Bi
  tone?: Tone
  /** Document template key (see documents.ts) this event opens. */
  docKey?: string
  /** Case id this event opens. */
  caseId?: string
}

export type LeaveStatus = 'Taken' | 'Active' | 'Completed'

export interface LeaveRecord {
  type: Bi
  period: Bi
  status: LeaveStatus
  note: Bi
}

/** Per-employee detail (prototype `empDetailMap()`, defaults merged in). */
export interface EmployeeDetail {
  employeeId: string
  salary: number
  band: string
  market: number
  equity: string
  manager: string
  startDate: string
  sentiment: number
  timeline: TimelineEvent[]
  /** Document template keys on file (documents.ts). */
  docs: string[]
  /** Case ids linked to this employee. */
  cases: string[]
  leave: LeaveRecord[]
}

/** One reporting branch of the org graph (prototype `buildOrgGraph()`). */
export interface OrgBranch {
  managerId: string
  dept: Bi
  reportIds: string[]
}

/** Pending compensation change (prototype `buildCompensationView()` changes). */
export interface CompChange {
  id: string
  employeeId: string
  title: Bi
  detail: Bi
  status: Bi
  tone: Tone
  requestedBy: string
  note: Bi
}

/** Wellbeing support signal (prototype `supportSignals()`). */
export interface SupportSignal {
  id: string
  /** null for team-level signals. */
  employeeId: string | null
  who: Bi
  type: Bi
  tone: Tone
  source: Bi
  confidence: Bi
  why: Bi
  action: Bi
  sensitivity: Bi
}

/* ------------------------------------------------------------------ cases */

export type CaseType = 'Termination' | 'Performance' | 'Accommodation' | 'Onboarding'

export interface CaseStep {
  label: Bi
  done: boolean
}

export interface CaseFile {
  /** Stable id, usable in /app/cases/:caseId (e.g. 'case1'). */
  id: string
  title: Bi
  type: CaseType
  typeLabel: Bi
  empId: string
  empName: string
  province: Bi
  status: Bi
  tone: Tone
  opened: string
  /** Machine-readable open date (YYYY-MM-DD) backing the `opened` display string. */
  openedISO: string
  owner: string
  due: string
  retention: Bi
  legalScope?: Bi
  /** Advisor chat thread backing this case. */
  chatId: string
  summary: Bi
  steps: CaseStep[]
}

export type RiskLevel = 'High' | 'Medium' | 'Low' | 'Pending'

export interface CaseRisk {
  level: RiskLevel
  levelLabel: Bi
  tone: Tone
  factors: Bi[]
}

export interface CaseRiskAxis {
  axis: Bi
  level: RiskLevel
  levelLabel: Bi
  reason: Bi
  mitigation: Bi
}

export interface CaseNote {
  text: Bi
  author: string
  time: string
}

/* ------------------------------------------------------------------ tasks */

export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: Bi
  due: Bi
  priority: TaskPriority
  done: boolean
  /** Advisor chat (and via cases.chatId, case) this task belongs to. */
  chatId: string
  owner: string
  jur: Bi
  blocked?: Bi
  evidence?: Bi
}

/* --------------------------------------------------------------- policies */

export interface Policy {
  id: string
  title: Bi
  status: Bi
  tone: Tone
  updated: Bi
}

/* ------------------------------------------------------------- compliance */

export type ComplianceSeverity = 'High' | 'Medium' | 'Low' | 'Resolved'

export interface ComplianceItem {
  id: string
  severity: ComplianceSeverity
  severityLabel: Bi
  tone: Tone
  title: Bi
  detail: Bi
  province: Bi
  /** Scheduled date (YYYY-MM-DD) when the item is a dated follow-up, not a standing risk. */
  dueISO?: string
  /** Employees affected, when the item traces to specific people. */
  affected?: number
  /** Advisor chat thread this flag traces back to. */
  chatId: string
  citations: FixtureCitation[]
  /** Recommended action (prototype `buildComplianceView().actionById`). */
  action: Bi
}

export interface ComplianceCategory {
  key: string
  label: Bi
  score: number
  tone: Tone
  open: number
}

export type ObligationStatus = 'ok' | 'progress' | 'needs' | 'overdue'

export interface Obligation {
  id: string
  area: Bi
  statute: Bi
  title: Bi
  /** Raw jurisdiction key ('Ontario' | 'Quebec' | 'Federal' …) used for filtering. */
  jur: string
  jurLabel: Bi
  due: Bi
  /** Machine-readable due date (YYYY-MM-DD) backing the `due` display string. */
  dueISO: string
  recurrence: Bi
  owner: string
  status: ObligationStatus
  dueSoon?: boolean
  /** Employees affected, when the obligation traces to specific people. */
  affected?: number
  evidence: Bi
}

export interface WatchlistItem {
  title: Bi
  status: Bi
  tone: Tone
  note: Bi
}

/* -------------------------------------------------------------- analytics */

export interface JurisdictionHeadcount {
  /** Stable key ('ON', 'BC', …, 'Federal'). */
  key: string
  label: Bi
  value: number
}

export interface ScoreHistoryPoint {
  /** First day of the month (YYYY-MM-01); views format the label per locale. */
  monthISO: string
  score: number
}

export interface PolicyAcknowledgmentCampaign {
  /** Policy register row the campaign belongs to. */
  policyId: string
  title: Bi
  signed: number
  total: number
}

/**
 * A dated per-person record with an expiry — a certification/training
 * credential or an employee document (work permit, visa, medical
 * certificate). `employeeId` is null when the person belongs to the wider
 * 82-person diorama rather than the individually modelled roster (same
 * pattern as task owners like Marcus Bell).
 */
export interface ExpiryRecord {
  id: string
  employeeId: string | null
  employeeName: string
  name: Bi
  jurisdiction: Bi
  expiryISO: string
}

export interface ProbationEndRecord {
  id: string
  employeeId: string | null
  employeeName: string
  role: Bi
  jurisdiction: Bi
  endISO: string
  /** Whether a probation-review task already exists for this person. */
  reviewTaskCreated: boolean
}

export interface LeaveOverviewRecord {
  id: string
  employeeId: string | null
  employeeName: string
  type: Bi
  /** Statutorily protected leave (reinstatement-sensitive). */
  protected: boolean
  /** Scheduled return (YYYY-MM-DD); null for ongoing arrangements. */
  returnISO: string | null
  /** Status-only context (e.g. a scheduled review) — never medical detail. */
  note?: Bi
}

export interface JurisdictionScore {
  key: string
  label: Bi
  score: number
}

/** Generic month/value series (headcount history and friends). */
export interface TrendPoint {
  monthISO: string
  value: number
}

export interface TurnoverStat {
  /** Rolling 12-month turnover, percent. */
  ratePct: number
  /** The same rolling rate one month earlier, for the delta. */
  priorRatePct: number
  priorMonthISO: string
}

/* ---------------------------------------------------------- communications */

export interface Communication {
  id: string
  title: Bi
  audience: Bi
  province: Bi
  status: Bi
  tone: Tone
  updated: Bi
  note: Bi
}

/** Advisor review dimensions on a communication (prototype `dims(...)`). */
export interface CommunicationReview {
  tone: boolean
  legal: boolean
  clarity: boolean
  policy: boolean
}

/** Extra per-communication data from the prototype's `buildCommunicationsView()`. */
export interface CommunicationDetail {
  communicationId: string
  audienceType: Bi
  bilingual: Bi
  linkedTo: Bi | null
  /** Sensitive sends open a review gate before "Mark reviewed & send". */
  sensitive: boolean
  review: CommunicationReview
  gateNote: Bi | null
}

/* ------------------------------------------------------------------ chats */

export type ChatBucket = 'today' | 'week' | 'older'

export type ChatFlowKey =
  'termination' | 'hiring' | 'policy' | 'performance' | 'accommodation' | 'onboarding'

export interface ChatMessageFixture {
  /** Prototype message id ('m1' …). */
  id: string
  role: 'user' | 'advisor'
  text?: Bi
  /** Structured user answers rendered as chips. */
  userChips?: Bi[]
  /** Advisor reasoning trace lines. */
  reasoning?: Bi[]
  cards?: FixtureToneCard[]
  /** Document template keys (documents.ts) offered as generate chips. */
  docs?: string[]
  /** Follow-up chip labels — keys into `followupReplies` (chats.ts). */
  followups?: string[]
}

export interface ChatThread {
  /** Prototype chat id ('c1' …). */
  id: string
  title: Bi
  folder: Bi | null
  pinned: boolean
  time: Bi
  bucket: ChatBucket
  flowKey: ChatFlowKey
  messages: ChatMessageFixture[]
}

/** Canned single-turn Advisor reply for a topic (prototype `buildLightFlows()`). */
export interface LightFlow {
  text: Bi
  reasoning?: Bi[]
  cards?: FixtureToneCard[]
  docs?: string[]
  followups?: string[]
}

/** Canned reply to a follow-up chip (prototype `buildFollowupReplies()`). */
export interface FollowupReply {
  /** Chip label shown to the user (EN string doubles as the lookup key). */
  label: Bi
  text: Bi
  reasoning?: Bi[]
  cards?: FixtureToneCard[]
  docs?: string[]
  /** Selecting this reply also logs an escalation task + toast in the prototype. */
  isEscalation?: boolean
}

/* ---------------------------------------------------------- notifications */

export interface Notification {
  id: string
  text: Bi
  time: Bi
  unread: boolean
}

/* -------------------------------------------------------------- documents */

/** Document Studio metadata rows (prototype `docMetaFor(title)`). */
export interface DocMeta {
  link: Bi
  jur: Bi
  governing: Bi
  template: string
  created: Bi
  createdBy: Bi
  reviewedBy: Bi
  legalReview: Bi
  retention: Bi
  assumptions: Bi
  missing: Bi
}

export interface DocumentTemplate {
  /** Stable key — the prototype's EN title, used everywhere as the cross-reference id. */
  key: string
  title: Bi
  category: Bi
  sections: Bi[]
  /** Matches the prototype's `isHighRiskDoc()` regex — export/signature gate applies. */
  highRisk: boolean
  /** Per-document overrides merged over `docMetaDefaults`. */
  meta?: Partial<DocMeta>
}

/* -------------------------------------------------------------- knowledge */

export interface KnowledgeItem {
  id: string
  title: Bi
  tag: Bi
}

/* --------------------------------------------------------------- calendar */

export interface CalendarEvent {
  /** Stable key for React lists. */
  id: string
  /** Day of the month (July 2026). */
  day: number
  /** Short date chip, e.g. "Jul 8" / "8 juil.". */
  dateLabel: Bi
  label: Bi
  tone: 'info' | 'warning'
}

export interface CalendarMonth {
  year: number
  /** 0-based month index (6 = July). */
  monthIndex: number
  monthLabel: Bi
  /** Day highlighted as "today" in the prototype. */
  todayDay: number
}

/* ---------------------------------------------------------------- memory */

/**
 * Advisor Memory model (`Advisor Memory.dc.html`): three scopes, two
 * confidence states only — Confirmed (authoritative source) vs Inferred
 * (Advisor-derived, never treated as fact until a human confirms). Every
 * fact carries provenance and a visibility scope. Memory supplies facts
 * only — risk, legal basis and citations are recomputed fresh every turn.
 */

export type MemoryScope = 'person' | 'case' | 'thread'

export type MemoryConfidence = 'confirmed' | 'inferred'

export type MemorySourceType = 'hris' | 'document' | 'chat' | 'manual' | 'inference' | 'case'

/** Source types that can affirm a confirmed fact — excludes Advisor inference alone. */
export type MemoryAuthoritativeSourceType = Exclude<MemorySourceType, 'inference'>

/** Who can see a fact: the HR team, case participants + counsel, or restricted. */
export type MemoryVisibility = 'hr' | 'case' | 'restricted'

export type MemoryCategory =
  'employment' | 'compensation' | 'matter' | 'record' | 'note' | 'case' | 'conversation'

/** When and through which source a confirmed fact was last affirmed. */
export interface MemoryConfirmation {
  /** ISO date (YYYY-MM-DD) of the confirmation event. */
  at: string
  source: { type: MemoryAuthoritativeSourceType; detail: Bi }
}

export interface MemoryFact {
  id: string
  scope: MemoryScope
  /**
   * Scope target: person → employee id (`e1`), case → case id (`case1`),
   * thread → chat id (`c1`) — the same ids the app's routes use.
   */
  entityId: string
  category: MemoryCategory
  statement: Bi
  confidence: MemoryConfidence
  /** Source that first established this memory entry. */
  source: { type: MemorySourceType; detail: Bi }
  /** ISO date when Advisor Memory learned or ingested this fact. */
  learnedAt: string
  /**
   * ISO date when the underlying fact became effective, when distinct from
   * {@link learnedAt} (e.g. hire date vs HRIS sync date). Omitted when N/A.
   */
  effectiveAt?: string | null
  /** Provenance of the latest confirmation; null while still inferred only. */
  confirmation: MemoryConfirmation | null
  visibility: MemoryVisibility
  /** Access-controlled by default (compensation, health). */
  sensitive: boolean
}
