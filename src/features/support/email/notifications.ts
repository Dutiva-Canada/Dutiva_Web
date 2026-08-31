import type { SupportCategory, SupportPriority } from '@/config/support'
import type { NotificationKind } from './templates'

/**
 * Notification rules — the canonical, tested reference. The create-support-ticket
 * and support-agent-action edge functions mirror `acknowledgementKind` and
 * `operatorChannel` when they enqueue to support_notifications (kept in sync the
 * same way suggestPriority is). `channel` tells the (future) send worker whether
 * to send now or roll into a digest.
 */

export type NotificationChannel = 'immediate' | 'digest'

export interface NotificationSpec {
  kind: NotificationKind
  audience: 'customer' | 'operator'
  channel: NotificationChannel
}

/** The customer acknowledgement kind for a new ticket of this category. */
export function acknowledgementKind(category: SupportCategory): NotificationKind {
  switch (category) {
    case 'privacy':
      return 'privacy_ack'
    case 'security':
      return 'security_ack'
    case 'accessibility':
      return 'accessibility_ack'
    case 'complaint':
      return 'complaint_ack'
    default:
      return 'ticket_received'
  }
}

/**
 * When the operator is alerted. Immediate for anything time-sensitive — a
 * credible security report, or a critical/high triage — otherwise it rolls into
 * the scheduled digest so standard/low tickets don't interrupt.
 */
export function operatorChannel(
  category: SupportCategory,
  priority: SupportPriority,
): NotificationChannel {
  if (category === 'security') return 'immediate'
  if (priority === 'critical' || priority === 'high') return 'immediate'
  return 'digest'
}

/** Notifications to enqueue when a ticket is created. */
export function notificationsForNewTicket(
  category: SupportCategory,
  priority: SupportPriority,
): NotificationSpec[] {
  return [
    { kind: acknowledgementKind(category), audience: 'customer', channel: 'immediate' },
    { kind: 'operator_alert', audience: 'operator', channel: operatorChannel(category, priority) },
  ]
}

/**
 * Reminder rules for the future scheduler (not sent inline). Declarative so the
 * scheduling worker can consume them; documented in SUPPORT_ARCHITECTURE.md.
 */
export interface ReminderRule {
  id: string
  description: string
  audience: 'customer' | 'operator'
}

export const REMINDER_RULES: readonly ReminderRule[] = [
  {
    id: 'approaching_target',
    description: 'Ticket approaching its initial-response target',
    audience: 'operator',
  },
  {
    id: 'waiting_on_customer',
    description: 'No customer reply after N business days on a waiting_on_customer ticket',
    audience: 'customer',
  },
  {
    id: 'post_call_summary',
    description: 'Follow-up to add a written summary after a scheduled call',
    audience: 'operator',
  },
] as const
