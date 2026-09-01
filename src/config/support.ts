import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/**
 * Single source of truth for Dutiva's digital-first customer support model:
 * channels, business hours, response targets, priority/status/category
 * vocabularies, and escalation reasons. Every support surface (public support
 * page, Help Centre, request form, admin dashboard, email templates,
 * acknowledgements) reads channels/hours/targets from here — nothing is
 * duplicated in components, so the founder can change hours, targets, or an
 * address in one place.
 *
 * Support is asynchronous and self-service by default. Telephone/video is
 * offered only as a scheduled, exceptional escalation (see ESCALATION_REASONS)
 * — there is no routine inbound phone channel and no 24/7 staffed support.
 * Labels are bilingual `Bi` pairs rendered with `x()` (the data-field pattern),
 * so the config stays self-contained without catalogue-key coupling.
 */

// ── Channels ─────────────────────────────────────────────────────────────

export type SupportChannelId =
  'support' | 'privacy' | 'security' | 'accessibility' | 'billing' | 'sales'

export interface SupportChannel {
  id: SupportChannelId
  /** The only place these addresses are defined — never inline them. */
  email: `${string}@dutiva.ca`
  /** Customer-facing purpose. */
  purpose: Bi
  /**
   * Whether the channel accepts requests before a Dutiva account exists.
   * Account/workspace issues prefer the authenticated form; the rest have a
   * legitimate signed-out entry point (sales, accessibility, security, privacy).
   */
  publicIntake: boolean
  /** Handled outside the ordinary product-ticket queue (distinct workflow). */
  restrictedHandling: boolean
}

export const SUPPORT_CHANNELS: readonly SupportChannel[] = [
  {
    id: 'support',
    email: 'support@dutiva.ca',
    purpose: bi(
      'Help Centre, product questions, and general support requests.',
      'Centre d’aide, questions sur le produit et demandes de soutien générales.',
    ),
    publicIntake: true,
    restrictedHandling: false,
  },
  {
    id: 'billing',
    email: 'billing@dutiva.ca',
    purpose: bi(
      'Invoices, subscriptions, payments, and billing disputes.',
      'Factures, abonnements, paiements et différends de facturation.',
    ),
    publicIntake: false,
    restrictedHandling: false,
  },
  {
    id: 'privacy',
    email: 'privacy@dutiva.ca',
    purpose: bi(
      'Privacy requests and questions under PIPEDA and Québec Law 25.',
      'Demandes et questions de confidentialité en vertu de la LPRPDE et de la Loi 25 du Québec.',
    ),
    publicIntake: true,
    restrictedHandling: true,
  },
  {
    id: 'security',
    email: 'security@dutiva.ca',
    purpose: bi(
      'Vulnerability reports and security concerns.',
      'Signalements de vulnérabilités et préoccupations de sécurité.',
    ),
    publicIntake: true,
    restrictedHandling: true,
  },
  {
    id: 'accessibility',
    email: 'accessibility@dutiva.ca',
    purpose: bi(
      'Accessibility barriers and requests for an alternative communication method.',
      'Obstacles à l’accessibilité et demandes d’une autre méthode de communication.',
    ),
    publicIntake: true,
    restrictedHandling: true,
  },
  {
    id: 'sales',
    email: 'sales@dutiva.ca',
    purpose: bi(
      'Plans, onboarding, and enterprise enquiries.',
      'Forfaits, intégration et demandes pour entreprises.',
    ),
    publicIntake: true,
    restrictedHandling: false,
  },
] as const

export function supportChannel(id: SupportChannelId): SupportChannel {
  const channel = SUPPORT_CHANNELS.find((c) => c.id === id)
  if (!channel) throw new Error(`Unknown support channel: ${id}`)
  return channel
}

// ── Business hours ───────────────────────────────────────────────────────

/**
 * Practical default: Monday–Friday, 09:00–17:00 Eastern, excluding Ontario
 * statutory holidays. The IANA zone drives DST correctly; the holiday set
 * lives in `src/features/support/triage.ts` (computed per year).
 */
export const SUPPORT_HOURS = {
  timezone: 'America/Toronto',
  timezoneLabel: bi('Eastern Time', 'heure de l’Est'),
  /** 0 = Sunday … 6 = Saturday. */
  businessDays: [1, 2, 3, 4, 5] as const,
  startHour: 9,
  endHour: 17,
  holidayJurisdiction: bi('Ontario statutory holidays', 'jours fériés légaux de l’Ontario'),
} as const

