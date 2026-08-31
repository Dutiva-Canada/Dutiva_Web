import type { Lang } from '@/i18n/core'

/**
 * Bilingual Dutiva Signature invite email. Pure — no I/O — so the edge
 * function (`send-signing-invite`) can mirror this copy. Keep both in sync.
 *
 * Transactional posture: the organization named this person as a signer on a
 * specific document. This is not marketing mail; still no legal-compliance claims.
 */

export interface SigningInviteEmailContext {
  language: Lang
  /** Recipient display name. */
  recipientName: string
  /** Organization / workspace label (already localized if needed). */
  organizationName: string
  /** Document title (already localized). */
  documentTitle: string
  /** Human document ref, e.g. DOC-2026-0823-120000. */
  documentRef: string
  /** Absolute URL to /sign/:token (or /fr/sign/:token). */
  signingUrl: string
  /** Optional sender label for "requested by". */
  actorLabel?: string
  /** Reminder variant — omits actor line and uses reminder subject. */
  reminder?: boolean
}

export interface RenderedSigningInviteEmail {
  subject: string
  text: string
}

const pick = (lang: Lang, en: string, fr: string): string => (lang === 'fr' ? fr : en)

/** Build a locale-prefixed external signing URL. Mirrors _shared/signingInvite.ts. */
export function buildExternalSigningUrl(siteUrl: string, token: string, language: Lang): string {
  const base = siteUrl.replace(/\/+$/, '')
  const prefix = language === 'fr' ? '/fr' : ''
  return `${base}${prefix}/sign/${token}`
}

const DISCLAIMER = {
  en: 'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice. Electronic signatures are captured by Dutiva Signature with consent and an audit trail; suitability for your use case is your organization’s responsibility.',
  fr: 'Dutiva offre un soutien pratique aux flux de travail RH et des conseils axés sur la conformité. Il ne fournit pas de conseils juridiques. Les signatures électroniques sont capturées par Signature Dutiva avec consentement et journal d’audit; la pertinence pour votre usage relève de votre organisation.',
}

export function renderSigningInviteEmail(
  ctx: SigningInviteEmailContext,
): RenderedSigningInviteEmail {
  const lang = ctx.language
  const brand = pick(lang, 'Dutiva Signature', 'Signature Dutiva')
  const greeting = pick(lang, `Hello ${ctx.recipientName},`, `Bonjour ${ctx.recipientName},`)
  const intro = ctx.reminder
    ? pick(
        lang,
        `This is a reminder to sign the following document from ${ctx.organizationName}:`,
        `Rappel : veuillez signer le document suivant de ${ctx.organizationName} :`,
      )
    : ctx.actorLabel
      ? pick(
          lang,
          `${ctx.actorLabel} at ${ctx.organizationName} has asked you to review and electronically sign the following document:`,
          `${ctx.actorLabel} de ${ctx.organizationName} vous demande de passer en revue et de signer électroniquement le document suivant :`,
        )
      : pick(
          lang,
          `${ctx.organizationName} has asked you to review and electronically sign the following document:`,
          `${ctx.organizationName} vous demande de passer en revue et de signer électroniquement le document suivant :`,
        )
  const docLine = `${ctx.documentTitle}\n${pick(lang, 'Reference', 'Référence')}: ${ctx.documentRef}`
  const cta = pick(
    lang,
    `Open the secure signing page (no Dutiva account required):\n${ctx.signingUrl}`,
    `Ouvrez la page de signature sécurisée (aucun compte Dutiva requis) :\n${ctx.signingUrl}`,
  )
  const expiry = pick(
    lang,
    'This link expires after 30 days or when the envelope is voided. Do not forward it — it is personal to you.',
    'Ce lien expire après 30 jours ou lorsque l’enveloppe est annulée. Ne le transférez pas — il vous est personnel.',
  )
  const sign = pick(lang, `— ${brand}`, `— ${brand}`)

  return {
    subject: ctx.reminder
      ? pick(
          lang,
          `${brand} reminder: please sign ${ctx.documentRef}`,
          `${brand} — rappel : veuillez signer ${ctx.documentRef}`,
        )
      : pick(
          lang,
          `${brand}: please sign ${ctx.documentRef}`,
          `${brand} : veuillez signer ${ctx.documentRef}`,
        ),
    text: [greeting, intro, docLine, cta, expiry, DISCLAIMER[lang], sign].join('\n\n'),
  }
}
