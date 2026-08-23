import type { Lang } from '@/i18n/core'
import { buildExternalSigningUrl as buildSigningUrl } from './signingInviteEmail'

/** Public signing link for an external counterparty (no Dutiva login). */
export function externalSigningUrl(token: string, language: Lang = 'en'): string {
  if (typeof window !== 'undefined') {
    return buildSigningUrl(window.location.origin, token, language)
  }
  const prefix = language === 'fr' ? '/fr' : ''
  return `${prefix}/sign/${token}`
}

export async function copyExternalSigningLink(
  token: string,
  language: Lang = 'en',
): Promise<boolean> {
  const url = externalSigningUrl(token, language)
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
