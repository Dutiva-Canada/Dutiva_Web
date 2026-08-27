import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { DocRecipient, SignatureStatus } from './data'
import { getSignatureProvider } from './signatureProviders'
import type { EnvelopeRecipientInput } from './signatureProviders'
import type { ProductionDocumentDetail } from './productionApi'
import { getDocument } from './productionApi'
import { DUTIVA_SIGNING_CONSENT_VERSION } from './signingConsent'
import {
  loadSignatureBundle,
  SIGNATURE_SELECT,
  toSignature,
  signatureRowSchema,
  type ProductionDocumentRecipient,
  type ProductionDocumentSignature,
} from './signatureQueries'

export type { ProductionDocumentRecipient, ProductionDocumentSignature } from './signatureQueries'
export { toDocRecipient } from './signatureQueries'
export { DUTIVA_SIGNING_CONSENT_VERSION } from './signingConsent'

/**
 * Dutiva-native signing — hr_document_signatures + hr_document_recipients
 * (0077) with server-side RPC enforcement (0078). No third-party e-sign vendor;
 * signatures are captured in Dutiva with consent, order, and audit records.
 *
 * **External signing links** — per-recipient tokens (0080) open `/sign/:token`
 * without a Dutiva login. Admins can copy links, email them manually, or opt
 * in when sending an envelope (Send modal checkbox → `send-signing-invite`).
 */

export interface SigningPackage {
  detail: ProductionDocumentDetail
  signature: ProductionDocumentSignature
  recipients: ProductionDocumentRecipient[]
}

const rpcResultSchema = z.object({
  document_id: z.string(),
  signature_status: z.string(),
})

