import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { resendSend } from '../_shared/resendSend.ts'

/**
 * Send worker for the support notification outbox. Drains `pending` rows from
 * public.support_notifications, renders the bilingual email, sends it through
 * the configured transactional provider (Resend), and marks each row
 * `sent`/`failed`. Runs on a schedule (pg_cron → this function) and can also be
 * invoked manually to flush the queue — see docs/SUPPORT_RUNBOOK.md.
 *
 * Honest by construction:
 *   • If no provider is configured (RESEND_API_KEY / SUPPORT_EMAIL_PROVIDER_API_KEY unset), rows
 *     are LEFT pending and nothing is marked sent — so wiring the key later
 *     flushes the backlog rather than silently dropping acknowledgements.
 *   • The outbox payload is non-sensitive ({ reference, category, priority? }),
 *     so subjects carry only the reference and bodies link to the authenticated
 *     ticket — never any description or PII.
 *
 * Keep in sync with (the tested source of truth):
 *   • src/features/support/email/templates.ts  (renderSupportEmail)
 *   • src/features/support/email/resendProvider.ts  (Resend request shape)
 *   • src/config/support.ts  (category / priority / response-target labels)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-notify-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const MAX_ATTEMPTS = 5
const BATCH_SIZE = 50

type Lang = 'en' | 'fr'
const L = (lang: Lang, en: string, fr: string): string => (lang === 'fr' ? fr : en)

// ── Localized labels (mirror src/config/support.ts) ─────────────────────────
const CATEGORY_LABELS: Record<string, { en: string; fr: string }> = {
  account_access: { en: 'Account access', fr: 'Accès au compte' },
  billing: { en: 'Billing', fr: 'Facturation' },
  technical: { en: 'Technical issue', fr: 'Problème technique' },
  product_question: { en: 'Product question', fr: 'Question sur le produit' },
  privacy: { en: 'Privacy request', fr: 'Demande de confidentialité' },
  security: { en: 'Security concern', fr: 'Préoccupation de sécurité' },
  accessibility: { en: 'Accessibility feedback', fr: 'Rétroaction sur l’accessibilité' },
  complaint: { en: 'Complaint or escalation', fr: 'Plainte ou escalade' },
  sales: { en: 'Sales or onboarding', fr: 'Ventes ou intégration' },
  other: { en: 'Other', fr: 'Autre' },
}
const PRIORITY_LABELS: Record<string, { en: string; fr: string }> = {
  critical: { en: 'Critical', fr: 'Critique' },
  high: { en: 'High', fr: 'Élevée' },
  standard: { en: 'Standard', fr: 'Standard' },
  low: { en: 'Low', fr: 'Faible' },
}
const RESPONSE_TARGET_LABELS: Record<string, { en: string; fr: string }> = {
  critical: { en: 'within 4 business hours', fr: 'en moins de 4 heures ouvrables' },
  high: { en: 'within 1 business day', fr: 'en moins de 1 jour ouvrable' },
  standard: { en: 'within 2 business days', fr: 'en moins de 2 jours ouvrables' },
  low: { en: 'within 5 business days', fr: 'en moins de 5 jours ouvrables' },
}

// ── Approved copy (mirror src/i18n/messages/support.ts + common.ts) ─────────
const NO_SECRETS = {
  en: 'Please do not send passwords, authentication codes, or confidential workplace records by email. Dutiva will provide secure instructions if we need additional information.',
  fr: 'Veuillez ne pas envoyer de mots de passe, de codes d’authentification ni de dossiers confidentiels du milieu de travail par courriel. Dutiva vous fournira des instructions sécurisées si nous avons besoin de renseignements supplémentaires.',
}
const RESOLUTION_VARIES = {
  en: 'Resolution time varies with the complexity of the request. We will reply to this ticket in writing; please add any further details to the ticket rather than starting a new one.',
  fr: 'Le délai de résolution varie selon la complexité de la demande. Nous répondrons à ce billet par écrit; veuillez ajouter tout renseignement supplémentaire au billet plutôt que d’en ouvrir un nouveau.',
}
const CALL_NOT_GUARANTEED = {
  en: 'Scheduled calls are arranged only where digital support cannot reasonably resolve the issue, and are not guaranteed. The written ticket remains the record of your request.',
  fr: 'Les appels planifiés sont organisés uniquement lorsque le soutien numérique ne peut raisonnablement régler la situation, et ne sont pas garantis. Le billet écrit demeure le dossier de votre demande.',
}
const DISCLAIMER = {
  en: 'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.',
  fr: 'Dutiva offre un soutien pratique aux flux de travail RH et des conseils axés sur la conformité. Il ne fournit pas de conseils juridiques.',
}

type NotificationKind =
  | 'ticket_received'
  | 'agent_reply'
  | 'info_requested'
  | 'resolved'
  | 'closed'
  | 'call_proposed'
  | 'call_confirmed'
  | 'call_reminder'
  | 'call_followup_needed'
  | 'privacy_ack'
  | 'accessibility_ack'
  | 'security_ack'
  | 'complaint_ack'
  | 'operator_alert'
  | 'beta_signup'
  | 'beta_confirmation'

interface EmailContext {
  language: Lang
  reference: string
  ticketUrl: string
  categoryLabel: string
  responseTargetLabel?: string
  priorityLabel?: string
  sourceLabel?: string
  provinceLabel?: string
}

interface RenderedEmail {
  subject: string
  text: string
}

/** Mirror of renderSupportEmail (src/features/support/email/templates.ts). */
function renderNotificationEmail(kind: NotificationKind, ctx: EmailContext): RenderedEmail {
  const { language: lang, reference, ticketUrl, categoryLabel } = ctx
  const brand = L(lang, 'Dutiva Support', 'Soutien Dutiva')
  const noSecrets = L(lang, NO_SECRETS.en, NO_SECRETS.fr)
  const resolutionVaries = L(lang, RESOLUTION_VARIES.en, RESOLUTION_VARIES.fr)
  const disclaimer = L(lang, DISCLAIMER.en, DISCLAIMER.fr)
  const refLine = L(lang, `Reference: ${reference}`, `Référence : ${reference}`)
  const catLine = L(lang, `Category: ${categoryLabel}`, `Catégorie : ${categoryLabel}`)
  const viewLine = L(
    lang,
    `View and reply to your request securely: ${ticketUrl}`,
    `Consultez votre demande et répondez-y en toute sécurité : ${ticketUrl}`,
  )
  const sign = `— ${brand}`
  const compose = (subject: string, paragraphs: string[]): RenderedEmail => ({
    subject: `${brand} — ${subject}`,
    text: [...paragraphs, disclaimer, sign].join('\n\n'),
  })

  switch (kind) {
    case 'ticket_received': {
      const target = ctx.responseTargetLabel
        ? L(
            lang,
            `Our initial-response target for this request is ${ctx.responseTargetLabel}.`,
            `Notre cible de première réponse pour cette demande est ${ctx.responseTargetLabel}.`,
          )
        : ''
      return compose(L(lang, `Request ${reference} received`, `Demande ${reference} reçue`), [
        L(
          lang,
          'Thank you — we’ve received your support request.',
          'Merci — nous avons reçu votre demande de soutien.',
        ),
        `${refLine}\n${catLine}`,
        [target, resolutionVaries].filter(Boolean).join(' '),
        noSecrets,
        viewLine,
      ])
    }
    case 'agent_reply':
      return compose(
        L(lang, `Update on request ${reference}`, `Mise à jour sur la demande ${reference}`),
        [
          L(
            lang,
            'There’s a new reply on your support request.',
            'Il y a une nouvelle réponse à votre demande de soutien.',
          ),
          refLine,
          viewLine,
          noSecrets,
        ],
      )
    case 'info_requested':
      return compose(
        L(
          lang,
          `More information needed for ${reference}`,
          `Renseignements requis pour ${reference}`,
        ),
        [
          L(
            lang,
            'We need a little more information to continue with your request.',
            'Nous avons besoin de renseignements supplémentaires pour poursuivre votre demande.',
          ),
          refLine,
          viewLine,
          noSecrets,
        ],
      )
    case 'resolved':
      return compose(L(lang, `Request ${reference} resolved`, `Demande ${reference} réglée`), [
        L(
          lang,
          'We’ve marked your request as resolved.',
          'Nous avons marqué votre demande comme réglée.',
        ),
        refLine,
        L(
          lang,
          'If this isn’t fully resolved, reply on the ticket to reopen it.',
          'Si ce n’est pas entièrement réglé, répondez au billet pour le rouvrir.',
        ),
        viewLine,
      ])
    case 'closed':
      return compose(L(lang, `Request ${reference} closed`, `Demande ${reference} fermée`), [
        L(
          lang,
          'Your request has been closed. Thank you for contacting Dutiva support.',
          'Votre demande a été fermée. Merci d’avoir communiqué avec le soutien Dutiva.',
        ),
        refLine,
        L(
          lang,
          'If you need more help, start a new request from the app.',
          'Si vous avez besoin d’aide, créez une nouvelle demande dans l’application.',
        ),
      ])
    case 'call_proposed':
      return compose(
        L(lang, `A call about request ${reference}`, `Un appel concernant la demande ${reference}`),
        [
          L(lang, CALL_NOT_GUARANTEED.en, CALL_NOT_GUARANTEED.fr),
          refLine,
          L(
            lang,
            'Open the ticket to see the proposed times and confirm what works.',
            'Ouvrez le billet pour voir les plages proposées et confirmer ce qui vous convient.',
          ),
          viewLine,
        ],
      )
    case 'call_confirmed':
      return compose(
        L(lang, `Scheduled call for ${reference}`, `Appel planifié pour ${reference}`),
        [
          L(
            lang,
            'Your call is confirmed. The appointment details are on the ticket.',
            'Votre appel est confirmé. Les détails du rendez-vous se trouvent dans le billet.',
          ),
          refLine,
          L(
            lang,
            'A written summary will be added to the ticket afterward.',
            'Un résumé écrit sera ajouté au billet par la suite.',
          ),
          viewLine,
        ],
      )
    case 'call_reminder':
      return compose(
        L(
          lang,
          `Reminder: upcoming call for ${reference}`,
          `Rappel : appel à venir pour ${reference}`,
        ),
        [
          L(
            lang,
            'This is a reminder of your upcoming scheduled call.',
            'Ceci est un rappel de votre appel planifié à venir.',
          ),
          refLine,
          L(
            lang,
            'The date, time and any video link are on the ticket.',
            'La date, l’heure et le lien vidéo, le cas échéant, se trouvent dans le billet.',
          ),
          viewLine,
        ],
      )
    case 'call_followup_needed':
      return compose(L(lang, `Follow-up needed: ${reference}`, `Suivi requis : ${reference}`), [
        L(
          lang,
          'A scheduled call for this ticket has ended. Add a written summary and update the ticket status.',
          'Un appel planifié pour ce billet est terminé. Ajoutez un résumé écrit et mettez à jour le statut du billet.',
        ),
        refLine,
        viewLine,
      ])
    case 'privacy_ack':
      return compose(
        L(
          lang,
          `Privacy request ${reference} received`,
          `Demande de confidentialité ${reference} reçue`,
        ),
        [
          L(
            lang,
            'We’ve received your privacy request. Privacy requests are handled separately from ordinary support.',
            'Nous avons reçu votre demande de confidentialité. Les demandes de confidentialité sont traitées séparément du soutien ordinaire.',
          ),
          refLine,
          L(
            lang,
            'Identity verification may be required. Please do not send identity documents by ordinary email.',
            'Une vérification d’identité peut être exigée. Veuillez ne pas envoyer de pièces d’identité par courriel ordinaire.',
          ),
          viewLine,
        ],
      )
    case 'accessibility_ack':
      return compose(
        L(
          lang,
          `Accessibility feedback ${reference} received`,
          `Rétroaction sur l’accessibilité ${reference} reçue`,
        ),
        [
          L(
            lang,
            'Thank you — we’ve received your accessibility feedback.',
            'Merci — nous avons reçu votre rétroaction sur l’accessibilité.',
          ),
          refLine,
          L(
            lang,
            'You may request an alternative communication method, including a telephone or video appointment, as an accommodation.',
            'Vous pouvez demander une autre méthode de communication, y compris un rendez-vous téléphonique ou vidéo, à titre de mesure d’adaptation.',
          ),
          viewLine,
        ],
      )
    case 'security_ack':
      return compose(
        L(
          lang,
          `Security report ${reference} received`,
          `Signalement de sécurité ${reference} reçu`,
        ),
        [
          L(
            lang,
            'Thank you for your report. It is handled with restricted visibility.',
            'Merci pour votre signalement. Il est traité avec une visibilité restreinte.',
          ),
          refLine,
          L(
            lang,
            'Please do not access other customers’ data or disrupt the service while we investigate. There is no bug bounty.',
            'Veuillez ne pas accéder aux données d’autres clients ni perturber le service pendant notre enquête. Il n’y a pas de prime aux bogues.',
          ),
          viewLine,
        ],
      )
    case 'complaint_ack':
      return compose(
        L(lang, `Your concern ${reference} received`, `Votre préoccupation ${reference} reçue`),
        [
          L(
            lang,
            'We’ve received your concern and are reviewing it separately from routine product support.',
            'Nous avons reçu votre préoccupation et l’examinons séparément du soutien ordinaire.',
          ),
          refLine,
          viewLine,
        ],
      )
    case 'operator_alert':
      return {
        subject:
          `${brand} — ${L(lang, `New ${ctx.priorityLabel ?? ''} ticket ${reference}`, `Nouveau billet ${ctx.priorityLabel ?? ''} ${reference}`)}`
            .replace(/\s+/g, ' ')
            .trim(),
        text: [`${refLine}\n${catLine}`, viewLine].join('\n\n'),
      }
    case 'beta_signup': {
      const details = [
        ctx.sourceLabel ? L(lang, `Source: ${ctx.sourceLabel}`, `Source : ${ctx.sourceLabel}`) : '',
        ctx.provinceLabel
          ? L(lang, `Jurisdiction: ${ctx.provinceLabel}`, `Territoire : ${ctx.provinceLabel}`)
          : '',
      ].filter(Boolean)
      return {
        subject: `${brand} — ${L(lang, 'New beta signup', 'Nouvelle inscription à la bêta')}`,
        text: [
          L(
            lang,
            'A new beta signup was recorded.',
            'Une nouvelle inscription à la bêta a été enregistrée.',
          ),
          details.join('\n'),
          L(
            lang,
            `Open the operator workspace: ${ticketUrl}`,
            `Ouvrez l’espace opérateur : ${ticketUrl}`,
          ),
        ]
          .filter(Boolean)
          .join('\n\n'),
      }
    }
    case 'beta_confirmation':
      return compose(L(lang, 'Beta signup received', 'Inscription à la bêta reçue'), [
        /* [FR self-authored] Beta signup notification copy has no prototype source. */
        L(
          lang,
          'Thank you — your beta signup was recorded.',
          'Merci — votre inscription à la bêta est enregistrée.',
        ),
        L(
          lang,
          "If a spot is available, we'll email access details. If the first cohort is full, you're on the waiting list.",
          'S’il reste une place, nous vous enverrons les détails d’accès par courriel. Si la première cohorte est complète, vous êtes sur la liste d’attente.',
        ),
        L(
          lang,
          'Questions? Reply to this email or contact support@dutiva.ca.',
          'Des questions? Répondez à ce courriel ou écrivez à support@dutiva.ca.',
        ),
      ])
  }
}

