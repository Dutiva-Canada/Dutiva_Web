import type { Lang } from '@/i18n/core'
import { pickL } from '@/i18n/core'
import { supportMessages } from '@/i18n/messages/support'
import { common } from '@/i18n/messages/common'

/**
 * Bilingual support email templates. Pure functions — no I/O — so they're fully
 * unit-tested and reused by the (future) send worker. Rules enforced here:
 *   • Subjects never contain the description or any PII — only the public
 *     reference and the message kind.
 *   • Bodies link back to the authenticated ticket (a secure link), never
 *     embed sensitive content, and reuse the approved i18n copy where it exists.
 * The actual send is a separate provider adapter (emailService.ts); none is
 * wired yet — see docs/SUPPORT_ARCHITECTURE.md.
 */

export type NotificationKind =
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

export interface EmailContext {
  language: Lang
  reference: string
  /** Secure link back to the authenticated ticket or operator workspace. */
  ticketUrl: string
  /** Already-localized category label. */
  categoryLabel: string
  /** Localized initial-response target (e.g. "within 2 business days"). */
  responseTargetLabel?: string
  /** Localized priority — operator_alert only. */
  priorityLabel?: string
  /** Localized beta signup source — beta_signup only. */
  sourceLabel?: string
  /** Localized jurisdiction label — beta_signup only. */
  provinceLabel?: string
}

export interface RenderedEmail {
  subject: string
  text: string
}

const pick = (lang: Lang, en: string, fr: string): string => (lang === 'fr' ? fr : en)
const BRAND = (lang: Lang) => pick(lang, 'Dutiva Support', 'Soutien Dutiva')