async function hashDocumentContent(content: unknown): Promise<string> {
  const payload = JSON.stringify(content)
  const bytes = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Lowest-order recipient who has not signed or declined yet. */
export function currentSigningTurn(
  recipients: ProductionDocumentRecipient[],
): ProductionDocumentRecipient | null {
  const pending = recipients
    .filter((r) => r.status !== 'signed' && r.status !== 'declined')
    .sort((a, b) => a.order - b.order)
  return pending[0] ?? null
}

export function recipientCanSignNow(
  recipients: ProductionDocumentRecipient[],
  email: string,
): boolean {
  const turn = currentSigningTurn(recipients)
  return turn?.email.toLowerCase() === email.toLowerCase()
}

export async function sendDocumentForSignature(
  organizationId: string,
  documentId: string,
  recipients: DocRecipient[],
  actorLabel: string,
  providerId?: string,
): Promise<ProductionDocumentSignature> {
  if (!supabase) throw new Error('Supabase is not configured')

  const detail = await getDocument(organizationId, documentId)
  if (!detail) throw new Error('Document not found')
  if (detail.signatureStatus !== 'not_sent') {
    throw new Error('Document already has a signature envelope')
  }
  if (detail.status !== 'approved') {
    throw new Error('Document must be approved before sending for signature')
  }

  const current = detail.versions.find((v) => v.versionNumber === detail.currentVersion)
  if (!current) throw new Error('Document has no current version')
  const contentHash = await hashDocumentContent(current.content)

  const provider = getSignatureProvider(providerId)
  const sorted = [...recipients].sort((a, b) => (a.order || 0) - (b.order || 0))
  const ordered: EnvelopeRecipientInput[] = sorted.map((r, i) => ({
    name: r.name.trim(),
    email: r.email.trim(),
    type: r.type,
    order: i + 1,
  }))

  const envelope = await provider.createEnvelope({
    documentId,
    documentRef: detail.ref,
    recipients: ordered,
  })

  const now = new Date().toISOString()

  let signature: ProductionDocumentSignature | undefined
  try {
    const { data: sigData, error: sigError } = await supabase
      .from('hr_document_signatures')
      .insert({
        organization_id: organizationId,
        document_id: documentId,
        provider: envelope.provider,
        external_envelope_id: envelope.externalEnvelopeId,
        status: envelope.initialStatus,
        sent_at: now,
        content_hash: contentHash,
      })
      .select(SIGNATURE_SELECT)
      .single()
    if (sigError) throw sigError
    const created = toSignature(signatureRowSchema.parse(sigData))
    signature = created

    const recipientRows = ordered.map((r) => ({
      organization_id: organizationId,
      document_id: documentId,
      signature_id: created.id,
      recipient_type: r.type,
      name: r.name,
      email: r.email,
      signing_order: r.order,
      status: 'pending',
    }))
    const { error: recError } = await supabase.from('hr_document_recipients').insert(recipientRows)
    if (recError) throw recError

    const { error: docError } = await supabase
      .from('hr_generated_documents')
      .update({
        status: 'sent_for_signature',
        signature_status: 'sent',
        updated_at: now,
      })
      .eq('id', documentId)
      .eq('organization_id', organizationId)
    if (docError) throw docError

    const { error: auditError } = await supabase.from('hr_document_audit_events').insert({
      organization_id: organizationId,
      document_id: documentId,
      event_type: 'sent_for_signature',
      actor_label: actorLabel,
      meta: `${envelope.externalEnvelopeId} · hash ${contentHash.slice(0, 12)}`,
    })
    if (auditError) throw auditError
  } catch (error) {
    if (signature) {
      await supabase
        .from('hr_document_recipients')
        .delete()
        .eq('signature_id', signature.id)
        .eq('organization_id', organizationId)
      await supabase
        .from('hr_document_signatures')
        .delete()
        .eq('id', signature.id)
        .eq('organization_id', organizationId)
    }
    throw error
  }

  if (!signature) {
    throw new Error('Could not create signature envelope')
  }

  return signature
}

export async function recordDocumentSignatureView(envelopeId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.rpc('record_hr_document_signature_view', {
    p_envelope_id: envelopeId,
  })
  if (error) throw error
}

export async function applyDocumentSignature(
  envelopeId: string,
  payload: { text?: string; image?: string; signedName: string },
  consentVersion = DUTIVA_SIGNING_CONSENT_VERSION,
): Promise<{ documentId: string; signatureStatus: SignatureStatus }> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('apply_hr_document_signature', {
    p_envelope_id: envelopeId,
    p_signed_name: payload.signedName,
    p_signature_image: payload.image,
    p_signature_text: payload.text,
    p_consent_version: consentVersion,
  })
  if (error) throw error

  const parsed = rpcResultSchema.parse(data)
  return {
    documentId: parsed.document_id,
    signatureStatus: parsed.signature_status as SignatureStatus,
  }
}

export async function declineDocumentSignature(
  envelopeId: string,
  reason?: string,
): Promise<{ documentId: string; signatureStatus: SignatureStatus }> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('decline_hr_document_signature', {
    p_envelope_id: envelopeId,
    p_reason: reason,
  })
  if (error) throw error

  const parsed = rpcResultSchema.parse(data)
  return {
    documentId: parsed.document_id,
    signatureStatus: parsed.signature_status as SignatureStatus,
  }
}

export async function voidDocumentSignature(documentId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.rpc('void_hr_document_signature', {
    p_document_id: documentId,
  })
  if (error) throw error
}

export async function getSigningPackage(
  organizationId: string,
  envelopeId: string,
): Promise<SigningPackage | null> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: sigRow, error } = await supabase
    .from('hr_document_signatures')
    .select(`${SIGNATURE_SELECT}, document_id`)
    .eq('external_envelope_id', envelopeId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  if (!sigRow) return null

  const documentId = sigRow.document_id as string
  const detail = await getDocument(organizationId, documentId)
  if (!detail) return null

  const bundle = await loadSignatureBundle(organizationId, documentId)
  if (!bundle.signature) return null

  return { detail, signature: bundle.signature, recipients: bundle.recipients }
}
