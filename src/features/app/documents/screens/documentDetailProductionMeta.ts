/**
 * Shared constants/helpers for production document detail — kept out of the
 * view file so DocumentDetailProductionView stays under the architecture budget.
 */
import { bi } from '@/i18n/core'
import type { Lang } from '@/i18n/core'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { signatureStatusInfo } from '../data'
import type { RecipientType, SignatureStatus, StatusInfo } from '../data'
import type { ProductionDocumentStatus } from '../productionApi'
import type { InviteDeliveryStatus, ProductionDocumentRecipient } from '../signatureQueries'

export const PROD_STATUS_LABEL: Record<ProductionDocumentStatus, (typeof M)[keyof typeof M]> = {
  draft: M.doclib_prod_status_draft,
  approved: M.doclib_prod_status_approved,
  archived: M.doclib_prod_status_archived,
  sent_for_signature: M.doclib_prod_status_sent,
  partially_signed: M.doclib_prod_status_partial,
  signed: M.doclib_prod_status_signed,
  voided: M.doclib_prod_status_voided,
  exported: M.doclib_prod_status_exported,
}

export const PROD_STATUS_TONE: Record<
  ProductionDocumentStatus,
  'neutral' | 'ok' | 'info' | 'warn' | 'risk'
> = {
  draft: 'neutral',
  approved: 'ok',
  archived: 'info',
  sent_for_signature: 'info',
  partially_signed: 'warn',
  signed: 'ok',
  voided: 'risk',
  exported: 'ok',
}

export const PROD_RECIPIENT_TYPE = {
  employer: bi('Employer', 'Employeur'),
  employee: bi('Employee', 'Employé(e)'),
  manager: bi('Manager', 'Gestionnaire'),
  hr: bi('HR', 'RH'),
  external: bi('External', 'Externe'),
} as const satisfies Record<RecipientType, ReturnType<typeof bi>>

export const PROD_DETAIL_TABS = [
  ['preview', M.doclib_prod_tab_preview],
  ['fields', M.doclib_prod_tab_fields],
  ['recipients', M.doclib_prod_tab_recipients],
  ['versions', M.doclib_prod_tab_versions],
  ['audit', M.doclib_prod_tab_audit],
] as const

export type ProdDetailTab = (typeof PROD_DETAIL_TABS)[number][0]

const INVITE_DELIVERY_LABEL: Record<InviteDeliveryStatus, (typeof M)[keyof typeof M]> = {
  delivered: M.doclib_invite_delivery_delivered,
  bounced: M.doclib_invite_delivery_bounced,
  complained: M.doclib_invite_delivery_complained,
  delayed: M.doclib_invite_delivery_delayed,
}

const INVITE_DELIVERY_TONE: Record<
  InviteDeliveryStatus,
  'neutral' | 'ok' | 'info' | 'warn' | 'risk'
> = {
  delivered: 'ok',
  bounced: 'risk',
  complained: 'risk',
  delayed: 'warn',
}

export function fmtDetailDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function signatureInfoForStatus(status: string): StatusInfo | undefined {
  return status in signatureStatusInfo ? signatureStatusInfo[status as SignatureStatus] : undefined
}

export function inviteDeliveryInfo(
  recipient: ProductionDocumentRecipient,
): StatusInfo | undefined {
  if (!recipient.inviteLastSentAt) return undefined
  const status = recipient.inviteDeliveryStatus
  if (!status) return { tone: 'neutral', label: M.doclib_invite_delivery_sent }
  return { tone: INVITE_DELIVERY_TONE[status], label: INVITE_DELIVERY_LABEL[status] }
}
