import { useId, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import {
  IMPACT_LABELS,
  RESPONSE_METHOD_LABELS,
  SUPPORT_CATEGORIES,
  URGENCY_LABELS,
  supportChannel,
} from '@/config/support'
import type {
  ResponseMethod,
  SupportCategory,
  SupportImpact,
  SupportUrgency,
} from '@/config/support'
import { createSupportTicket } from './supportApi'
import { gatherDiagnostics, diagnosticRows } from './diagnostics'
import { FirstLineSuggestions } from './FirstLineSuggestions'
import { trackEvent } from './analytics/supportAnalytics'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'

/**
 * Authenticated support request form. Server-side validation, priority, and
 * restricted-visibility handling live in the create-support-ticket edge
 * function; this collects the request accessibly, shows the sensitive-info
 * warning and the exact diagnostic context (reviewable/removable), and adapts
 * to the chosen category (account-access, billing, accessibility, security,
 * privacy). Categories never let a customer set legal severity or priority.
 */

const IMPACTS: SupportImpact[] = ['blocking', 'major', 'minor', 'none']
const URGENCIES: SupportUrgency[] = ['urgent', 'soon', 'whenever']
const METHODS: ResponseMethod[] = ['email', 'in_app', 'scheduled_call']

function Field({
  id,
  label,
  error,
  children,
  hint,
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

const selectClass =
  'w-full rounded-[9px] border border-border bg-surface px-[12px] py-[10px] text-[14px] text-text'
const inputClass = selectClass
const textareaClass = `${selectClass} min-h-[120px] resize-y`

export function SupportRequestForm() {
  const { x, lang } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const baseId = useId()
  const fid = (name: string) => `${baseId}-${name}`

  const [category, setCategory] = useState<SupportCategory | ''>('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [impact, setImpact] = useState<SupportImpact>('none')
  const [urgency, setUrgency] = useState<SupportUrgency>('whenever')
  const [language, setLanguage] = useState<'en' | 'fr'>(lang)
  const [responseMethod, setResponseMethod] = useState<ResponseMethod>('email')
  const [canSignIn, setCanSignIn] = useState('')
  const [billingRef, setBillingRef] = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true)
  const [consent, setConsent] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const diagnostics = useMemo(() => gatherDiagnostics({ lang }), [lang])
  const rows = useMemo(() => diagnosticRows(diagnostics), [diagnostics])

  function reset() {
    setCategory('')
    setSubject('')
    setDescription('')
    setImpact('none')
    setUrgency('whenever')
    setResponseMethod('email')
    setCanSignIn('')
    setBillingRef('')
    setAccommodation('')
    setConsent(false)
    setErrors({})
    setSubmitError(null)
    setReference(null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!subject.trim()) next.subject = x(M.support_err_subject)
    if (!description.trim()) next.description = x(M.support_err_description)
    if (!consent) next.consent = x(M.support_err_consent)
    setErrors(next)
    if (Object.keys(next).length > 0 || category === '') return

    /* Category-specific answers travel as labelled lines the founder sees in
       the ticket; the free-text description stays the customer's own words. */
    const extras: string[] = []
    if (category === 'account_access' && canSignIn) {
      extras.push(`${x(M.support_cond_account_signin)} ${canSignIn}`)
    }
    if (category === 'billing' && billingRef.trim()) {
      extras.push(`${x(M.support_cond_billing_ref)}: ${billingRef.trim()}`)
    }
    if (category === 'accessibility' && accommodation.trim()) {
      extras.push(`${x(M.support_cond_accessibility)} ${accommodation.trim()}`)
    }
    const fullDescription =
      extras.length > 0 ? `${description.trim()}\n\n${extras.join('\n')}` : description.trim()

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createSupportTicket({
        category,
        subject: subject.trim(),
        description: fullDescription,
        impact,
        urgency,
        language,
        preferredResponseMethod: responseMethod,
        diagnostics: includeDiagnostics ? diagnostics : {},
      })
      setReference(result.publicReference)
      trackEvent({
        event_type: 'ticket_submitted',
        workspace_id: organizationId,
        ticket_reference: result.publicReference,
        ticket_category: category,
        ticket_source: 'app_form',
        locale: language,
      })
      requestAnimationFrame(() => successRef.current?.focus())
    } catch (error) {
      console.error('support: request failed', error)
      setSubmitError(x(M.support_err_generic))
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="rounded-[16px] border border-ok-border bg-ok-bg p-[24px]"
        role="status"
      >
        <h2 className="m-0 mb-[8px] font-display text-[18px] font-semibold text-text">
          {x(M.support_success_title)}
        </h2>
        <p className="m-0 mb-[12px] text-[14px] leading-[1.55] text-text-2">
          {x(M.support_success_body)}
        </p>
        <p className="m-0 mb-[16px] text-[14px] text-text">
          {x(M.support_success_reference)}:{' '}
          <span className="font-mono font-semibold">{reference}</span>
        </p>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-[9px] border border-border bg-surface px-[16px] py-[9px] text-[13.5px] font-semibold text-text-2"
        >
          {x(M.support_success_new)}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
      <p className="m-0 text-[14px] leading-[1.55] text-text-3">{x(M.support_form_intro)}</p>

      <Field id={fid('category')} label={x(M.support_field_category)}>
        <select
          id={fid('category')}
          value={category}
          onChange={(e) => setCategory(e.target.value as SupportCategory)}
          className={selectClass}
        >
          <option value="" disabled>
            {x(M.support_choose)}
          </option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {x(c.label)}
            </option>
          ))}
        </select>
      </Field>

      {category === 'security' && (
        <p
          role="note"
          className="m-0 rounded-[10px] border border-risk-border bg-risk-bg px-[14px] py-[12px] text-[13px] leading-[1.5] text-risk-fg"
        >
          {x(M.support_security_warning)}
        </p>
      )}
      {category === 'privacy' && (
        <p
          role="note"
          className="m-0 rounded-[10px] border border-border bg-inset px-[14px] py-[12px] text-[13px] leading-[1.5] text-text-2"
        >
          {x(M.support_privacy_notice)}
        </p>
      )}

      {category === 'account_access' && (
        <Field id={fid('signin')} label={x(M.support_cond_account_signin)}>
          <select
            id={fid('signin')}
            value={canSignIn}
            onChange={(e) => setCanSignIn(e.target.value)}
            className={selectClass}
          >
            <option value="">{x(M.support_choose)}</option>
            <option value={x(M.support_cond_account_yes)}>{x(M.support_cond_account_yes)}</option>
            <option value={x(M.support_cond_account_no)}>{x(M.support_cond_account_no)}</option>
          </select>
        </Field>
      )}

      <Field id={fid('subject')} label={x(M.support_field_subject)} error={errors.subject}>
        <input
          id={fid('subject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? `${fid('subject')}-error` : undefined}
          className={inputClass}
        />
      </Field>

      {category === 'billing' && (
        <Field
          id={fid('billingref')}
          label={`${x(M.support_cond_billing_ref)} (${x(M.support_optional)})`}
        >
          <input
            id={fid('billingref')}
            value={billingRef}
            onChange={(e) => setBillingRef(e.target.value)}
            maxLength={120}
            className={inputClass}
          />
        </Field>
      )}
      {category === 'accessibility' && (
        <Field
          id={fid('accommodation')}
          label={`${x(M.support_cond_accessibility)} (${x(M.support_optional)})`}
        >
          <input
            id={fid('accommodation')}
            value={accommodation}
            onChange={(e) => setAccommodation(e.target.value)}
            maxLength={300}
            className={inputClass}
          />
        </Field>
      )}

      <Field
        id={fid('description')}
        label={x(M.support_field_description)}
        error={errors.description}
        hint={
          <p className="m-0 rounded-[10px] border border-gold-border bg-gold-bg px-[12px] py-[10px] text-[12.5px] leading-[1.5] text-gold-fg">
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

      <FirstLineSuggestions
        query={`${subject} ${description}`}
        category={category}
        allowGenerative
      />

      <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2">
        <Field id={fid('impact')} label={x(M.support_field_impact)}>
          <select
            id={fid('impact')}
            value={impact}
            onChange={(e) => setImpact(e.target.value as SupportImpact)}
            className={selectClass}
          >
            {IMPACTS.map((i) => (
              <option key={i} value={i}>
                {x(IMPACT_LABELS[i])}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fid('urgency')} label={x(M.support_field_urgency)}>
          <select
            id={fid('urgency')}
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as SupportUrgency)}
            className={selectClass}
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {x(URGENCY_LABELS[u])}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fid('language')} label={x(M.support_field_language)}>
          <select
            id={fid('language')}
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
            className={selectClass}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </Field>
        <Field id={fid('method')} label={x(M.support_field_response_method)}>
          <select
            id={fid('method')}
            value={responseMethod}
            onChange={(e) => setResponseMethod(e.target.value as ResponseMethod)}
            className={selectClass}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {x(RESPONSE_METHOD_LABELS[m])}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Diagnostic context — visible and removable before submit. */}
      <div className="rounded-[12px] border border-border bg-inset px-[14px] py-[12px]">
        <label className="flex items-start gap-[10px]">
          <input
            type="checkbox"
            checked={includeDiagnostics}
            onChange={(e) => setIncludeDiagnostics(e.target.checked)}
            className="mt-[3px]"
          />
          <span className="text-[13px] leading-[1.5] text-text-2">
            {x(M.support_diagnostics_toggle)}
          </span>
        </label>
        {includeDiagnostics && rows.length > 0 && (
          <dl className="mt-[10px] grid grid-cols-[auto_1fr] gap-x-[14px] gap-y-[4px] text-[12.5px]">
            {rows.map((r) => (
              <div key={r.key} className="contents">
                <dt className="font-semibold text-text-muted">{r.key}</dt>
                <dd className="m-0 truncate text-text-3">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
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

      {submitError && (
        <p
          role="alert"
          className="m-0 rounded-[10px] border border-risk-border bg-risk-bg px-[14px] py-[12px] text-[13px] text-risk-fg"
        >
          {submitError}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-[9px] border-none bg-navy px-[22px] py-[12px] text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {submitting ? x(M.support_submitting) : x(M.support_submit)}
        </button>
      </div>
      <p className="m-0 text-[12px] text-text-faint">{supportChannel('support').email}</p>
    </form>
  )
}
