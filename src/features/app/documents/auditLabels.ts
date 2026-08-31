import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/** Localized audit event labels — shared by demo detail and production detail. */
export const DOCUMENT_AUDIT_LABEL: Record<string, Bi> = {
  generation_started: bi('Generation started', 'Génération démarrée'),
  document_created: bi('Document created', 'Document créé'),
  draft_saved: bi('Draft saved', 'Brouillon enregistré'),
  document_updated: bi('Document updated', 'Document mis à jour'),
  version_created: bi('Version created', 'Version créée'),
  review_requested: bi('Review requested', 'Révision demandée'),
  review_approved: bi('Review approved', 'Révision approuvée'),
  review_rejected: bi('Sent back for revision', 'Retourné pour révision'),
  sent_for_signature: bi('Sent for signature', 'Envoyé pour signature'),
  signature_viewed: bi('Document viewed for signature', 'Document consulté pour signature'),
  signature_applied: bi('Signature applied', 'Signature appliquée'),
  signature_declined: bi('Signature declined', 'Signature refusée'),
  signature_completed: bi('All signatures completed', 'Toutes les signatures complétées'),
  signing_invite_sent: bi('Signing invite emailed', 'Invitation de signature envoyée'),
  signing_invite_reminded: bi('Signing invite reminder sent', 'Rappel de signature envoyé'),
  signing_link_reissued: bi('Signing link refreshed', 'Lien de signature renouvelé'),
  signing_admin_notified: bi(
    'Admins notified of signing status',
    'Administrateurs avisés du statut de signature',
  ),
  document_exported: bi('Document exported', 'Document exporté'),
  document_archived: bi('Archived', 'Archivé'),
  document_restored: bi('Restored', 'Restauré'),
  document_voided: bi('Voided', 'Annulé'),
  permission_changed: bi('Permission changed', 'Permission modifiée'),
  comment_added: bi('Comment added', 'Commentaire ajouté'),
}
