import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import type { PreviewBlock } from './data'
import type { Jurisdiction, SignatureStatus } from './data'
import { DUTIVA_SIGNING_CONSENT_VERSION } from './signingConsent'

/**
 * Token-based signing for external counterparties — anon RPCs (migration 0080).
 * No org membership or Dutiva login required; access is scoped to one recipient.
 */

export interface ExternalSigningRecipient {
  id: string
  name: string
  email: string
  type: string
  order: number
  status: string
}

export interface ExternalSigningPackage {
  document: {
    id: string
    ref: string
    title: Bi
    language: 'en' | 'fr'
    jurisdiction: Jurisdiction
    signatureStatus: SignatureStatus
    currentVersion: number
    content: { blocks: PreviewBlock[]; values: Record<string, string> }
  }
  recipient: ExternalSigningRecipient
  signature: {
    envelopeId: string
    status: SignatureStatus
    contentHash: string | null
  }
  turnOrder: number | null
  recipients: Array<{ order: number; name: string; email: string; status: string }>
}

const packageSchema = z.object({
  document: z.object({
    id: z.string(),
    ref: z.string(),
    title_en: z.string(),
    title_fr: z.string(),
    language: z.enum(['en', 'fr']),
    jurisdiction: z.enum(['ON', 'QC', 'FED']),
    signature_status: z.string(),
    current_version: z.number(),
    content: z.object({
      blocks: z.array(z.unknown()),
      values: z.record(z.string(), z.string()),
    }),
  }),
  recipient: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    type: z.string(),
    order: z.number(),
    status: z.string(),
  }),
  signature: z.object({
    envelope_id: z.string(),
    status: z.string(),
    content_hash: z.string().nullable(),
  }),
  turn_order: z.number().nullable(),
  recipients: z.array(
    z.object({
      order: z.number(),
      name: z.string(),
      email: z.string(),
      status: z.string(),
    }),
  ),
})

const rpcResultSchema = z.object({
  document_id: z.string(),
  signature_status: z.string(),
})

function parsePackage(raw: unknown): ExternalSigningPackage | null {
  const parsed = packageSchema.safeParse(raw)
  if (!parsed.success) return null
  const row = parsed.data
  return {
    document: {
      id: row.document.id,
      ref: row.document.ref,
      title: bi(row.document.title_en, row.document.title_fr),
      language: row.document.language,
      jurisdiction: row.document.jurisdiction,
      signatureStatus: row.document.signature_status as SignatureStatus,
      currentVersion: row.document.current_version,
      content: {
        blocks: row.document.content.blocks as PreviewBlock[],
        values: row.document.content.values,
      },
    },
    recipient: {
      id: row.recipient.id,
      name: row.recipient.name,
      email: row.recipient.email,
      type: row.recipient.type,
      order: row.recipient.order,
      status: row.recipient.status,
    },
    signature: {
      envelopeId: row.signature.envelope_id,
      status: row.signature.status as SignatureStatus,
      contentHash: row.signature.content_hash,
    },
    turnOrder: row.turn_order,
    recipients: row.recipients,
  }
}

export function externalRecipientCanSignNow(
  pkg: ExternalSigningPackage,
): boolean {
  if (pkg.recipient.status === 'signed' || pkg.recipient.status === 'declined') {
    return false
  }
  return pkg.turnOrder === pkg.recipient.order
}

export async function getExternalSigningPackage(
  token: string,
): Promise<ExternalSigningPackage | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('get_hr_signing_package_by_token', {
    p_token: token,
  })
  if (error) throw error
  if (!data) return null
  return parsePackage(data)
}

export async function recordExternalSignatureView(token: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.rpc('record_hr_document_signature_view_by_token', {
    p_token: token,
  })
  if (error) throw error
}

export async function applyExternalSignature(
  token: string,
  payload: { image?: string; text?: string; signedName: string },
  consentVersion = DUTIVA_SIGNING_CONSENT_VERSION,
): Promise<{ documentId: string; signatureStatus: SignatureStatus }> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('apply_hr_document_signature_by_token', {
    p_token: token,
    p_signed_name: payload.signedName,
    p_signature_image: payload.image ?? null,
    p_signature_text: payload.text ?? null,
    p_consent_version: consentVersion,
  })
  if (error) throw error
  const parsed = rpcResultSchema.parse(data)
  return {
    documentId: parsed.document_id,
    signatureStatus: parsed.signature_status as SignatureStatus,
  }
}

export async function declineExternalSignature(
  token: string,
  reason?: string,
): Promise<{ documentId: string; signatureStatus: SignatureStatus }> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('decline_hr_document_signature_by_token', {
    p_token: token,
    p_reason: reason ?? null,
  })
  if (error) throw error
  const parsed = rpcResultSchema.parse(data)
  return {
    documentId: parsed.document_id,
    signatureStatus: parsed.signature_status as SignatureStatus,
  }
}
