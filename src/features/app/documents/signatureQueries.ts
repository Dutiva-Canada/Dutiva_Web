import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { DocRecipient, RecipientType, SignatureStatus } from './data'

export interface ProductionDocumentSignature {
  id: string
  provider: string
  envelopeId: string
  status: SignatureStatus
  sentAt: string
  signedAt: string | null
  contentHash: string | null
}

export type InviteDeliveryStatus = 'delivered' | 'bounced' | 'complained' | 'delayed'

export interface ProductionDocumentRecipient {
  id: string
  name: string
  email: string
  type: RecipientType
  order: number
  status: string
  signedAt: string | null
  signedName: string | null
  signatureImage: string | null
  consentAt: string | null
  declineReason: string | null
  signingToken: string | null
  inviteLastSentAt: string | null
  inviteDeliveryStatus: InviteDeliveryStatus | null
  inviteDeliveryDetail: string | null
  inviteDeliveryUpdatedAt: string | null
  tokenExpiresAt: string | null
  tokenRevokedAt: string | null
}

const signatureRowSchema = z.object({
  id: z.string(),
  provider: z.string(),
  external_envelope_id: z.string(),
  status: z.enum([
    'sent',
    'viewed',
    'pending',
    'partially_signed',
    'signed',
    'declined',
    'expired',
    'voided',
  ]),
  sent_at: z.string(),
  signed_at: z.string().nullable(),
  content_hash: z.string().nullable().optional(),
})

const recipientRowSchema = z.object({
  id: z.string(),
  recipient_type: z.enum(['employer', 'employee', 'manager', 'hr', 'external']),
  name: z.string(),
  email: z.string(),
  signing_order: z.number(),
  status: z.string(),
  signed_at: z.string().nullable(),
  signed_name: z.string().nullable(),
  signature_image: z.string().nullable().optional(),
  consent_at: z.string().nullable().optional(),
  decline_reason: z.string().nullable().optional(),
  signing_token: z.string().uuid().optional(),
  last_invite_sent_at: z.string().nullable().optional(),
  invite_delivery_status: z
    .enum(['delivered', 'bounced', 'complained', 'delayed'])
    .nullable()
    .optional(),
  invite_delivery_detail: z.string().nullable().optional(),
  invite_delivery_updated_at: z.string().nullable().optional(),
  token_expires_at: z.string().nullable().optional(),
  token_revoked_at: z.string().nullable().optional(),
})

export const SIGNATURE_SELECT =
  'id, provider, external_envelope_id, status, sent_at, signed_at, content_hash'

export const RECIPIENT_SELECT =
  'id, recipient_type, name, email, signing_order, status, signed_at, signed_name, signature_image, consent_at, decline_reason, signing_token, last_invite_sent_at, invite_delivery_status, invite_delivery_detail, invite_delivery_updated_at, token_expires_at, token_revoked_at'

function toSignature(row: z.infer<typeof signatureRowSchema>): ProductionDocumentSignature {
  return {
    id: row.id,
    provider: row.provider,
    envelopeId: row.external_envelope_id,
    status: row.status,
    sentAt: row.sent_at,
    signedAt: row.signed_at,
    contentHash: row.content_hash ?? null,
  }
}

function toRecipient(row: z.infer<typeof recipientRowSchema>): ProductionDocumentRecipient {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    type: row.recipient_type,
    order: row.signing_order,
    status: row.status,
    signedAt: row.signed_at,
    signedName: row.signed_name,
    signatureImage: row.signature_image ?? null,
    consentAt: row.consent_at ?? null,
    declineReason: row.decline_reason ?? null,
    signingToken: row.signing_token ?? null,
    inviteLastSentAt: row.last_invite_sent_at ?? null,
    inviteDeliveryStatus: row.invite_delivery_status ?? null,
    inviteDeliveryDetail: row.invite_delivery_detail ?? null,
    inviteDeliveryUpdatedAt: row.invite_delivery_updated_at ?? null,
    tokenExpiresAt: row.token_expires_at ?? null,
    tokenRevokedAt: row.token_revoked_at ?? null,
  }
}

export function isSigningTokenExpired(recipient: ProductionDocumentRecipient): boolean {
  if (recipient.tokenRevokedAt) return true
  if (!recipient.tokenExpiresAt) return false
  return new Date(recipient.tokenExpiresAt).getTime() <= Date.now()
}

export function countUndeliveredInvites(recipients: ProductionDocumentRecipient[]): number {
  return recipients.filter(
    (r) => r.inviteDeliveryStatus === 'bounced' || r.inviteDeliveryStatus === 'complained',
  ).length
}

export async function loadSignatureBundle(
  organizationId: string,
  documentId: string,
): Promise<{ signature: ProductionDocumentSignature | null; recipients: ProductionDocumentRecipient[] }> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: sigRows, error: sigError } = await supabase
    .from('hr_document_signatures')
    .select(SIGNATURE_SELECT)
    .eq('organization_id', organizationId)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (sigError) throw sigError
  const sigRow = sigRows?.[0]
  if (!sigRow) return { signature: null, recipients: [] }

  const signature = toSignature(signatureRowSchema.parse(sigRow))

  const { data: recRows, error: recError } = await supabase
    .from('hr_document_recipients')
    .select(RECIPIENT_SELECT)
    .eq('signature_id', signature.id)
    .eq('organization_id', organizationId)
    .order('signing_order', { ascending: true })
  if (recError) throw recError

  return {
    signature,
    recipients: z.array(recipientRowSchema).parse(recRows ?? []).map(toRecipient),
  }
}

export { signatureRowSchema, recipientRowSchema, toSignature, toRecipient }

export function toDocRecipient(r: ProductionDocumentRecipient): DocRecipient {
  return {
    name: r.name,
    type: r.type,
    email: r.email,
    order: r.order,
    status: r.status,
    signedAt: r.signedAt ?? undefined,
    signedName: r.signedName ?? undefined,
  }
}