// ── Priority & response targets ──────────────────────────────────────────

export type SupportPriority = 'critical' | 'high' | 'standard' | 'low'

export type ResponseTargetUnit = 'business_hours' | 'business_days'

export interface ResponseTarget {
  priority: SupportPriority
  amount: number
  unit: ResponseTargetUnit
  label: Bi
}

/**
 * Published *initial-response* targets — service targets, not contractual
 * guarantees and not resolution times. Change them here only.
 */
export const RESPONSE_TARGETS: Record<SupportPriority, ResponseTarget> = {
  critical: {
    priority: 'critical',
    amount: 4,
    unit: 'business_hours',
    label: bi('within 4 business hours', 'dans un délai de 4 heures ouvrables'),
  },
  high: {
    priority: 'high',
    amount: 1,
    unit: 'business_days',
    label: bi('within 1 business day', 'dans un délai de 1 jour ouvrable'),
  },
  standard: {
    priority: 'standard',
    amount: 2,
    unit: 'business_days',
    label: bi('within 2 business days', 'dans un délai de 2 jours ouvrables'),
  },
  low: {
    priority: 'low',
    amount: 5,
    unit: 'business_days',
    label: bi('within 5 business days', 'dans un délai de 5 jours ouvrables'),
  },
}

export const PRIORITY_LABELS: Record<SupportPriority, Bi> = {
  critical: bi('Critical', 'Critique'),
  high: bi('High', 'Élevée'),
  standard: bi('Standard', 'Standard'),
  low: bi('Low', 'Faible'),
}

// ── Ticket status lifecycle ──────────────────────────────────────────────

export type SupportStatus =
  | 'new'
  | 'triaged'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'waiting_on_dutiva'
  | 'scheduled_call'
  | 'resolved'
  | 'closed'

export const STATUS_ORDER: readonly SupportStatus[] = [
  'new',
  'triaged',
  'in_progress',
  'waiting_on_customer',
  'waiting_on_dutiva',
  'scheduled_call',
  'resolved',
  'closed',
] as const

export const STATUS_LABELS: Record<SupportStatus, Bi> = {
  new: bi('New', 'Nouvelle'),
  triaged: bi('Triaged', 'Triée'),
  in_progress: bi('In progress', 'En cours'),
  waiting_on_customer: bi('Waiting on you', 'En attente de votre réponse'),
  waiting_on_dutiva: bi('Waiting on Dutiva', 'En attente de Dutiva'),
  scheduled_call: bi('Call scheduled', 'Appel planifié'),
  resolved: bi('Resolved', 'Réglée'),
  closed: bi('Closed', 'Fermée'),
}

// ── Request categories ───────────────────────────────────────────────────

export type SupportCategory =
  | 'account_access'
  | 'billing'
  | 'technical'
  | 'product_question'
  | 'privacy'
  | 'security'
  | 'accessibility'
  | 'complaint'
  | 'sales'
  | 'other'

export interface SupportCategoryDef {
  id: SupportCategory
  label: Bi
  /** Where this category routes for internal handling. */
  channel: SupportChannelId
  /** Handled off the ordinary product-ticket path (privacy/security/etc.). */
  restrictedHandling: boolean
  /** May be submitted before an account exists. */
  allowPublic: boolean
}

export const SUPPORT_CATEGORIES: readonly SupportCategoryDef[] = [
  {
    id: 'account_access',
    label: bi('Account access', 'Accès au compte'),
    channel: 'support',
    restrictedHandling: false,
    allowPublic: false,
  },
  {
    id: 'billing',
    label: bi('Billing', 'Facturation'),
    channel: 'billing',
    restrictedHandling: false,
    allowPublic: false,
  },
  {
    id: 'technical',
    label: bi('Technical issue', 'Problème technique'),
    channel: 'support',
    restrictedHandling: false,
    allowPublic: false,
  },
  {
    id: 'product_question',
    label: bi('Product question', 'Question sur le produit'),
    channel: 'support',
    restrictedHandling: false,
    allowPublic: true,
  },
  {
    id: 'privacy',
    label: bi('Privacy request', 'Demande de confidentialité'),
    channel: 'privacy',
    restrictedHandling: true,
    allowPublic: true,
  },
  {
    id: 'security',
    label: bi('Security concern', 'Préoccupation de sécurité'),
    channel: 'security',
    restrictedHandling: true,
    allowPublic: true,
  },
  {
    id: 'accessibility',
    label: bi('Accessibility feedback', 'Rétroaction sur l’accessibilité'),
    channel: 'accessibility',
    restrictedHandling: true,
    allowPublic: true,
  },
  {
    id: 'complaint',
    label: bi('Complaint or escalation', 'Plainte ou escalade'),
    channel: 'support',
    restrictedHandling: true,
    allowPublic: false,
  },
  {
    id: 'sales',
    label: bi('Sales or onboarding', 'Ventes ou intégration'),
    channel: 'sales',
    restrictedHandling: false,
    allowPublic: true,
  },
  {
    id: 'other',
    label: bi('Other', 'Autre'),
    channel: 'support',
    restrictedHandling: false,
    allowPublic: false,
  },
] as const

