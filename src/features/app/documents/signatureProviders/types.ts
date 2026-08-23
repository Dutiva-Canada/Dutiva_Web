import type { RecipientType, SignatureStatus } from '../data'

/**
 * Dutiva Signature adapter — proprietary in-app envelopes (no external vendor).
 * UI and persistence call this module; never a third-party e-sign SDK.
 */

export interface EnvelopeRecipientInput {
  name: string
  email: string
  type: RecipientType
  order: number
}

export interface CreateEnvelopeInput {
  documentId: string
  documentRef: string
  recipients: EnvelopeRecipientInput[]
}

export interface CreateEnvelopeResult {
  provider: string
  externalEnvelopeId: string
  initialStatus: SignatureStatus
}

export interface SignatureProvider {
  readonly id: string
  createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult>
}
