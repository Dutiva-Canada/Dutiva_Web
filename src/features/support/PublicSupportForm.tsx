import { useId, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import {
  IMPACT_LABELS,
  RESPONSE_METHOD_LABELS,
  SUPPORT_CATEGORIES,
  URGENCY_LABELS,
} from '@/config/support'
import type { SupportCategory, SupportImpact, SupportUrgency } from '@/config/support'
import { createPublicSupportTicket, PublicSupportError } from './publicSupportApi'
import { FirstLineSuggestions } from './FirstLineSuggestions'
import { CaptchaField } from './CaptchaField'
import { isCaptchaConfigured } from './captcha'
import { trackEvent } from './analytics/supportAnalytics'

/**
 * PUBLIC (unauthenticated) support form for the marketing-surface Contact page.
 * A sibling of the in-app SupportRequestForm, but signed-out: it collects an
 * email, offers only the `allowPublic` categories (so accessibility/privacy/
 * security reports never require a login), carries no diagnostics or workspace
 * context, and includes a honeypot. The server (create-public-support-ticket)
 * re-validates, rate-limits, and assigns priority.
 *
 * Marketing-surface tokens only (bg/border/text/text-2/text-3, risk-*,
 * gold-subtle) — app-surface tokens like bg-surface/gold-bg are undefined here.
 */

const IMPACTS: SupportImpact[] = ['blocking', 'major', 'minor', 'none']
const URGENCIES: SupportUrgency[] = ['urgent', 'soon', 'whenever']
const METHODS = ['email', 'scheduled_call'] as const
const PUBLIC_CATEGORIES = SUPPORT_CATEGORIES.filter((c) => c.allowPublic)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const controlClass =
  'w-full rounded-[9px] border border-control-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none focus-visible:border-gold-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-strong'
const textareaClass = `${controlClass} min-h-[130px] resize-y`

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  readonly id: string
  readonly label: string
  readonly error?: string
  readonly hint?: ReactNode
  readonly children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="text-[13px] font-semibold text-text-2">
        {label}
      </label>
      {children}
      {hint}
      {error && (
        <p id={`${id}-error`} role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}
    </div>
  )
}