export function supportCategory(id: SupportCategory): SupportCategoryDef {
  const category = SUPPORT_CATEGORIES.find((c) => c.id === id)
  if (!category) throw new Error(`Unknown support category: ${id}`)
  return category
}

// ── Impact & urgency (customer-described; never a forced priority) ────────

export type SupportImpact = 'blocking' | 'major' | 'minor' | 'none'
export type SupportUrgency = 'urgent' | 'soon' | 'whenever'

export const IMPACT_LABELS: Record<SupportImpact, Bi> = {
  blocking: bi(
    'I can’t use an essential part of Dutiva',
    'Je ne peux pas utiliser une partie essentielle de Dutiva',
  ),
  major: bi('A key task is seriously affected', 'Une tâche importante est sérieusement touchée'),
  minor: bi('Inconvenient, but I can continue', 'Gênant, mais je peux continuer'),
  none: bi('No impact — a question or suggestion', 'Aucun impact — une question ou une suggestion'),
}

export const URGENCY_LABELS: Record<SupportUrgency, Bi> = {
  urgent: bi('Time-sensitive', 'Urgent'),
  soon: bi('Fairly soon', 'Assez bientôt'),
  whenever: bi('No particular deadline', 'Aucun échéancier particulier'),
}

// ── Escalation (scheduled phone/video only) ──────────────────────────────

export type EscalationType = 'phone' | 'video' | 'none'

export type EscalationReasonId =
  | 'account_recovery'
  | 'accessibility_accommodation'
  | 'security_concern'
  | 'billing_dispute'
  | 'enterprise_onboarding'
  | 'unresolvable_in_writing'
  | 'sensitive_complaint'
  | 'retention'

/**
 * The narrow set of circumstances where a scheduled telephone/video
 * appointment may be offered — always after written triage, never a public
 * "call us now" flow.
 */
export const ESCALATION_REASONS: Record<EscalationReasonId, Bi> = {
  account_recovery: bi('Complex account recovery', 'Récupération de compte complexe'),
  accessibility_accommodation: bi(
    'Accessibility accommodation',
    'Mesure d’adaptation en matière d’accessibilité',
  ),
  security_concern: bi('Serious security concern', 'Préoccupation de sécurité sérieuse'),
  billing_dispute: bi('Escalated billing dispute', 'Différend de facturation escaladé'),
  enterprise_onboarding: bi('Enterprise onboarding', 'Intégration pour entreprise'),
  unresolvable_in_writing: bi(
    'An issue that cannot reasonably be resolved in writing',
    'Une situation qui ne peut raisonnablement être réglée par écrit',
  ),
  sensitive_complaint: bi(
    'A sensitive complaint where written communication is unsuitable',
    'Une plainte sensible pour laquelle la communication écrite ne convient pas',
  ),
  retention: bi(
    'Exceptional customer-retention circumstances',
    'Circonstances exceptionnelles de fidélisation',
  ),
}

// ── Preferred response method ────────────────────────────────────────────

export type ResponseMethod = 'email' | 'in_app' | 'scheduled_call'

export const RESPONSE_METHOD_LABELS: Record<ResponseMethod, Bi> = {
  email: bi('Email', 'Courriel'),
  in_app: bi('In-app ticket reply', 'Réponse dans le billet, dans l’application'),
  scheduled_call: bi(
    'Request a scheduled call (subject to review)',
    'Demander un appel planifié (sous réserve d’examen)',
  ),
}

// ── Ticket sources ───────────────────────────────────────────────────────

export type TicketSource = 'app_form' | 'public_form' | 'email' | 'ai_escalation'
