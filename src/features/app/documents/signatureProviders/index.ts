import { dutivaEmbeddedProvider } from './dutivaEmbedded'
import type { SignatureProvider } from './types'

const providers: Record<string, SignatureProvider> = {
  [dutivaEmbeddedProvider.id]: dutivaEmbeddedProvider,
}

/** Default until a workspace selects a vendor integration. */
export const DEFAULT_SIGNATURE_PROVIDER_ID = dutivaEmbeddedProvider.id

export function getSignatureProvider(id = DEFAULT_SIGNATURE_PROVIDER_ID): SignatureProvider {
  const provider = providers[id]
  if (!provider) throw new Error(`Unknown signature provider: ${id}`)
  return provider
}

export type { CreateEnvelopeInput, CreateEnvelopeResult, EnvelopeRecipientInput, SignatureProvider } from './types'
