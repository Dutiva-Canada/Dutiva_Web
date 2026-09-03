/**
 * Demo document-detail constants extracted so DocumentDetailScreen stays
 * under the architecture line budget as signing/export UI grows.
 */
import { bi } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
import type { WorkspaceMessageKey } from '@/i18n/messages'
import { doclibMessages } from '@/i18n/messages/doclib'
import type { ToastTone } from '@/features/app/toasts/toastsContext'
import type { DocAction } from '../engine'
import { signatureStatusInfo } from '../data'
import type { AuditEventType, RecipientType, SignatureStatus, StatusInfo } from '../data'

export const DETAIL_TABS = [
  ['preview', 'doclib_docd_tabPreview'],
  ['fields', 'doclib_docd_tabFields'],
  ['versions', 'doclib_docd_tabVersions'],
  ['recipients', 'doclib_docd_tabRecipients'],
  ['audit', 'doclib_docd_tabAudit'],
] as const satisfies ReadonlyArray<readonly [string, WorkspaceMessageKey]>

export type DetailTabKey = (typeof DETAIL_TABS)[number][0]

export const EDIT_TOAST: Bi = bi('Editing in the guided flow', 'Modification dans le flux guidé')

export interface DetailActionConfig {
  label: WorkspaceMessageKey
  toast: Bi
  tone: ToastTone
  variant: 'primary' | 'ghost' | 'danger'
}

export const DETAIL_ACTION_CFG: Record<DocAction, DetailActionConfig> = {
  edit: { label: 'doclib_docd_edit', toast: EDIT_TOAST, tone: 'info', variant: 'ghost' },
  request_review: {
    label: 'doclib_docd_requestReview',
    toast: doclibMessages.doclib_toast_reviewRequested,
    tone: 'info',
    variant: 'primary',
  },
  approve: {
    label: 'doclib_docd_approve',
    toast: doclibMessages.doclib_toast_approved,
    tone: 'ok',
    variant: 'primary',
  },
  send_for_signature: {
    label: 'doclib_docd_sendSign',
    toast: doclibMessages.doclib_toast_sent,
    tone: 'info',
    variant: 'primary',
  },
  export: {
    label: 'doclib_docd_export',
    toast: doclibMessages.doclib_toast_exported,
    tone: 'ok',
    variant: 'ghost',
  },
  archive: {
    label: 'doclib_docd_archive',
    toast: doclibMessages.doclib_toast_archived,
    tone: 'info',
    variant: 'ghost',
  },
  restore: {
    label: 'doclib_docd_restore',
    toast: doclibMessages.doclib_toast_restored,
    tone: 'ok',
    variant: 'primary',
  },
  void: {
    label: 'doclib_docd_void',
    toast: doclibMessages.doclib_toast_voided,
    tone: 'info',
    variant: 'danger',
  },
}

export const DETAIL_RECIPIENT_TYPE: Record<RecipientType, Bi> = {
  employer: bi('Employer', 'Employeur'),
  employee: bi('Employee', 'Employé(e)'),
  manager: bi('Manager', 'Gestionnaire'),
  hr: bi('HR', 'RH'),
  external: bi('External', 'Externe'),
}

export const DETAIL_AUDIT_LABEL: Partial<Record<AuditEventType, Bi>> = {
  generation_started: bi('Generation started', 'Génération démarrée'),
  document_created: bi('Document created', 'Document créé'),
  draft_saved: bi('Draft saved', 'Brouillon enregistré'),
  document_updated: bi('Document updated', 'Document mis à jour'),
  version_created: bi('Version created', 'Version créée'),
  review_requested: bi('Review requested', 'Révision demandée'),
  review_approved: bi('Review approved', 'Révision approuvée'),
  review_rejected: bi('Sent back for revision', 'Retourné pour révision'),
  sent_for_signature: bi('Sent for signature', 'Envoyé pour signature'),
  signature_viewed: bi('Signature viewed', 'Signature consultée'),
  signature_completed: bi('Signature completed', 'Signature complétée'),
  document_exported: bi('Document exported', 'Document exporté'),
  document_archived: bi('Archived', 'Archivé'),
  document_restored: bi('Restored', 'Restauré'),
  document_voided: bi('Voided', 'Annulé'),
  permission_changed: bi('Permission changed', 'Permission modifiée'),
  comment_added: bi('Comment added', 'Commentaire ajouté'),
}

export const REFERENCE_LABEL: Bi = bi('Reference', 'Référence')
export const TEMPLATE_VERSION_LABEL: Bi = bi('Template version', 'Version du modèle')
export const CASE_FILE_LABEL: Bi = bi('Case file', 'Dossier')
export const CURRENT_VERSION_LABEL: Bi = bi('Current version', 'Version actuelle')

export function fmtDemoDetailDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function signatureInfoForDemoStatus(status: string): StatusInfo | undefined {
  return status in signatureStatusInfo ? signatureStatusInfo[status as SignatureStatus] : undefined
}