export function PublicSupportForm({ initialTopic }: { readonly initialTopic?: SupportCategory }) {
  const { x, lang } = useI18n()
  const baseId = useId()
  const fid = (name: string) => `${baseId}-${name}`

  const [category, setCategory] = useState<SupportCategory | ''>(
    initialTopic && PUBLIC_CATEGORIES.some((c) => c.id === initialTopic) ? initialTopic : '',
  )
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [impact, setImpact] = useState<SupportImpact>('none')
  const [urgency, setUrgency] = useState<SupportUrgency>('whenever')
  const [language, setLanguage] = useState<'en' | 'fr'>(lang)
  const [responseMethod, setResponseMethod] = useState<'email' | 'scheduled_call'>('email')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  /* Bumped to force a fresh challenge — a token is single-use, so a rejected
     submit leaves the current one spent. */
  const [captchaReset, setCaptchaReset] = useState(0)
  const captchaRequired = isCaptchaConfigured()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ reference: string | null } | null>(null)

  function reset() {
    setCategory('')
    setEmail('')
    setSubject('')
    setDescription('')
    setAccommodation('')
    setImpact('none')
    setUrgency('whenever')
    setResponseMethod('email')
    setConsent(false)
    setErrors({})
    setSubmitError(null)
    setDone(null)
    setCaptchaToken(null)
    setCaptchaReset((n) => n + 1)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!EMAIL_RE.test(email.trim())) next.email = x(M.support_err_email)
    if (!subject.trim()) next.subject = x(M.support_err_subject)
    if (!description.trim()) next.description = x(M.support_err_description)
    if (!consent) next.consent = x(M.support_err_consent)
    if (captchaRequired && !captchaToken) next.captcha = x(M.support_err_captcha_required)
    setErrors(next)
    if (Object.keys(next).length > 0 || category === '') return

    const extras: string[] = []
    if (category === 'accessibility' && accommodation.trim()) {
      extras.push(`${x(M.support_cond_accessibility)} ${accommodation.trim()}`)
    }
    const fullDescription =
      extras.length > 0 ? `${description.trim()}\n\n${extras.join('\n')}` : description.trim()

    setSubmitting(true)
    setSubmitError(null)
    try {
      const reference = await createPublicSupportTicket({
        category,
        email: email.trim(),
        subject: subject.trim(),
        description: fullDescription,
        impact,
        urgency,
        language,
        preferredResponseMethod: responseMethod,
        consent,
        honeypot,
        captchaToken,
      })
      setDone({ reference })
      if (reference) {
        trackEvent({
          event_type: 'ticket_submitted',
          ticket_reference: reference,
          ticket_category: category,
          ticket_source: 'public_form',
          locale: language,
        })
      }
    } catch (error) {
      const code = error instanceof PublicSupportError ? error.code : 'error'
      setSubmitError(
        x(
          code === 'rate_limited'
            ? M.support_err_rate_limited
            : code === 'captcha'
              ? M.support_err_captcha_failed
              : M.support_err_generic,
        ),
      )
      // The token is spent whether or not it verified, so any failed attempt
      // needs a fresh challenge before the customer can resubmit.
      setCaptchaToken(null)
      setCaptchaReset((n) => n + 1)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div role="status" tabIndex={-1} className="premium-card-soft p-[24px]">
        <div className="mb-[8px] flex items-center gap-2 text-gold-strong">
          <CheckCircle2 size={20} aria-hidden="true" />
          <h2 className="m-0 font-display text-[18px] font-semibold text-text">
            {x(M.support_success_title)}
          </h2>
        </div>
        <p className="m-0 mb-[12px] text-[14px] leading-[1.55] text-text-2">
          {x(M.support_public_success_body)}
        </p>
        {done.reference && (
          <p className="m-0 mb-[16px] text-[14px] text-text">
            {x(M.support_success_reference)}:{' '}
            <span className="font-mono font-semibold">{done.reference}</span>
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-[9px] border border-control-border bg-bg px-[16px] py-[9px] text-[13.5px] font-semibold text-text-2"
        >
          {x(M.support_success_new)}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
      {/* Honeypot: off-screen, not announced, never tab-focusable. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fid('fax')}>Do not fill this field</label>
        <input
          id={fid('fax')}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <Field id={fid('category')} label={x(M.support_field_category)}>
        <select
          id={fid('category')}
          value={category}
          onChange={(e) => setCategory(e.target.value as SupportCategory)}
          className={controlClass}
        >
          <option value="" disabled>
            {x(M.support_choose)}
          </option>
          {PUBLIC_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {x(c.label)}
            </option>
          ))}
        </select>
      </Field>

      {category === 'security' && (
        <p role="note" className="m-0 rounded-[10px] border border-risk-border bg-risk-bg px-[14px] py-[12px] text-[13px] leading-[1.5] text-risk-fg">
          {x(M.support_security_warning)}
        </p>
      )}
      {category === 'privacy' && (
        <p role="note" className="premium-card-soft m-0 px-[14px] py-[12px] text-[13px] leading-[1.5] text-text-2">
          {x(M.support_privacy_notice)}
        </p>
      )}

      <Field
        id={fid('email')}
        label={x(M.support_field_email)}
        error={errors.email}
        hint={<p className="m-0 text-[12px] leading-[1.5] text-text-3">{x(M.support_field_email_hint)}</p>}
      >
        <input
          id={fid('email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${fid('email')}-error` : undefined}
          className={controlClass}
        />
      </Field>

      <Field id={fid('subject')} label={x(M.support_field_subject)} error={errors.subject}>
        <input
          id={fid('subject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? `${fid('subject')}-error` : undefined}
          className={controlClass}
        />
      </Field>

      {category === 'accessibility' && (
        <Field id={fid('accommodation')} label={`${x(M.support_cond_accessibility)} (${x(M.support_optional)})`}>
          <input
            id={fid('accommodation')}
            value={accommodation}
            onChange={(e) => setAccommodation(e.target.value)}
            maxLength={300}
            className={controlClass}
          />
        </Field>
      )}

      <Field
        id={fid('description')}
        label={x(M.support_field_description)}
        error={errors.description}
        hint={
          <p className="m-0 rounded-[10px] border border-border bg-gold-subtle px-[12px] py-[10px] text-[12.5px] leading-[1.5] text-text-2">
            {x(M.support_sensitive_warning)}
          </p>
        }
      >
        <textarea
          id={fid('description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={20000}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? `${fid('description')}-error` : undefined}
          className={textareaClass}
        />
      </Field>

      <FirstLineSuggestions query={`${subject} ${description}`} category={category} />

      <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2">
        <Field id={fid('impact')} label={x(M.support_field_impact)}>
          <select id={fid('impact')} value={impact} onChange={(e) => setImpact(e.target.value as SupportImpact)} className={controlClass}>
            {IMPACTS.map((i) => (
              <option key={i} value={i}>
                {x(IMPACT_LABELS[i])}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fid('urgency')} label={x(M.support_field_urgency)}>
          <select id={fid('urgency')} value={urgency} onChange={(e) => setUrgency(e.target.value as SupportUrgency)} className={controlClass}>
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {x(URGENCY_LABELS[u])}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fid('language')} label={x(M.support_field_language)}>
          <select id={fid('language')} value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')} className={controlClass}>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </Field>
        <Field id={fid('method')} label={x(M.support_field_response_method)}>
          <select id={fid('method')} value={responseMethod} onChange={(e) => setResponseMethod(e.target.value as 'email' | 'scheduled_call')} className={controlClass}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {x(RESPONSE_METHOD_LABELS[m])}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="flex items-start gap-[10px]">
          <input
            id={fid('consent')}
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? `${fid('consent')}-error` : undefined}
            className="mt-[3px]"
          />
          <span className="text-[13px] leading-[1.5] text-text-2">{x(M.support_consent)}</span>
        </label>
        {errors.consent && (
          <p id={`${fid('consent')}-error`} role="alert" className="m-0 text-[12.5px] text-risk-fg">
            {errors.consent}
          </p>
        )}
      </div>

      {/* Nothing at all when unconfigured — an empty wrapper would still take a
          gap from the form's flex column. */}
      {captchaRequired && (
        <div className="flex flex-col gap-[6px]">
          <CaptchaField onToken={setCaptchaToken} resetSignal={captchaReset} />
          {errors.captcha && (
            <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
              {errors.captcha}
            </p>
          )}
        </div>
      )}

      {submitError && (
        <p role="alert" className="m-0 rounded-[10px] border border-risk-border bg-risk-bg px-[14px] py-[12px] text-[13px] text-risk-fg">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={submitting}
          className="gold-button gold-button-lg disabled:opacity-60"
        >
          {submitting ? x(M.support_submitting) : x(M.support_submit)}
        </button>
        <span className="text-[12.5px] text-text-3">
          {x(M.support_public_account_note)}{' '}
          <Link to="/app/welcome" className="font-semibold text-gold-strong hover:opacity-80">
            {x(M.support_public_account_link)}
          </Link>
        </span>
      </div>
    </form>
  )
}
