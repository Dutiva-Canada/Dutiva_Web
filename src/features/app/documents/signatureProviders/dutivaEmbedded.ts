import type { CreateEnvelopeInput, CreateEnvelopeResult, SignatureProvider } from './types'

function makeEnvelopeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ENV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  }
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const rand = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return `ENV-${rand.toUpperCase()}`
  }
  return `ENV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

/**
 * In-app Dutiva Signature — no external vendor. The envelope id routes to
 * /app/documents/sign/:envelopeId; signatures are captured in Dutiva UI with
 * consent, order enforcement, and audit records (migration 0078 RPCs).
 */
export const dutivaEmbeddedProvider: SignatureProvider = {
  id: 'dutiva_embedded',
  async createEnvelope(_input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    return {
      provider: 'dutiva_embedded',
      externalEnvelopeId: makeEnvelopeId(),
      initialStatus: 'sent',
    }
  },
}