export function renderSupportEmail(kind: NotificationKind, ctx: EmailContext): RenderedEmail {
  const { language: lang, reference, ticketUrl, categoryLabel } = ctx
  const noSecrets = pickL(supportMessages.support_ack_no_secrets, lang)
  const resolutionVaries = pickL(supportMessages.support_ack_resolution_varies, lang)
  const disclaimer = pickL(common.disclaimer, lang)
  const refLine = pick(lang, `Reference: ${reference}`, `Référence : ${reference}`)
  const catLine = pick(lang, `Category: ${categoryLabel}`, `Catégorie : ${categoryLabel}`)
  const viewLine = pick(
    lang,
    `View and reply to your request securely: ${ticketUrl}`,
    `Consultez votre demande et répondez-y en toute sécurité : ${ticketUrl}`,
  )
  const sign = pick(lang, `— ${BRAND(lang)}`, `— ${BRAND(lang)}`)
  const compose = (subject: string, paragraphs: string[]): RenderedEmail => ({
    subject: `${BRAND(lang)} — ${subject}`,
    text: [...paragraphs, disclaimer, sign].join('\n\n'),
  })

  switch (kind) {
    case 'ticket_received': {
      const target = ctx.responseTargetLabel
        ? pick(
            lang,
            `Our initial-response target for this request is ${ctx.responseTargetLabel}.`,
            `Notre cible de première réponse pour cette demande est ${ctx.responseTargetLabel}.`,
          )
        : ''
      return compose(pick(lang, `Request ${reference} received`, `Demande ${reference} reçue`), [
        pick(
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
        pick(lang, `Update on request ${reference}`, `Mise à jour sur la demande ${reference}`),
        [
          pick(
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
        pick(
          lang,
          `More information needed for ${reference}`,
          `Renseignements requis pour ${reference}`,
        ),
        [
          pick(
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
      return compose(pick(lang, `Request ${reference} resolved`, `Demande ${reference} réglée`), [
        pick(
          lang,
          'We’ve marked your request as resolved.',
          'Nous avons marqué votre demande comme réglée.',
        ),
        refLine,
        pick(
          lang,
          'If this isn’t fully resolved, reply on the ticket to reopen it.',
          'Si ce n’est pas entièrement réglé, répondez au billet pour le rouvrir.',
        ),
        viewLine,
      ])
    case 'closed':
      return compose(pick(lang, `Request ${reference} closed`, `Demande ${reference} fermée`), [
        pick(
          lang,
          'Your request has been closed. Thank you for contacting Dutiva support.',
          'Votre demande a été fermée. Merci d’avoir communiqué avec le soutien Dutiva.',
        ),
        refLine,
        pick(
          lang,
          'If you need more help, start a new request from the app.',
          'Si vous avez besoin d’aide, créez une nouvelle demande dans l’application.',
        ),
      ])
    case 'call_proposed':
      return compose(
        pick(
          lang,
          `A call about request ${reference}`,
          `Un appel concernant la demande ${reference}`,
        ),
        [
          pickL(supportMessages.support_call_not_guaranteed, lang),
          refLine,
          pick(
            lang,
            'Open the ticket to see the proposed times and confirm what works.',
            'Ouvrez le billet pour voir les plages proposées et confirmer ce qui vous convient.',
          ),
          viewLine,
        ],
      )
    case 'call_confirmed':
      return compose(
        pick(lang, `Scheduled call for ${reference}`, `Appel planifié pour ${reference}`),
        [
          pick(
            lang,
            'Your call is confirmed. The appointment details are on the ticket.',
            'Votre appel est confirmé. Les détails du rendez-vous se trouvent dans le billet.',
          ),
          refLine,
          pick(
            lang,
            'A written summary will be added to the ticket afterward.',
            'Un résumé écrit sera ajouté au billet par la suite.',
          ),
          viewLine,
        ],
      )
    case 'call_reminder':
      return compose(
        pick(
          lang,
          `Reminder: upcoming call for ${reference}`,
          `Rappel : appel à venir pour ${reference}`,
        ),
        [
          pick(
            lang,
            'This is a reminder of your upcoming scheduled call.',
            'Ceci est un rappel de votre appel planifié à venir.',
          ),
          refLine,
          pick(
            lang,
            'The date, time and any video link are on the ticket.',
            'La date, l’heure et le lien vidéo, le cas échéant, se trouvent dans le billet.',
          ),
          viewLine,
        ],
      )
    case 'call_followup_needed':
      return compose(pick(lang, `Follow-up needed: ${reference}`, `Suivi requis : ${reference}`), [
        pick(
          lang,
          'A scheduled call for this ticket has ended. Add a written summary and update the ticket status.',
          'Un appel planifié pour ce billet est terminé. Ajoutez un résumé écrit et mettez à jour le statut du billet.',
        ),
        refLine,
        viewLine,
      ])
    case 'privacy_ack':
      return compose(
        pick(
          lang,
          `Privacy request ${reference} received`,
          `Demande de confidentialité ${reference} reçue`,
        ),
        [
          pick(
            lang,
            'We’ve received your privacy request. Privacy requests are handled separately from ordinary support.',
            'Nous avons reçu votre demande de confidentialité. Les demandes de confidentialité sont traitées séparément du soutien ordinaire.',
          ),
          refLine,
          pick(
            lang,
            'Identity verification may be required. Please do not send identity documents by ordinary email.',
            'Une vérification d’identité peut être exigée. Veuillez ne pas envoyer de pièces d’identité par courriel ordinaire.',
          ),
          viewLine,
        ],
      )
    case 'accessibility_ack':
      return compose(
        pick(
          lang,
          `Accessibility feedback ${reference} received`,
          `Rétroaction sur l’accessibilité ${reference} reçue`,
        ),
        [
          pick(
            lang,
            'Thank you — we’ve received your accessibility feedback.',
            'Merci — nous avons reçu votre rétroaction sur l’accessibilité.',
          ),
          refLine,
          pick(
            lang,
            'You may request an alternative communication method, including a telephone or video appointment, as an accommodation.',
            'Vous pouvez demander une autre méthode de communication, y compris un rendez-vous téléphonique ou vidéo, à titre de mesure d’adaptation.',
          ),
          viewLine,
        ],
      )
    case 'security_ack':
      return compose(
        pick(
          lang,
          `Security report ${reference} received`,
          `Signalement de sécurité ${reference} reçu`,
        ),
        [
          pick(
            lang,
            'Thank you for your report. It is handled with restricted visibility.',
            'Merci pour votre signalement. Il est traité avec une visibilité restreinte.',
          ),
          refLine,
          pick(
            lang,
            'Please do not access other customers’ data or disrupt the service while we investigate. There is no bug bounty.',
            'Veuillez ne pas accéder aux données d’autres clients ni perturber le service pendant notre enquête. Il n’y a pas de prime aux bogues.',
          ),
          viewLine,
        ],
      )
    case 'complaint_ack':
      return compose(
        pick(lang, `Your concern ${reference} received`, `Votre préoccupation ${reference} reçue`),
        [
          pick(
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
          `${BRAND(lang)} — ${pick(lang, `New ${ctx.priorityLabel ?? ''} ticket ${reference}`, `Nouveau billet ${ctx.priorityLabel ?? ''} ${reference}`)}`
            .replace(/\s+/g, ' ')
            .trim(),
        text: [`${refLine}\n${catLine}`, viewLine].join('\n\n'),
      }
    case 'beta_signup': {
      const details = [
        ctx.sourceLabel
          ? pick(lang, `Source: ${ctx.sourceLabel}`, `Source : ${ctx.sourceLabel}`)
          : '',
        ctx.provinceLabel
          ? pick(lang, `Jurisdiction: ${ctx.provinceLabel}`, `Territoire : ${ctx.provinceLabel}`)
          : '',
      ].filter(Boolean)
      return {
        subject: `${BRAND(lang)} — ${pick(lang, 'New beta signup', 'Nouvelle inscription à la bêta')}`,
        text: [
          pick(
            lang,
            'A new beta signup was recorded.',
            'Une nouvelle inscription à la bêta a été enregistrée.',
          ),
          details.join('\n'),
          pick(
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
      return compose(pick(lang, 'Beta signup received', 'Inscription à la bêta reçue'), [
        /* [FR self-authored] Beta signup notification copy has no prototype source. */
        pick(
          lang,
          'Thank you — your beta signup was recorded.',
          'Merci — votre inscription à la bêta est enregistrée.',
        ),
        pick(
          lang,
          "If a spot is available, we'll email access details. If the first cohort is full, you're on the waiting list.",
          'S’il reste une place, nous vous enverrons les détails d’accès par courriel. Si la première cohorte est complète, vous êtes sur la liste d’attente.',
        ),
        pick(
          lang,
          'Questions? Reply to this email or contact support@dutiva.ca.',
          'Des questions? Répondez à ce courriel ou écrivez à support@dutiva.ca.',
        ),
      ])
  }
}
