import type { Bi } from '@/i18n/core'

/**
 * Workspace-scoped types for the communications platform foundation.
 *
 * This is the Phase 1 planning-and-approval model: initiatives, content,
 * relationships, policy files, issues, sources and results. External publishing,
 * ad execution and AI drafting are intentionally out of scope for this first
 * implementation.
 */

export type CommsDomain =
  | 'pr'
  | 'corporate'
  | 'social'
  | 'public_affairs'
  | 'marketing'
  | 'advertising'
  | 'imc'

export type CommsInitiativeType =
  | 'campaign'
  | 'programme'
  | 'announcement'
  | 'policy_consultation'
  | 'event'
  | 'issue_response'
  | 'standalone'

export type CommsInitiativeStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'

export type CommsRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface CommsInitiative {
  id: string
  title: Bi
  type: CommsInitiativeType
  domain: CommsDomain
  owner: string
  audience: Bi
  intendedOutcome: Bi
  baseline?: string
  target?: string
  startDate?: string
  endDate?: string
  risk: CommsRiskLevel
  budget?: number
  currency?: string
  status: CommsInitiativeStatus
}

export interface CommsObjective {
  id: string
  initiativeId: string
  label: Bi
  baseline?: string
  target?: string
  period?: Bi
  owner: string
  evidenceSource?: Bi
}

export type CommsContentStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'superseded'
  | 'withdrawn'
  | 'rejected'

export type CommsDeliveryStatus =
  | 'not_queued'
  | 'ready'
  | 'scheduled'
  | 'paused'
  | 'sending'
  | 'confirmed'
  | 'failed'
  | 'unknown'
  | 'cancelled'

export type CommsChannel =
  | 'email'
  | 'intranet'
  | 'social_linkedin'
  | 'social_x'
  | 'press_release'
  | 'website'
  | 'newsletter'
  | 'meeting'
  | 'other'

export interface CommsContentItem {
  id: string
  initiativeId: string
  title: Bi
  language: 'en' | 'fr' | 'bilingual'
  channel: CommsChannel
  status: CommsContentStatus
  deliveryStatus: CommsDeliveryStatus
  body?: Bi
  revisionNote?: Bi
  dueDate?: string
  scheduledFor?: string
  /** IANA time zone used when interpreting scheduledFor. Defaults to America/Toronto. */
  timeZone?: string
  owner: string
  sourceRevisionId?: string | null
  /** True when an edit to a source-language variant needs French review. */
  needsTranslationReview?: boolean
  /** Human-readable note recorded when a delivery is confirmed, retried, or paused. */
  deliveryNote?: Bi
}

export type CommsExecutionAction =
  | 'schedule'
  | 'unschedule'
  | 'pause'
  | 'resume'
  | 'mark_sent'
  | 'mark_failed'
  | 'retry'
  | 'reconcile'
  | 'cancel'

export interface CommsExecutionEvent {
  id: string
  contentItemId: string
  action: CommsExecutionAction
  previousStatus?: CommsDeliveryStatus
  newStatus?: CommsDeliveryStatus
  actor: string
  note?: Bi
  /** ISO 8601 timestamp in UTC. */
  timestamp: string
}

export type CommsContactType = 'media' | 'institutional' | 'partner' | 'creator' | 'audience'

export interface CommsContact {
  id: string
  name: string
  type: CommsContactType
  organizationId?: string
  role?: Bi
  purpose?: Bi
  channelPreference?: Bi
  source?: Bi
  active: boolean
}

export interface CommsOrganization {
  id: string
  name: string
  type: Bi
  jurisdiction?: Bi
  notes?: Bi
}

export type CommsInteractionType =
  | 'inquiry'
  | 'comment'
  | 'dm'
  | 'pitch'
  | 'meeting'
  | 'submission'

export interface CommsInteraction {
  id: string
  initiativeId?: string
  contactId?: string
  type: CommsInteractionType
  source: Bi
  visibility: 'public' | 'internal' | 'restricted'
  summary: Bi
  responseTarget?: string
  owner: string
  status: 'open' | 'pending' | 'responded' | 'escalated' | 'closed'
  escalationReason?: Bi
  moderationReason?: Bi
}

export type CommsPolicyStage =
  | 'proposed'
  | 'enacted'
  | 'in_force'
  | 'consultation_open'
  | 'consultation_closed'

export interface CommsPolicyFile {
  id: string
  initiativeId?: string
  jurisdiction: Bi
  authority: Bi
  objective: Bi
  sourceUrl?: string
  stage: CommsPolicyStage
  deadline?: string
  owner: string
}

