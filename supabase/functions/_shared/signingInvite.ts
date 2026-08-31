/**
 * Shared Dutiva Signature invite send helpers for send-signing-invite and
 * signing-reminder-scheduler. Email copy mirrors
 * src/features/app/documents/signingInviteEmail.ts — keep both in sync.
 */

import { resendSend } from './resendSend.ts'

export type Lang = 'en' | 'fr'

const pick = (lang: Lang, en: string, fr: string) => (lang === 'fr' ? fr : en)

const DISCLAIMER = {
  en: 'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice. Electronic signatures are captured by Dutiva Signature with consent and an audit trail; suitability for your use case is your organization’s responsibility.',
  fr: 'Dutiva offre un soutien pratique aux flux de travail RH et des conseils axés sur la conformité. Il ne fournit pas de conseils juridiques. Les signatures électroniques sont capturées par Signature Dutiva avec consentement et journal d’audit; la pertinence pour votre usage relève de votre organisation.',
}

export function buildExternalSigningUrl(siteUrl: string, token: string, language: Lang): string {
  const base = siteUrl.replace(/\/+$/, '')
  const prefix = language === 'fr' ? '/fr' : ''
  return `${base}${prefix}/sign/${token}`
}

export function renderSigningInviteEmail(ctx: {
  language: Lang
  recipientName: string
  organizationName: string
  documentTitle: string
  documentRef: string
  signingUrl: string
  actorLabel?: string
  reminder?: boolean
}): { subject: string; text: string } {
  const lang = ctx.language
  const brand = pick(lang, 'Dutiva Signature', 'Signature Dutiva')
  const greeting = pick(lang, `Hello ${ctx.recipientName},`, `Bonjour ${ctx.recipientName},`)
  const intro = ctx.actorLabel
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
  const reminderIntro = pick(
    lang,
    `This is a reminder to sign the following document from ${ctx.organizationName}:`,
    `Rappel : veuillez signer le document suivant de ${ctx.organizationName} :`,
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
  const subject = ctx.reminder
    ? pick(
        lang,
        `${brand} reminder: please sign ${ctx.documentRef}`,
        `${brand} — rappel : veuillez signer ${ctx.documentRef}`,
      )
    : pick(
        lang,
        `${brand}: please sign ${ctx.documentRef}`,
        `${brand} : veuillez signer ${ctx.documentRef}`,
      )
  return {
    subject,
    text: [
      greeting,
      ctx.reminder ? reminderIntro : intro,
      docLine,
      cta,
      expiry,
      DISCLAIMER[lang],
      sign,
    ].join('\n\n'),
  }
}

export type RecipientRow = {
  id: string
  name: string
  email: string
  signing_order: number
  signing_token: string | null
  token_expires_at: string | null
}

export function filterTurnRecipients<T extends { signing_order: number }>(
  rows: T[],
  turnOnly: boolean,
): T[] {
  if (!turnOnly || rows.length === 0) return rows
  const minOrder = Math.min(...rows.map((r) => r.signing_order))
  return rows.filter((r) => r.signing_order === minOrder)
}

export async function sendInviteToRecipient(
  admin: {
    from: (table: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
      }
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }
  },
  opts: {
    apiKey: string
    from: string
    organizationId: string
    documentId: string
    documentRef: string
    documentTitle: string
    organizationName: string
    siteUrl: string
    language: Lang
    actorLabel: string
    row: RecipientRow
    reminder?: boolean
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const signingToken = opts.row.signing_token
  if (!signingToken) return { ok: false, error: 'missing_token' }
  const expiresAt = opts.row.token_expires_at ? new Date(String(opts.row.token_expires_at)) : null
  if (expiresAt && expiresAt.getTime() <= Date.now()) return { ok: false, error: 'token_expired' }

  const signingUrl = buildExternalSigningUrl(opts.siteUrl, signingToken, opts.language)
  const email = renderSigningInviteEmail({
    language: opts.language,
    recipientName: String(opts.row.name),
    organizationName: opts.organizationName,
    documentTitle: opts.documentTitle,
    documentRef: opts.documentRef,
    signingUrl,
    actorLabel: opts.reminder ? undefined : opts.actorLabel,
    reminder: opts.reminder,
  })

  try {
    const providerMessageId = await resendSend(opts.apiKey, opts.from, {
      to: String(opts.row.email),
      subject: email.subject,
      text: email.text,
    })
    const sentAt = new Date().toISOString()
    const patch: Record<string, unknown> = {
      last_invite_sent_at: sentAt,
      invite_provider_message_id: providerMessageId,
      invite_delivery_status: null,
      invite_delivery_detail: null,
      invite_delivery_updated_at: null,
    }
    if (opts.reminder) patch.last_reminder_sent_at = sentAt

    const { error: updateError } = await admin
      .from('hr_document_recipients')
      .update(patch)
      .eq('id', opts.row.id)
    if (updateError) return { ok: false, error: updateError.message }

    await admin.from('hr_document_audit_events').insert({
      organization_id: opts.organizationId,
      document_id: opts.documentId,
      event_type: opts.reminder ? 'signing_invite_reminded' : 'signing_invite_sent',
      actor_label: opts.actorLabel,
      meta: String(opts.row.email),
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e).slice(0, 300) }
  }
}