interface NotificationRow {
  id: string
  ticket_id: string | null
  kind: NotificationKind
  audience: 'customer' | 'operator'
  recipient: string
  language: Lang
  payload: {
    reference?: string
    category?: string
    priority?: string
    province?: string
    source?: string
  }
  attempts: number
}

const SOURCE_LABELS: Record<string, { en: string; fr: string }> = {
  landing: { en: 'Landing page', fr: 'Page d’accueil' },
  beta_page: { en: 'Beta page', fr: 'Page bêta' },
  campaign: { en: 'Campaign', fr: 'Campagne' },
}

const PROVINCE_LABELS: Record<string, { en: string; fr: string }> = {
  on: { en: 'Ontario', fr: 'Ontario' },
  qc: { en: 'Quebec', fr: 'Québec' },
  fed: { en: 'Federal / Canada-wide', fr: 'Fédéral / pancanadien' },
  other: { en: 'Other / not specified', fr: 'Autre / non précisé' },
}

function buildContext(row: NotificationRow, appUrl: string): EmailContext {
  const lang: Lang = row.language === 'fr' ? 'fr' : 'en'
  const category = row.payload.category ?? 'other'
  const priority = row.payload.priority
  const isBetaSignup = row.kind === 'beta_signup' || row.kind === 'beta_confirmation'
  const ticketPath = isBetaSignup
    ? '/app/support/admin'
    : row.audience === 'operator'
      ? `/app/support/admin/${row.ticket_id ?? ''}`
      : `/app/support/requests/${row.ticket_id ?? ''}`
  return {
    language: lang,
    reference: row.payload.reference ?? '',
    ticketUrl: `${appUrl}${ticketPath}`,
    categoryLabel: CATEGORY_LABELS[category]?.[lang] ?? category,
    responseTargetLabel: priority ? RESPONSE_TARGET_LABELS[priority]?.[lang] : undefined,
    priorityLabel: priority ? PRIORITY_LABELS[priority]?.[lang] : undefined,
    sourceLabel: row.payload.source
      ? (SOURCE_LABELS[row.payload.source]?.[lang] ?? row.payload.source)
      : undefined,
    provinceLabel: row.payload.province
      ? (PROVINCE_LABELS[row.payload.province]?.[lang] ?? row.payload.province)
      : undefined,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  // Restrict invocation to the scheduler/operator when a secret is configured.
  const requiredSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET')
  if (requiredSecret && req.headers.get('x-notify-secret') !== requiredSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const appUrl = (Deno.env.get('SITE_URL') ?? 'https://dutiva.ca').replace(/\/+$/, '')
  // `RESEND_API_KEY` is the name actually set on the project and says what it is;
  // `SUPPORT_EMAIL_PROVIDER_API_KEY` stays supported as the provider-agnostic
  // fallback so swapping providers doesn't force a secret rename.
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  const from = Deno.env.get('SUPPORT_EMAIL_FROM') ?? 'Dutiva Support <support@dutiva.ca>'

  // Fail closed: never expose an unauthenticated send endpoint. If a provider is
  // configured, a notify secret must be too (see docs/SUPPORT_RUNBOOK.md).
  if (apiKey && !requiredSecret) {
    return json({ error: 'SUPPORT_NOTIFY_SECRET must be set when a provider is configured' }, 403)
  }

  const { data: rows, error } = await admin
    .from('support_notifications')
    .select('id, ticket_id, kind, audience, recipient, language, payload, attempts')
    .eq('status', 'pending')
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)
  if (error) return json({ error: error.message }, 500)

  const pending = (rows ?? []) as NotificationRow[]

  // No provider configured → leave everything pending (do not drop). Wiring the
  // key later flushes the backlog.
  if (!apiKey) {
    console.info(
      `[support-notify] no provider configured; ${pending.length} pending left untouched`,
    )
    return json({ processed: 0, pending: pending.length, note: 'no_provider' })
  }

  const nowIso = new Date().toISOString()
  let sent = 0
  let failed = 0

  for (const row of pending) {
    try {
      const email = renderNotificationEmail(row.kind, buildContext(row, appUrl))
      const providerMessageId = await resendSend(apiKey, from, {
        to: row.recipient,
        subject: email.subject,
        text: email.text,
      })
      await admin
        .from('support_notifications')
        .update({
          status: 'sent',
          sent_at: nowIso,
          attempts: row.attempts + 1,
          last_error: null,
          provider_message_id: providerMessageId,
        })
        .eq('id', row.id)
      sent++
    } catch (e) {
      const attempts = row.attempts + 1
      const giveUp = attempts >= MAX_ATTEMPTS
      await admin
        .from('support_notifications')
        .update({
          status: giveUp ? 'failed' : 'pending',
          attempts,
          last_error: String(e instanceof Error ? e.message : e).slice(0, 500),
        })
        .eq('id', row.id)
      failed++
    }
  }

  return json({ processed: pending.length, sent, failed })
})
