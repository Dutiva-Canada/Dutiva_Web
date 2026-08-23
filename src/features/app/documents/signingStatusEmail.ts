import type { Lang } from '@/i18n/core'

/**
 * Bilingual admin alert when a signing envelope completes or is declined.
 * Mirrors supabase/functions/_shared/signingStatusEmail.ts — keep in sync.
 */

export type SigningStatusEvent = 'completed' | 'declined'

export interface SigningStatusEmailContext {
  language: Lang
  organizationName: string
  documentTitle: string
  documentRef: string
  documentUrl: string
  event: SigningStatusEvent
  signerSummary?: string
}

const pick = (lang: Lang, en: string, fr: string) => (lang === 'fr' ? fr : en)

export function renderSigningStatusEmail(ctx: SigningStatusEmailContext): {
  subject: string
  text: string
} {
  const lang = ctx.language
  const brand = pick(lang, 'Dutiva Signature', 'Signature Dutiva')
  const docLine = `${ctx.documentTitle}\n${pick(lang, 'Reference', 'Référence')}: ${ctx.documentRef}`

  if (ctx.event === 'completed') {
    return {
      subject: pick(
        lang,
        `${brand}: all signatures collected on ${ctx.documentRef}`,
        `${brand} : toutes les signatures recueillies pour ${ctx.documentRef}`,
      ),
      text: [
        pick(lang, `Hello,`, `Bonjour,`),
        pick(
          lang,
          `All required signatures have been collected for a document at ${ctx.organizationName}:`,
          `Toutes les signatures requises ont été recueillies pour un document de ${ctx.organizationName} :`,
        ),
        docLine,
        ctx.signerSummary,
        pick(lang, `Open the document in Dutiva:\n${ctx.documentUrl}`, `Ouvrir le document dans Dutiva :\n${ctx.documentUrl}`),
        pick(lang, `— ${brand}`, `— ${brand}`),
      ]
        .filter(Boolean)
        .join('\n\n'),
    }
  }

  return {
    subject: pick(
      lang,
      `${brand}: a signer declined ${ctx.documentRef}`,
      `${brand} : un signataire a refusé ${ctx.documentRef}`,
    ),
    text: [
      pick(lang, `Hello,`, `Bonjour,`),
      pick(
        lang,
        `A signer declined to sign a document at ${ctx.organizationName}:`,
        `Un signataire a refusé de signer un document de ${ctx.organizationName} :`,
      ),
      docLine,
      ctx.signerSummary,
      pick(lang, `Review the envelope in Dutiva:\n${ctx.documentUrl}`, `Passer l’enveloppe en revue dans Dutiva :\n${ctx.documentUrl}`),
      pick(lang, `— ${brand}`, `— ${brand}`),
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}