export type CommsIssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export type CommsIssueStatus = 'open' | 'monitoring' | 'resolved' | 'closed'

export interface CommsIssue {
  id: string
  initiativeId?: string
  title: Bi
  severity: CommsIssueSeverity
  status: CommsIssueStatus
  lead: string
  spokesperson?: string
  affectedChannels: CommsChannel[]
  restricted: boolean
  /** Free-text description — facts kept separate from allegations. */
  summary?: Bi
  resolution?: Bi
}

export type CommsSourceType =
  | 'official_notice'
  | 'news'
  | 'social'
  | 'press_release'
  | 'internal'
  | 'partner'
  | 'manual'

export interface CommsSource {
  id: string
  initiativeId?: string
  issueId?: string
  /** How this source was discovered. Manual entries are expected until a live connector is added. */
  sourceType: CommsSourceType
  url?: string
  publisher: Bi
  publishedDate?: string
  retrievedAt?: string
  jurisdiction?: Bi
  rights?: Bi
  classification: Bi
  /** How this source supports a claim or record. */
  supports?: Bi
}

export type CommsCoverageSentiment = 'positive' | 'neutral' | 'negative' | 'mixed'

export interface CommsCoverageItem {
  id: string
  initiativeId?: string
  sourceId?: string
  outlet: Bi
  headline: Bi
  language: 'en' | 'fr' | 'bilingual'
  publishedDate?: string
  url?: string
  /** Reach is recorded by the user; cross-platform reach is not de-duplicated. */
  reach?: number
  sentiment?: CommsCoverageSentiment
  provenance: 'manual' | 'provider' | 'ai_estimate'
  owner: string
  notes?: Bi
}

export type CommsSubmissionStatus = 'planned' | 'submitted' | 'recorded' | 'withdrawn'

export interface CommsSubmission {
  id: string
  initiativeId: string
  policyFileId?: string
  authority: Bi
  /** ISO 8601 date string. */
  submittedAt?: string
  deadline?: string
  /** Channel or method used (e.g. online portal, email, mail). */
  method: Bi
  /** Reference number or confirmation received from the authority. */
  confirmationRef?: string
  owner: string
  status: CommsSubmissionStatus
}

export type CommsFeedFormat = 'rss' | 'atom' | 'auto'

export interface CommsFeed {
  id: string
  /** Feed URL. Must allow CORS or be fetched through a proxy. */
  url: string
  label: Bi
  sourceType: CommsSourceType
  initiativeId?: string
  enabled: boolean
  format: CommsFeedFormat
  /** ISO 8601 timestamp of the last attempted sync. */
  lastFetchedAt?: string
  /** Outcome of the last attempted sync. */
  lastFetchStatus?: 'ok' | 'error'
  /** Human-readable outcome message, e.g. an error or item count. */
  lastFetchMessage?: string
  /** Level of government or scope the feed covers. */
  jurisdiction?: 'federal' | 'provincial' | 'municipal' | 'internal'
  /** When true, new feed items also create coverage drafts so a user can review reach and sentiment. */
  createCoverageDrafts?: boolean
}

export interface CommsMetric {
  id: string
  initiativeId: string
  name: Bi
  value?: number
  baseline?: number
  target?: number
  period?: Bi
  provenance: 'manual' | 'provider' | 'ai_estimate'
  owner: string
}

export type CommsApprovalDecision = 'approved' | 'rejected' | 'changes_requested'

export interface CommsApproval {
  id: string
  contentItemId: string
  approver: string
  policyVersion?: string
  decision: CommsApprovalDecision
  rationale?: Bi
  decidedAt: string
}

export interface CommsBrandClaim {
  id: string
  text: Bi
  evidence: Bi
  owner: string
  reviewDate?: string
  status: 'active' | 'expired' | 'rejected'
}

export interface CommsWorkspaceState {
  initiatives: CommsInitiative[]
  objectives: CommsObjective[]
  contentItems: CommsContentItem[]
  contacts: CommsContact[]
  organizations: CommsOrganization[]
  interactions: CommsInteraction[]
  policyFiles: CommsPolicyFile[]
  issues: CommsIssue[]
  sources: CommsSource[]
  feeds: CommsFeed[]
  coverageItems: CommsCoverageItem[]
  submissions: CommsSubmission[]
  metrics: CommsMetric[]
  approvals: CommsApproval[]
  brandClaims: CommsBrandClaim[]
  /** Audit trail of manual delivery actions. Not a provider log. */
  executionEvents: CommsExecutionEvent[]
}
